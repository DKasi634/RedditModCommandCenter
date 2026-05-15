import { context, reddit } from "@devvit/web/server";
import type { ModeratorWorkspaceContext } from "../../shared/domain";

export async function getCurrentModeratorUsername() {
  return context.username ?? (await reddit.getCurrentUsername()) ?? "unknown_moderator";
}

export async function getModeratorWorkspaceContext(): Promise<ModeratorWorkspaceContext> {
  const subredditName = context.subredditName;
  const currentModeratorUsername = await getCurrentModeratorUsername();

  if (!subredditName) {
    return {
      currentModeratorUsername,
      moderatorCount: 0,
      canEscalate: false,
    };
  }

  const moderators = await reddit.getModerators({
    subredditName,
    limit: 1000,
  }).all();

  return {
    currentModeratorUsername,
    moderatorCount: moderators.length,
    canEscalate: moderators.some(
      (moderator) => moderator.username.toLowerCase() !== currentModeratorUsername.toLowerCase(),
    ),
  };
}
