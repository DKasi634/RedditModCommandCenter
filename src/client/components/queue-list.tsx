import type { QueueViewItem } from "../../shared/domain";
import { sortQueueItems } from "../utils/sort-queue-items";
import { QueueCard } from "./queue-card";

type Props = {
  items: QueueViewItem[];
  selectedThingId?: string;
  onSelect: (thingId: string) => void;
  isDisabled?: boolean;
  showResolved?: boolean;
  resolvedCount?: number;
  onToggleResolved?: () => void;
};

export function QueueList({
  items,
  selectedThingId,
  onSelect,
  isDisabled = false,
  showResolved = false,
  resolvedCount = 0,
  onToggleResolved,
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
      {sortQueueItems(items).map((item) => (
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
