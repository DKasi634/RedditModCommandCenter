import type { MiddlewareHandler } from "hono";
import { context, reddit } from "@devvit/web/server";

export const requireModerator: MiddlewareHandler = async (c, next) => {
  const subredditName = context.subredditName;
  const username = context.username ?? (await reddit.getCurrentUsername());

  if (!subredditName || !username) {
    return c.json({ error: "Moderator access is required." }, 403);
  }

  const moderators = await reddit.getModerators({
    subredditName,
    username,
    limit: 1,
  }).all();

  const isModerator = moderators.some(
    (moderator) => moderator.username.toLowerCase() === username.toLowerCase(),
  );

  if (!isModerator) {
    return c.json({ error: "Moderator access is required." }, 403);
  }

  await next();
};
