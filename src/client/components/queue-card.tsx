import type { QueueViewItem, SecondOpinionReason } from "../../shared/domain";
import { cn } from "../lib/cn";
import { Icon } from "./icon";
import { RiskBadge, StatusBadge } from "./status-badge";

const secondOpinionReasonLabels: Record<SecondOpinionReason, string> = {
  senior_mod_review: "Another moderator requested",
  rule_ambiguity: "Rule ambiguity",
  policy_question: "Policy question",
  context_unclear: "Context unclear",
  other: "Other review",
};

type Props = {
  item: QueueViewItem;
  isSelected: boolean;
  onSelect: (thingId: string) => void;
  isDisabled?: boolean;
};

export function QueueCard({ item, isSelected, onSelect, isDisabled = false }: Props) {
  const aiLabel = item.classification
    ? `${Math.round(item.classification.confidence * 100)}%`
    : item.classificationState === "disabled"
      ? "Off"
      : "No signal";

  return (
    <button
      className={cn(
        "relative block min-h-[120px] w-full border-0 border-b border-[var(--cc-border)] bg-transparent px-4 py-3.5 pr-11 text-left text-inherit transition hover:bg-[var(--cc-canvas)] disabled:cursor-not-allowed disabled:opacity-55",
        isSelected && "bg-[var(--cc-panel)] shadow-[inset_3px_0_0_var(--cc-accent)]",
      )}
      disabled={isDisabled}
      onClick={() => onSelect(item.thingId)}
    >
      <div className="mb-2.5 flex justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.02em] text-[var(--cc-muted-strong)]">{item.itemType}</span>
        <StatusBadge status={item.status} />
      </div>
      <h3 className="mb-1.5 text-sm font-bold leading-snug text-[var(--cc-text)]">{item.title || item.body || "Untitled queue item"}</h3>
      <p className="mb-0 text-sm text-[var(--cc-muted)]">u/{item.authorUsername}</p>
      {item.secondOpinion?.status === "open" ? (
        <p className="mt-1 inline-flex rounded-full bg-[var(--cc-warning-bg)] px-2 py-0.5 text-xs font-bold text-[var(--cc-warning-text)]">
          {secondOpinionReasonLabels[item.secondOpinion.reason]}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <RiskBadge riskLevel={item.classification?.riskLevel} />
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cc-muted)]" title="Triage score">
          <Icon name="message" size={14} /> {item.triageScore}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cc-muted)]" title="Insight confidence">
          <Icon name="brain" size={14} /> {aiLabel}
        </span>
      </div>
      <Icon name="chevronRight" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cc-muted)]" />
    </button>
  );
}
