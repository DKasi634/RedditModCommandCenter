import { redis } from "@devvit/redis";
import type { ModeratorDecision } from "../../shared/domain";
import { parseJson, stringifyJson } from "../utils/json-store";
import { redisKeys } from "../utils/redis-keys";

export async function getDecision(thingId: string) {
  return parseJson<ModeratorDecision | undefined>(
    await redis.get(redisKeys.decision(thingId)),
    undefined,
  );
}

export async function saveDecision(decision: ModeratorDecision) {
  await redis.set(redisKeys.decision(decision.thingId), stringifyJson(decision));
}
