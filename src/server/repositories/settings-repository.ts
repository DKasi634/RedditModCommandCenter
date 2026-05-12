import { redis } from "@devvit/redis";
import { DEFAULT_SETTINGS } from "../../shared/defaults";
import type { SubredditSettings } from "../../shared/domain";
import { parseJson, stringifyJson } from "../utils/json-store";
import { redisKeys } from "../utils/redis-keys";

export async function getSettings() {
  return parseJson<SubredditSettings>(await redis.get(redisKeys.settings), DEFAULT_SETTINGS);
}

export async function saveSettings(settings: SubredditSettings) {
  await redis.set(redisKeys.settings, stringifyJson(settings));
}
