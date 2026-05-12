import { redis } from "@devvit/redis";
import type { ClassificationResult } from "../../shared/domain";
import { parseJson, stringifyJson } from "../utils/json-store";
import { redisKeys } from "../utils/redis-keys";

export async function getClassification(thingId: string) {
  return parseJson<ClassificationResult | undefined>(
    await redis.get(redisKeys.classification(thingId)),
    undefined
  );
}

export async function saveClassification(classification: ClassificationResult) {
  await redis.set(redisKeys.classification(classification.thingId), stringifyJson(classification));
}
