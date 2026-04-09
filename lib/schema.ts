import { z } from "zod";

export const analyzeRequestSchema = z.object({
  url: z.string().min(1, "Please provide a website URL.")
});

export const clientProfileSchema = z.object({
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
  missingInformation: z.array(z.string()),
  suggestedOnboardingActions: z.array(z.string())
});

export type ClientProfile = z.infer<typeof clientProfileSchema>;
