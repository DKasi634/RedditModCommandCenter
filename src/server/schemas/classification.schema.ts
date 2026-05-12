import { z } from "zod";

export const classifyRequestSchema = z.object({
  thingId: z.string().min(1)
});

export const classificationResultSchema = z.object({
  thingId: z.string(),
  riskLevel: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  suggestedAction: z.enum(["approve", "remove", "needs_review", "needs_second_opinion"]),
  matchedRules: z.array(z.object({
    ruleId: z.string(),
    ruleTitle: z.string(),
    confidence: z.number().min(0).max(1)
  })),
  categories: z.array(z.string()),
  summary: z.string(),
  reasoningForMods: z.array(z.string()),
  needsSecondOpinion: z.boolean(),
  modelProvider: z.enum(["gemini", "openai", "mock"]),
  modelVersion: z.string(),
  promptVersion: z.string(),
  createdAt: z.string(),
  failed: z.boolean().optional()
});
