import { Hono } from "hono";
import type { ModeratorDecision } from "../../shared/domain";
import { decisionRequestSchema } from "../schemas/decision.schema";
import { recordModeratorDecision } from "../services/decision-service";

export const decisionRoutes = new Hono();

decisionRoutes.post("/decisions", async (c) => {
  const request = decisionRequestSchema.parse(await c.req.json());
  const moderatorUsername = request.decision.moderatorUsername ?? "unknown_moderator";
  const decision: ModeratorDecision = {
    ...request.decision,
    moderatorUsername,
    decidedAt: new Date().toISOString()
  };

  await recordModeratorDecision(decision);
  return c.json({ ok: true });
});
