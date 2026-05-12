import { Hono } from "hono";
import { getQueueView } from "../services/queue-service";
import { saveStatus } from "../repositories/status-repository";
import { statusRequestSchema } from "../schemas/decision.schema";

export const queueRoutes = new Hono();

queueRoutes.get("/queue", async (c) => c.json(await getQueueView()));

queueRoutes.post("/status", async (c) => {
  const request = statusRequestSchema.parse(await c.req.json());
  await saveStatus(request.thingId, request.status);
  return c.json({ ok: true });
});
