import { z } from "zod";

export const statusRequestSchema = z.object({
  thingId: z.string().min(1),
  status: z.enum([
    "needs_review",
    "claimed",
    "needs_second_opinion",
    "likely_approve",
    "likely_remove",
    "resolved",
    "ignored_ai_suggestion"
  ])
});

export const decisionRequestSchema = z.object({
  decision: z.object({
    thingId: z.string().min(1),
    finalAction: z.enum(["approved", "removed", "escalated", "ignored"]),
    selectedRuleId: z.string().optional(),
    selectedRuleTitle: z.string().optional(),
    moderatorUsername: z.string().optional(),
    note: z.string().optional(),
    aiFeedback: z.enum([
      "correct",
      "partially_correct",
      "wrong",
      "unclear",
      "not_useful",
      "missed_context"
    ]).optional()
  })
});
