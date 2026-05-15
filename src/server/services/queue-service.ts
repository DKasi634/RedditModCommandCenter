import type { ClassificationResult, ClassificationState, QueueViewItem, QueueItem, UserHistory } from "../../shared/domain";
import { fetchModerationQueue } from "../integrations/reddit-client";
import { requestClassification } from "../integrations/ai-backend-client";
import { getClassification } from "../repositories/classification-repository";
import { getStatus } from "../repositories/status-repository";
import { getSecondOpinion } from "../repositories/second-opinion-repository";
import { getUserHistory } from "../repositories/user-history-repository";
import { getSettings } from "../repositories/settings-repository";
import { saveClassification } from "../repositories/classification-repository";
import { saveStatus } from "../repositories/status-repository";
import { getModeratorWorkspaceContext } from "./moderator-service";
import { calculateTriageScore } from "./triage-score-service";

function classificationState(
  classification: ClassificationResult | undefined,
  aiEnabled: boolean,
): ClassificationState {
  if (!aiEnabled) {
    return "disabled";
  }

  if (!classification) {
    return "not_analyzed";
  }

  if (classification.modelProvider === "mock" || classification.failed) {
    return "fallback";
  }

  return "available";
}

async function autoClassifyIfNeeded(
  item: QueueItem,
  history: UserHistory,
  existing: ClassificationResult | undefined,
  aiEnabled: boolean,
  classificationMode: "manual" | "auto_on_load",
) {
  if (!aiEnabled || classificationMode !== "auto_on_load" || existing) {
    return existing;
  }

  const classification = await requestClassification(item, history);
  await saveClassification(classification);

  if (classification.needsSecondOpinion) {
    await saveStatus(item.thingId, "needs_second_opinion");
  }

  return classification;
}

export async function getQueueView() {
  const [items, settings, moderator] = await Promise.all([
    fetchModerationQueue(),
    getSettings(),
    getModeratorWorkspaceContext(),
  ]);

  const viewItems: QueueViewItem[] = await Promise.all(
    items.map(async (item) => {
      const [storedClassification, status, userHistory, secondOpinion] = await Promise.all([
        getClassification(item.thingId),
        getStatus(item.thingId),
        getUserHistory(item.authorUsername ?? "unknown"),
        getSecondOpinion(item.thingId)
      ]);
      const classification = await autoClassifyIfNeeded(
        item,
        userHistory,
        storedClassification,
        settings.aiEnabled,
        settings.classificationMode,
      );
      const viewStatus = status === "resolved"
        ? status
        : secondOpinion?.status === "open" || classification?.needsSecondOpinion
          ? "needs_second_opinion"
          : status;

      return {
        ...item,
        classification,
        classificationState: classificationState(classification, settings.aiEnabled),
        status: viewStatus,
        userHistory,
        secondOpinion,
        triageScore: calculateTriageScore(item, classification, userHistory)
      };
    })
  );

  return { items: viewItems, settings, moderator };
}
