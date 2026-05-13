import { redis } from "@devvit/redis";
import type { ModeratorDecision, UserHistory } from "../../shared/domain";
import { parseJson, stringifyJson } from "../utils/json-store";
import { redisKeys } from "../utils/redis-keys";

export async function getUserHistory(username: string): Promise<UserHistory> {
  const fallback: UserHistory = {
    username,
    previousWarnings: 0,
    previousApprovals: 0,
    previousRemovals: 0,
    previousSecondOpinions: 0,
    repeatedRuleTags: []
  };

  return {
    ...fallback,
    ...parseJson<Partial<UserHistory>>(await redis.get(redisKeys.userHistory(username)), {}),
  };
}

export async function updateUserHistory(username: string, decision: ModeratorDecision) {
  const current = await getUserHistory(username);
  const repeatedRuleTags = decision.selectedRuleTitle
    ? Array.from(new Set([...current.repeatedRuleTags, decision.selectedRuleTitle]))
    : current.repeatedRuleTags;

  const next: UserHistory = {
    ...current,
    previousWarnings: current.previousWarnings + (decision.finalAction === "ignored" ? 1 : 0),
    previousApprovals: (current.previousApprovals ?? 0) + (decision.finalAction === "approved" ? 1 : 0),
    previousRemovals: current.previousRemovals + (decision.finalAction === "removed" ? 1 : 0),
    previousSecondOpinions: current.previousSecondOpinions + (decision.finalAction === "escalated" ? 1 : 0),
    repeatedRuleTags,
    lastModerationAction: decision.finalAction,
    updatedAt: decision.decidedAt
  };

  await redis.set(redisKeys.userHistory(username), stringifyJson(next));
  return next;
}
