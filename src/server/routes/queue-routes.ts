import { Hono } from "hono";
import { getQueueView } from "../services/queue-service";
import { saveStatus } from "../repositories/status-repository";
import { getSecondOpinion } from "../repositories/second-opinion-repository";
import { statusRequestSchema } from "../schemas/decision.schema";
import { requireModerator } from "../middleware/moderator-auth";
import { getCurrentModeratorUsername } from "../services/moderator-service";

export const queueRoutes = new Hono();

queueRoutes.use("*", requireModerator);

queueRoutes.get("/queue", async (c) => c.json(await getQueueView()));

queueRoutes.post("/status", async (c) => {
  const request = statusRequestSchema.parse(await c.req.json());
  const [username, secondOpinion] = await Promise.all([
    getCurrentModeratorUsername(),
    getSecondOpinion(request.thingId),
  ]);

  if (
    request.status === "resolved" &&
    secondOpinion?.status === "open" &&
    secondOpinion.escalatedBy.toLowerCase() === username.toLowerCase()
  ) {
    return c.json({ error: "A moderator cannot resolve their own escalation." }, 400);
  }

  await saveStatus(request.thingId, request.status);
  return c.json({ ok: true });
});
