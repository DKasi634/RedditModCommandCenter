import { Hono } from "hono";
import { classifyRequestSchema } from "../schemas/classification.schema";
import { classifyQueueItem } from "../services/classification-service";
import { requireModerator } from "../middleware/moderator-auth";

export const classificationRoutes = new Hono();

classificationRoutes.use("*", requireModerator);

classificationRoutes.post("/classifications", async (c) => {
  const request = classifyRequestSchema.parse(await c.req.json());
  const classification = await classifyQueueItem(request.thingId);
  return c.json({ classification });
});
