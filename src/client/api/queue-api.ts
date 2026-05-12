import type { QueueResponse, StatusRequest } from "../types/api";
import { apiFetch } from "./http";

export function fetchQueue() {
  return apiFetch<QueueResponse>("/api/queue");
}

export function updateStatus(request: StatusRequest) {
  return apiFetch<{ ok: true }>("/api/status", {
    method: "POST",
    body: JSON.stringify(request)
  });
}
