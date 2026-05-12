import { redis } from "@devvit/redis";
import type { ModeratorDecision } from "../../shared/domain";
import { stringifyJson } from "../utils/json-store";
import { redisKeys } from "../utils/redis-keys";

export async function saveDecision(decision: ModeratorDecision) {
  await redis.set(redisKeys.decision(decision.thingId), stringifyJson(decision));
}
