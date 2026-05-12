import type { QueueViewItem } from "../../shared/domain";

export function sortQueueItems(items: QueueViewItem[]) {
  return [...items].sort((a, b) => b.triageScore - a.triageScore);
}
