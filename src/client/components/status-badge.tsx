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
        status === "resolved" && "border-[#abefc6] bg-[#dcfae6] text-[#027a48]",
        status === "needs_second_opinion" && "border-[#fedf89] bg-[#fef0c7] text-[#b54708]",
        status === "likely_remove" && "border-[#fecdca] bg-[#fee4e2] text-[#b42318]",
        status === "likely_approve" && "border-[#abefc6] bg-[#dcfae6] text-[#027a48]",
        !["resolved", "needs_second_opinion", "likely_remove", "likely_approve"].includes(status) &&
          "border-[#e3e8ef] bg-[#eef2f6] text-[#475467]",
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
        riskLevel === "high" && "border-[#fecdca] bg-[#fee4e2] text-[#b42318]",
        riskLevel === "medium" && "border-[#fedf89] bg-[#fef0c7] text-[#b54708]",
        riskLevel === "low" && "border-[#abefc6] bg-[#dcfae6] text-[#027a48]",
        !riskLevel && "border-[#e3e8ef] bg-[#eef2f6] text-[#475467]",
      )}
    >
      {riskLevel ?? "no signal"}
    </span>
  );
}
