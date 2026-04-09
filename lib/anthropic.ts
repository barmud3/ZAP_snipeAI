import Anthropic from "@anthropic-ai/sdk";
import { clientProfileSchema, type ClientProfile } from "@/lib/schema";

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
- Return missingInformation as explicit gaps onboarding should collect.
- Return suggestedOnboardingActions as practical next onboarding steps based on missing/unclear data.
- website must be the provided website URL unless a better canonical URL is clearly shown.
- Return JSON only (no markdown or code fences).

Return an object with exactly these keys:
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
- missingInformation
- suggestedOnboardingActions

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

function normalizeProfilePayload(raw: unknown, website: string): unknown {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    businessName: asNullableString(data.businessName),
    businessDescription: asNullableString(data.businessDescription),
    industry: asNullableString(data.industry),
    location: asNullableString(data.location),
    contactEmail: asNullableString(data.contactEmail),
    contactPhone: asNullableString(data.contactPhone),
    website: asNullableString(data.website) ?? website,
    mainServices: asStringArray(data.mainServices),
    targetAudience: asNullableString(data.targetAudience),
    brandTone: asNullableString(data.brandTone),
    socialLinks: asUrlArray(data.socialLinks),
    imageUrls: asUrlArray(data.imageUrls),
    reviewMentions: asStringArray(data.reviewMentions),
    missingInformation: asStringArray(data.missingInformation),
    suggestedOnboardingActions: asStringArray(data.suggestedOnboardingActions)
  };
}

export async function extractClientProfile(
  corpus: string,
  website: string
): Promise<ClientProfile> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2000,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: extractionPrompt(corpus, website)
      }
    ]
  });

  const rawContent = extractTextContent(response);
  if (!rawContent) {
    throw new Error("Anthropic returned an empty response.");
  }

  const parsed = JSON.parse(stripCodeFences(rawContent));
  const normalized = normalizeProfilePayload(parsed, website);
  return clientProfileSchema.parse(normalized);
}
