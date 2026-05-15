import type { QueueViewItem } from "../../shared/domain";
import { type QueueSortMode, sortQueueItems } from "../utils/sort-queue-items";
import { buttonSecondary, buttonCompact } from "../lib/ui";
import { QueueCard } from "./queue-card";
import { UiSelect } from "./ui-select";

export type QueueFilterMode =
  | "active"
  | "all"
  | "resolved"
  | "second_opinion"
  | "requested_by_me"
  | "resolved_second_opinions"
  | "high_risk";

const filterOptions: Array<{ label: string; value: QueueFilterMode }> = [
  { label: "Active", value: "active" },
  { label: "All", value: "all" },
  { label: "Resolved", value: "resolved" },
  { label: "Needs second opinion", value: "second_opinion" },
  { label: "Requested by me", value: "requested_by_me" },
  { label: "Resolved second opinions", value: "resolved_second_opinions" },
  { label: "High risk", value: "high_risk" },
];

const sortOptions: Array<{ label: string; value: QueueSortMode }> = [
  { label: "Priority", value: "priority" },
  { label: "Reports", value: "reports" },
  { label: "Newest", value: "newest" },
];

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
    <aside className="border-r border-[#e5ebee] bg-white">
      <div className="flex min-h-[58px] items-center justify-between gap-2 border-b border-[#e5ebee] px-4 py-3 text-sm font-bold text-[#1c1c1c]">
        <span>{showResolved ? "All items" : "Active items"}</span>
        {resolvedCount > 0 && onToggleResolved ? (
          <button className={`${buttonSecondary} ${buttonCompact}`} disabled={isDisabled} onClick={onToggleResolved}>
            {showResolved ? "Hide resolved" : `Show ${resolvedCount} resolved`}
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2.5 border-b border-[#e5ebee] bg-white px-4 py-3">
        <label className="mb-0 text-xs font-semibold text-[#576f76]">
          Filter
          <UiSelect
            value={filterMode}
            disabled={isDisabled}
            options={filterOptions}
            onChange={onFilterModeChange}
          />
        </label>
        <label className="mb-0 text-xs font-semibold text-[#576f76]">
          Sort
          <UiSelect
            value={sortMode}
            disabled={isDisabled}
            options={sortOptions}
            onChange={onSortModeChange}
          />
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
