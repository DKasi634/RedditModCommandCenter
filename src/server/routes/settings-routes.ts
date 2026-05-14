import { Hono } from "hono";
import { getSettings, saveSettings } from "../repositories/settings-repository";
import { settingsSchema } from "../schemas/settings.schema";
import { requireModerator } from "../middleware/moderator-auth";

export const settingsRoutes = new Hono();

settingsRoutes.use("*", requireModerator);

settingsRoutes.get("/settings", async (c) => c.json(await getSettings()));

settingsRoutes.put("/settings", async (c) => {
  const settings = settingsSchema.parse(await c.req.json());
  await saveSettings(settings);
  return c.json({ settings });
});
