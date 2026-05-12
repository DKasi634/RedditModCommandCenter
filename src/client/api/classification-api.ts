import type { ClassifyResponse } from "../types/api";
import { apiFetch } from "./http";

export function classifyItem(thingId: string) {
  return apiFetch<ClassifyResponse>("/api/classifications", {
    method: "POST",
    body: JSON.stringify({ thingId })
  });
}
