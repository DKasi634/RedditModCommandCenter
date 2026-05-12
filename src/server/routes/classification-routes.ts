import { Hono } from "hono";
import { classifyRequestSchema } from "../schemas/classification.schema";
import { classifyQueueItem } from "../services/classification-service";

export const classificationRoutes = new Hono();

classificationRoutes.post("/classifications", async (c) => {
  const request = classifyRequestSchema.parse(await c.req.json());
  const classification = await classifyQueueItem(request.thingId);
  return c.json({ classification });
});
