import Anthropic from "@anthropic-ai/sdk";
import JSON5 from "json5";
import {
  callScriptSchema,
  clientProfileSchema,
  type CallScript,
  type ClientProfile
} from "@/lib/schema";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

function extractionPrompt(corpus: string, website: string): string {
  return `
You are an AI assistant helping a client onboarding team.
Analyze the provided website content and extract a structured business profile.

Rules:
- Use only the provided content as evidence.
- Infer carefully when reasonable, but do not hallucinate unsupported facts.
- If a field is unknown, return null for strings, [] for arrays.
- Preserve the original language from the source content for all extracted text.
- Do not translate Hebrew content into English.
- Keep list items (services, reviews, missing info, onboarding actions) in the same language used on the site.
- website must be the provided website URL unless a better canonical URL is clearly shown.
- Return JSON only (no markdown or code fences).

Return an object with exactly these keys:
- onboardingSummary
- businessSnapshot
- commercialSnapshot
- businessName
- businessDescription
- industry
- location
- contactEmail
- contactPhone
- website
- mainServices
- targetAudience
- brandTone
- socialLinks
- imageUrls
- reviewMentions
- reviewInsights

reviewInsights shape:
{
  "sentimentSummary": "Positive" | "Neutral" | "Negative",
  "summary": "1-2 sentences",
  "examples": ["short example", "short example"]
}

businessSnapshot shape:
{
  "rating": number | null,
  "reviewCount": number | null,
  "openNow": boolean | null,
  "businessHours": ["string"]
}

commercialSnapshot shape:
{
  "priceRange": "string | null",
  "serviceAreas": ["string"]
}

Additional constraints:
- onboardingSummary: 2-3 short sentences for internal onboarding teams.
- Keep review examples short and capped.
- Extract businessSnapshot and commercialSnapshot only when evidence exists.

Website: ${website}

Content:
${corpus}
`.trim();
}

function extractTextContent(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function stripCodeFences(value: string): string {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function normalizeJsonText(value: string): string {
  // Remove common trailing-comma mistakes before } or ]
  return value.replace(/,\s*([}\]])/g, "$1");
}

function extractLikelyJson(value: string): string {
  const trimmed = value.trim();
  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }
  return trimmed;
}

function parseModelJson(rawText: string): unknown {
  const base = normalizeJsonText(stripCodeFences(rawText));
  try {
    return JSON.parse(base);
  } catch {
    const extracted = normalizeJsonText(extractLikelyJson(base));
    try {
      return JSON.parse(extracted);
    } catch {
      try {
        return JSON5.parse(extracted);
      } catch {
        throw new Error("MODEL_JSON_PARSE_FAILED");
      }
    }
  }
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asNullableBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (["true", "open", "yes"].includes(lower)) return true;
    if (["false", "closed", "no"].includes(lower)) return false;
  }
  return null;
}

function asUrlArray(value: unknown): string[] {
  return asStringArray(value).filter((item) => {
    try {
      new URL(item);
      return true;
    } catch {
      return false;
    }
  });
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function hasActionKeyword(value: string): boolean {
  const lower = value.toLowerCase();
  const actionKeywords = [
    "install",
    "installation",
    "repair",
    "maintenance",
    "service",
    "support",
    "consult",
    "setup",
    "upgrade",
    "fix",
    "התקנה",
    "תיקון",
    "שירות",
    "תחזוקה",
    "ייעוץ",
    "שדרוג",
    "החלפה"
  ];
  return actionKeywords.some((keyword) => lower.includes(keyword));
}

function normalizeMainServices(value: unknown): string[] {
  const services = asStringArray(value);
  if (services.length <= 1) return services;

  return services.filter((service, index) => {
    const serviceTokens = new Set(tokenize(service));
    if (!serviceTokens.size) return false;
    if (hasActionKeyword(service)) return true;

    // Drop generic noun phrases when another entry is a more actionable variant.
    const hasMoreSpecificVariant = services.some((other, otherIndex) => {
      if (otherIndex === index) return false;
      if (!hasActionKeyword(other)) return false;

      const otherTokens = new Set(tokenize(other));
      let overlap = 0;
      for (const token of serviceTokens) {
        if (otherTokens.has(token)) overlap += 1;
      }

      return overlap / serviceTokens.size >= 0.6;
    });

    return !hasMoreSpecificVariant;
  });
}

function shortenText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars - 1).trimEnd()}...`;
}

function normalizeSentiment(value: unknown): "Positive" | "Neutral" | "Negative" {
  if (typeof value !== "string") return "Neutral";
  const normalized = value.toLowerCase();
  if (normalized.includes("positive")) return "Positive";
  if (normalized.includes("negative")) return "Negative";
  return "Neutral";
}

function buildFallbackOnboardingSummary(data: {
  businessName: string | null;
  businessDescription: string | null;
  industry: string | null;
  location: string | null;
}): string | null {
  const businessLabel = data.businessName ?? "This business";
  const description =
    data.businessDescription ?? "operates in a partially known service area.";
  const industry = data.industry ?? "industry unknown";
  const location = data.location ?? "location unknown";

  return `${businessLabel} ${description} It appears to operate in ${industry} and serve ${location}. Recommended next step: run a short onboarding discovery call and confirm service priorities.`;
}

function normalizeProfilePayload(raw: unknown, website: string): unknown {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const businessName = asNullableString(data.businessName);
  const businessDescription = asNullableString(data.businessDescription);
  const industry = asNullableString(data.industry);
  const location = asNullableString(data.location);
  const reviewMentions = asStringArray(data.reviewMentions);
  const reviewInsightsRaw =
    data.reviewInsights && typeof data.reviewInsights === "object"
      ? (data.reviewInsights as Record<string, unknown>)
      : {};

  const reviewExamples =
    asStringArray(reviewInsightsRaw.examples).length > 0
      ? asStringArray(reviewInsightsRaw.examples)
      : reviewMentions;

  return {
    onboardingSummary:
      asNullableString(data.onboardingSummary) ??
      buildFallbackOnboardingSummary({
        businessName,
        businessDescription,
        industry,
        location
      }),
    businessSnapshot: {
      rating: asNullableNumber(data.businessSnapshot && typeof data.businessSnapshot === "object" ? (data.businessSnapshot as Record<string, unknown>).rating : null),
      reviewCount: asNullableNumber(data.businessSnapshot && typeof data.businessSnapshot === "object" ? (data.businessSnapshot as Record<string, unknown>).reviewCount : null),
      openNow: asNullableBoolean(data.businessSnapshot && typeof data.businessSnapshot === "object" ? (data.businessSnapshot as Record<string, unknown>).openNow : null),
      businessHours: asStringArray(
        data.businessSnapshot && typeof data.businessSnapshot === "object"
          ? (data.businessSnapshot as Record<string, unknown>).businessHours
          : []
      ).slice(0, 7)
    },
    commercialSnapshot: {
      priceRange: asNullableString(
        data.commercialSnapshot && typeof data.commercialSnapshot === "object"
          ? (data.commercialSnapshot as Record<string, unknown>).priceRange
          : null
      ),
      serviceAreas: asStringArray(
        data.commercialSnapshot && typeof data.commercialSnapshot === "object"
          ? (data.commercialSnapshot as Record<string, unknown>).serviceAreas
          : []
      ).slice(0, 6)
    },
    businessName,
    businessDescription,
    industry,
    location,
    contactEmail: asNullableString(data.contactEmail),
    contactPhone: asNullableString(data.contactPhone),
    website: asNullableString(data.website) ?? website,
    mainServices: normalizeMainServices(data.mainServices),
    targetAudience: asNullableString(data.targetAudience),
    brandTone: asNullableString(data.brandTone),
    socialLinks: asUrlArray(data.socialLinks),
    imageUrls: asUrlArray(data.imageUrls),
    reviewMentions,
    reviewInsights: {
      sentimentSummary: normalizeSentiment(reviewInsightsRaw.sentimentSummary),
      summary: asNullableString(reviewInsightsRaw.summary),
      examples: reviewExamples.slice(0, 3).map((item) => shortenText(item, 120))
    }
  };
}

export async function extractClientProfile(
  corpus: string,
  website: string
): Promise<ClientProfile> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const basePrompt = extractionPrompt(corpus, website);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const retryInstruction =
      attempt === 2
        ? "\n\nIMPORTANT: Return valid, complete JSON only. Do not truncate. Do not include commentary."
        : "";

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: attempt === 1 ? 2200 : 3200,
      temperature: attempt === 1 ? 0.2 : 0,
      messages: [
        {
          role: "user",
          content: `${basePrompt}${retryInstruction}`
        }
      ]
    });

    const rawContent = extractTextContent(response);
    if (!rawContent) {
      if (attempt === 2) {
        throw new Error("Anthropic returned an empty response.");
      }
      continue;
    }

    if (response.stop_reason === "max_tokens" && attempt === 1) {
      continue;
    }

    try {
      const parsed = parseModelJson(rawContent);
      const normalized = normalizeProfilePayload(parsed, website);
      return clientProfileSchema.parse(normalized);
    } catch (error) {
      const isParseError =
        error instanceof Error && error.message === "MODEL_JSON_PARSE_FAILED";
      if (!isParseError || attempt === 2) {
        throw error;
      }
    }
  }

  throw new Error("Could not parse a complete JSON response from model.");
}

function callScriptPrompt(profile: ClientProfile): string {
  return `
Based on the client profile below, generate a personalized onboarding call script for a customer success representative.

Instructions:
- The script must feel natural, professional, and tailored to the specific business.
- Do not be generic.
- Use the business context to guide the conversation.
- Highlight missing information that needs to be collected.
- Help the representative onboard the client efficiently and prepare them for going live.
- Preserve the source language. If profile content is Hebrew, keep Hebrew.
- Keep the script concise. Reduce unnecessary wording and keep it practical.

Client profile JSON:
${JSON.stringify(profile, null, 2)}

Return ONLY valid JSON with this exact shape:
{
  "opening": "string",
  "business_understanding": "string",
  "key_questions": ["string"],
  "missing_information_questions": ["string"],
  "recommendations": ["string"],
  "closing": "string"
}

Constraints:
- business_understanding: up to 2 sentences
- key_questions: 5-7 items
- recommendations: 2-4 items
- If unsure, explicitly use "unknown"
- Avoid buzzwords and vague phrasing
- opening and closing: one short sentence each
`.trim();
}

function normalizeCallScriptPayload(raw: unknown): unknown {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const fallbackQuestions = [
    "What are your top goals for the first 30 days after go-live?",
    "Which services should we prioritize first in your onboarding setup?",
    "Who is the main point of contact for approvals and quick decisions?",
    "Are there any urgent updates or promotions we should publish first?",
    "What does a successful first month look like for your team?"
  ];

  const keyQuestions = asStringArray(data.key_questions).slice(0, 7);
  const normalizedKeyQuestions =
    keyQuestions.length >= 5
      ? keyQuestions
      : [...keyQuestions, ...fallbackQuestions].slice(0, 5);

  const recommendations = asStringArray(data.recommendations).slice(0, 4);
  const paddedRecommendations = recommendations.length >= 2 ? recommendations : [
    ...recommendations,
    "Confirm unknown details before go-live."
  ].slice(0, 2);

  return {
    opening: asNullableString(data.opening) ?? "Thanks for joining the onboarding call today.",
    business_understanding:
      shortenText(
        asNullableString(data.business_understanding) ??
      "Based on the available information, your business details are partially unknown.",
        220
      ),
    key_questions: normalizedKeyQuestions,
    missing_information_questions: asStringArray(data.missing_information_questions),
    recommendations: paddedRecommendations,
    closing:
      asNullableString(data.closing) ??
      "We will summarize next steps and continue with the go-live checklist."
  };
}

export async function generateOnboardingCallScript(
  profile: ClientProfile
): Promise<CallScript> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const basePrompt = callScriptPrompt(profile);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const retryInstruction =
      attempt === 2
        ? "\n\nIMPORTANT: Return valid, complete JSON only. Keep it compact and do not truncate."
        : "";

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: attempt === 1 ? 1800 : 2600,
      temperature: attempt === 1 ? 0.3 : 0,
      messages: [
        {
          role: "user",
          content: `${basePrompt}${retryInstruction}`
        }
      ]
    });

    const rawContent = extractTextContent(response);
    if (!rawContent) {
      if (attempt === 2) {
        throw new Error("Anthropic returned an empty call script response.");
      }
      continue;
    }

    if (response.stop_reason === "max_tokens" && attempt === 1) {
      continue;
    }

    try {
      const parsed = parseModelJson(rawContent);
      const normalized = normalizeCallScriptPayload(parsed);
      return callScriptSchema.parse(normalized);
    } catch (error) {
      const isParseError =
        error instanceof Error && error.message === "MODEL_JSON_PARSE_FAILED";
      if (!isParseError || attempt === 2) {
        throw error;
      }
    }
  }

  throw new Error("Could not parse a complete call script JSON response from model.");
}
