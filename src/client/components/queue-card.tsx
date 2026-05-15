import { Brain, ChevronRight, MessageSquareWarning } from "lucide-react";
import type { QueueViewItem, SecondOpinionReason } from "../../shared/domain";
import { RiskBadge, StatusBadge } from "./status-badge";

const secondOpinionReasonLabels: Record<SecondOpinionReason, string> = {
  senior_mod_review: "Senior mod review",
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
      : "Not analyzed";

  return (
    <button
      className={`queue-card ${isSelected ? "selected" : ""}`}
      disabled={isDisabled}
      onClick={() => onSelect(item.thingId)}
    >
      <div className="queue-card-top">
        <span className="item-type">{item.itemType}</span>
        <StatusBadge status={item.status} />
      </div>
      <h3>{item.title || item.body || "Untitled queue item"}</h3>
      <p className="muted">u/{item.authorUsername}</p>
      {item.secondOpinion?.status === "open" ? (
        <p className="queue-card-note">{secondOpinionReasonLabels[item.secondOpinion.reason]}</p>
      ) : null}
      <div className="queue-card-meta">
        <RiskBadge riskLevel={item.classification?.riskLevel} />
        <span title="Triage score">
          <MessageSquareWarning size={14} /> {item.triageScore}
        </span>
        <span title="AI confidence">
          <Brain size={14} /> {aiLabel}
        </span>
      </div>
      <ChevronRight className="queue-card-arrow" size={18} />
    </button>
  );
}
