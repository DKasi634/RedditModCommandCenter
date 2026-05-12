import { redis } from "@devvit/redis";
import type { WorkflowStatus } from "../../shared/domain";
import { redisKeys } from "../utils/redis-keys";

export async function getStatus(thingId: string): Promise<WorkflowStatus> {
  return ((await redis.get(redisKeys.status(thingId))) as WorkflowStatus | null) ?? "needs_review";
}

export async function saveStatus(thingId: string, status: WorkflowStatus) {
  await redis.set(redisKeys.status(thingId), status);
}
