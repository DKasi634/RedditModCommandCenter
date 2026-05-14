import { Hono } from "hono";
import type { ModeratorDecision } from "../../shared/domain";
import { decisionRequestSchema } from "../schemas/decision.schema";
import { recordModeratorDecision } from "../services/decision-service";
import { getCurrentModeratorUsername, requireModerator } from "../middleware/moderator-auth";

export const decisionRoutes = new Hono();

decisionRoutes.use("*", requireModerator);

decisionRoutes.post("/decisions", async (c) => {
  const request = decisionRequestSchema.parse(await c.req.json());
  const moderatorUsername = await getCurrentModeratorUsername();
  const decision: ModeratorDecision = {
    ...request.decision,
    moderatorUsername,
    decidedAt: new Date().toISOString()
  };

  await recordModeratorDecision(decision);
  return c.json({ ok: true });
});
