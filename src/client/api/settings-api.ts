import type { SubredditSettings } from "../../shared/domain";
import type { SettingsResponse } from "../types/api";
import { apiFetch } from "./http";

export function saveSubredditSettings(settings: SubredditSettings) {
  return apiFetch<SettingsResponse>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}
