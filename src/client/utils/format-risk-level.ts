import type { RiskLevel } from "../../shared/domain";

export function formatRiskLevel(level?: RiskLevel) {
  if (!level) return "No signal";
  return `${level.charAt(0).toUpperCase()}${level.slice(1)} risk`;
}
