import type { QueueViewItem } from "../../shared/domain";
import { fetchModerationQueue } from "../integrations/reddit-client";
import { getClassification } from "../repositories/classification-repository";
import { getStatus } from "../repositories/status-repository";
import { getUserHistory } from "../repositories/user-history-repository";
import { getSettings } from "../repositories/settings-repository";
import { calculateTriageScore } from "./triage-score-service";

export async function getQueueView() {
  const [items, settings] = await Promise.all([fetchModerationQueue(), getSettings()]);

  const viewItems: QueueViewItem[] = await Promise.all(
    items.map(async (item) => {
      const [classification, status, userHistory] = await Promise.all([
        getClassification(item.thingId),
        getStatus(item.thingId),
        getUserHistory(item.authorUsername ?? "unknown")
      ]);

      return {
        ...item,
        classification,
        status,
        userHistory,
        triageScore: calculateTriageScore(item, classification, userHistory)
      };
    })
  );

  return { items: viewItems, settings };
}
