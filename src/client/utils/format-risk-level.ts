import type { RiskLevel } from "../../shared/domain";

export function formatRiskLevel(level?: RiskLevel) {
  if (!level) return "AI unavailable";
  return `${level.charAt(0).toUpperCase()}${level.slice(1)} risk`;
}
