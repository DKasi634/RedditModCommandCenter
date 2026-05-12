import type { RiskLevel, WorkflowStatus } from "../../shared/domain";

const statusLabels: Record<WorkflowStatus, string> = {
  needs_review: "Needs review",
  claimed: "Claimed",
  needs_second_opinion: "Second opinion",
  likely_approve: "Likely approve",
  likely_remove: "Likely remove",
  resolved: "Resolved",
  ignored_ai_suggestion: "AI ignored"
};

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  return <span className={`badge status-${status}`}>{statusLabels[status]}</span>;
}

export function RiskBadge({ riskLevel }: { riskLevel?: RiskLevel | undefined }) {
  return <span className={`badge risk-${riskLevel ?? "none"}`}>{riskLevel ?? "no ai"}</span>;
}
