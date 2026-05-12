import { z } from "zod";

export const settingsSchema = z.object({
  aiEnabled: z.boolean(),
  classificationMode: z.enum(["manual", "auto_on_load"]),
  secondOpinionThreshold: z.number().min(0).max(100),
  collapseLowRiskItems: z.boolean(),
  showAiSummaryByDefault: z.boolean(),
  customSensitiveKeywords: z.array(z.string())
});
