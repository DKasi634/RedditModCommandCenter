import type { DecisionRequest } from "../types/api";
import { apiFetch } from "./http";

export function recordDecision(request: DecisionRequest) {
  return apiFetch<{ ok: true }>("/api/decisions", {
    method: "POST",
    body: JSON.stringify(request)
  });
}
