import type { QueueViewItem } from "../../shared/domain";

export type QueueSortMode = "priority" | "reports" | "newest";

export function sortQueueItems(items: QueueViewItem[], sortMode: QueueSortMode = "priority") {
  return [...items].sort((a, b) => {
    if (sortMode === "reports") {
      return b.reportReasons.length - a.reportReasons.length || b.triageScore - a.triageScore;
    }

    if (sortMode === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    return b.triageScore - a.triageScore;
  });
}
