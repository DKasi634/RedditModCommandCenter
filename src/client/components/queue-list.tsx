import type { QueueViewItem } from "../../shared/domain";
import { type QueueSortMode, sortQueueItems } from "../utils/sort-queue-items";
import { QueueCard } from "./queue-card";

export type QueueFilterMode = "active" | "all" | "resolved" | "escalated" | "high_risk";

type Props = {
  items: QueueViewItem[];
  selectedThingId?: string;
  onSelect: (thingId: string) => void;
  isDisabled?: boolean;
  showResolved?: boolean;
  resolvedCount?: number;
  onToggleResolved?: () => void;
  filterMode: QueueFilterMode;
  sortMode: QueueSortMode;
  onFilterModeChange: (mode: QueueFilterMode) => void;
  onSortModeChange: (mode: QueueSortMode) => void;
};

export function QueueList({
  items,
  selectedThingId,
  onSelect,
  isDisabled = false,
  showResolved = false,
  resolvedCount = 0,
  onToggleResolved,
  filterMode,
  sortMode,
  onFilterModeChange,
  onSortModeChange,
}: Props) {
  return (
    <aside className="queue-list">
      <div className="queue-list-toolbar">
        <span>{showResolved ? "All items" : "Active items"}</span>
        {resolvedCount > 0 && onToggleResolved ? (
          <button className="secondary compact" disabled={isDisabled} onClick={onToggleResolved}>
            {showResolved ? "Hide resolved" : `Show ${resolvedCount} resolved`}
          </button>
        ) : null}
      </div>
      <div className="queue-controls">
        <label>
          Filter
          <select
            value={filterMode}
            disabled={isDisabled}
            onChange={(event) => onFilterModeChange(event.target.value as QueueFilterMode)}
          >
            <option value="active">Active</option>
            <option value="all">All</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
            <option value="high_risk">High risk</option>
          </select>
        </label>
        <label>
          Sort
          <select
            value={sortMode}
            disabled={isDisabled}
            onChange={(event) => onSortModeChange(event.target.value as QueueSortMode)}
          >
            <option value="priority">Priority</option>
            <option value="reports">Reports</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>
      {sortQueueItems(items, sortMode).map((item) => (
        <QueueCard
          key={item.thingId}
          item={item}
          isSelected={item.thingId === selectedThingId}
          onSelect={onSelect}
          isDisabled={isDisabled}
        />
      ))}
    </aside>
  );
}
