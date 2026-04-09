import { z } from "zod";

export const analyzeRequestSchema = z.object({
  url: z.string().min(1, "Please provide a website URL.")
});

export const clientProfileSchema = z.object({
  onboardingSummary: z.string().nullable(),
  businessName: z.string().nullable(),
  businessDescription: z.string().nullable(),
  industry: z.string().nullable(),
  location: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  website: z.string().url().nullable(),
  mainServices: z.array(z.string()),
  targetAudience: z.string().nullable(),
  brandTone: z.string().nullable(),
  socialLinks: z.array(z.string().url()),
  imageUrls: z.array(z.string().url()),
  reviewMentions: z.array(z.string()),
  reviewInsights: z.object({
    sentimentSummary: z.enum(["Positive", "Neutral", "Negative"]),
    summary: z.string().nullable(),
    examples: z.array(z.string()).max(3)
  })
});

export const callScriptSchema = z.object({
  opening: z.string(),
  business_understanding: z.string(),
  key_questions: z.array(z.string()).min(5).max(7),
  missing_information_questions: z.array(z.string()),
  recommendations: z.array(z.string()).min(2).max(4),
  closing: z.string()
});

export const callScriptRequestSchema = z.object({
  profile: clientProfileSchema
});

export type ClientProfile = z.infer<typeof clientProfileSchema>;
export type CallScript = z.infer<typeof callScriptSchema>;
