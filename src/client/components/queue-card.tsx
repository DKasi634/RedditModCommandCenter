import { Brain, ChevronRight, MessageSquareWarning } from "lucide-react";
import type { QueueViewItem } from "../../shared/domain";
import { RiskBadge, StatusBadge } from "./status-badge";

type Props = {
  item: QueueViewItem;
  isSelected: boolean;
  onSelect: (thingId: string) => void;
  isDisabled?: boolean;
};

export function QueueCard({ item, isSelected, onSelect, isDisabled = false }: Props) {
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
      <div className="queue-card-meta">
        <RiskBadge riskLevel={item.classification?.riskLevel} />
        <span title="Triage score">
          <MessageSquareWarning size={14} /> {item.triageScore}
        </span>
        <span title="AI confidence">
          <Brain size={14} /> {Math.round((item.classification?.confidence ?? 0) * 100)}%
        </span>
      </div>
      <ChevronRight className="queue-card-arrow" size={18} />
    </button>
  );
}
