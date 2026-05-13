import { redis } from "@devvit/redis";
import { DEFAULT_SETTINGS } from "../../shared/defaults";
import type { SubredditSettings } from "../../shared/domain";
import { parseJson, stringifyJson } from "../utils/json-store";
import { redisKeys } from "../utils/redis-keys";

export async function getSettings() {
  return {
    ...DEFAULT_SETTINGS,
    ...parseJson<Partial<SubredditSettings>>(await redis.get(redisKeys.settings), {}),
  };
}

export async function saveSettings(settings: SubredditSettings) {
  await redis.set(redisKeys.settings, stringifyJson(settings));
}
