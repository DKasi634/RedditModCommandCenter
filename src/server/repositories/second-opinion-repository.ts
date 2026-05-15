import { redis } from "@devvit/redis";
import type { SecondOpinionRecord } from "../../shared/domain";
import { parseJson, stringifyJson } from "../utils/json-store";
import { redisKeys } from "../utils/redis-keys";

export async function getSecondOpinion(thingId: string) {
  return parseJson<SecondOpinionRecord | undefined>(
    await redis.get(redisKeys.secondOpinion(thingId)),
    undefined,
  );
}

export async function saveSecondOpinion(record: SecondOpinionRecord) {
  await redis.set(redisKeys.secondOpinion(record.thingId), stringifyJson(record));
}

export async function resolveSecondOpinion(thingId: string, resolvedBy: string) {
  const current = await getSecondOpinion(thingId);

  if (!current || current.status === "resolved") {
    return;
  }

  await saveSecondOpinion({
    ...current,
    status: "resolved",
    resolvedBy,
    resolvedAt: new Date().toISOString(),
  });
}
