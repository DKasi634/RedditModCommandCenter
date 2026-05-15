import { context, reddit } from "@devvit/web/server";
import type { ModeratorWorkspaceContext } from "../../shared/domain";

function normalizeUsername(username: string) {
  return username.replace(/^u\//i, "").toLowerCase();
}

function isServiceModerator(username: string) {
  const normalized = normalizeUsername(username);
  const appNames = [context.appSlug, context.appName]
    .filter(Boolean)
    .map((name) => normalizeUsername(name));

  return normalized === "automoderator" ||
    normalized === "devvit-dev-bot" ||
    normalized.startsWith("devvit-") ||
    normalized.endsWith("-bot") ||
    normalized.startsWith("modqueuecc") ||
    appNames.includes(normalized);
}

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
      eligibleEscalationModeratorCount: 0,
      canEscalate: false,
    };
  }

  const moderators = await reddit.getModerators({
    subredditName,
    limit: 1000,
  }).all();

  const currentUsername = normalizeUsername(currentModeratorUsername);
  const eligibleEscalationModerators = moderators.filter((moderator) => {
    const username = normalizeUsername(moderator.username);
    return username !== currentUsername && !isServiceModerator(username);
  });

  console.log("[moderator-context] Escalation recipients", {
    currentModeratorUsername,
    moderatorCount: moderators.length,
    eligibleEscalationModeratorCount: eligibleEscalationModerators.length,
    ignoredServiceModerators: moderators
      .map((moderator) => moderator.username)
      .filter((username) => normalizeUsername(username) !== currentUsername && isServiceModerator(username)),
  });

  return {
    currentModeratorUsername,
    moderatorCount: moderators.length,
    eligibleEscalationModeratorCount: eligibleEscalationModerators.length,
    canEscalate: eligibleEscalationModerators.length > 0,
  };
}
