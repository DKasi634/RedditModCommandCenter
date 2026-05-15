import type { RiskLevel, WorkflowStatus } from "../../shared/domain";
import { cn } from "../lib/cn";

const statusLabels: Record<WorkflowStatus, string> = {
  needs_review: "Needs review",
  claimed: "Claimed",
  needs_second_opinion: "Second opinion",
  likely_approve: "Likely approve",
  likely_remove: "Likely remove",
  resolved: "Resolved",
  ignored_ai_suggestion: "Suggestion ignored"
};

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold capitalize leading-none",
        status === "resolved" && "border-[var(--cc-success-border)] bg-[var(--cc-success-bg)] text-[var(--cc-success-text)]",
        status === "needs_second_opinion" && "border-[var(--cc-warning-border)] bg-[var(--cc-warning-bg)] text-[var(--cc-warning-text)]",
        status === "likely_remove" && "border-[var(--cc-danger-border)] bg-[var(--cc-danger-bg)] text-[var(--cc-danger-text)]",
        status === "likely_approve" && "border-[var(--cc-success-border)] bg-[var(--cc-success-bg)] text-[var(--cc-success-text)]",
        !["resolved", "needs_second_opinion", "likely_remove", "likely_approve"].includes(status) &&
          "border-[var(--cc-border)] bg-[var(--cc-chip)] text-[var(--cc-muted-strong)]",
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function RiskBadge({ riskLevel }: { riskLevel?: RiskLevel | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold capitalize leading-none",
        riskLevel === "high" && "border-[var(--cc-danger-border)] bg-[var(--cc-danger-bg)] text-[var(--cc-danger-text)]",
        riskLevel === "medium" && "border-[var(--cc-warning-border)] bg-[var(--cc-warning-bg)] text-[var(--cc-warning-text)]",
        riskLevel === "low" && "border-[var(--cc-success-border)] bg-[var(--cc-success-bg)] text-[var(--cc-success-text)]",
        !riskLevel && "border-[var(--cc-border)] bg-[var(--cc-chip)] text-[var(--cc-muted-strong)]",
      )}
    >
      {riskLevel ?? "no signal"}
    </span>
  );
}
