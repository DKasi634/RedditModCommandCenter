import { fetchModerationQueue } from "../integrations/reddit-client";
import { requestClassification } from "../integrations/ai-backend-client";
import { getSettings } from "../repositories/settings-repository";
import { getUserHistory } from "../repositories/user-history-repository";
import { saveClassification } from "../repositories/classification-repository";
import { saveStatus } from "../repositories/status-repository";

export async function classifyQueueItem(thingId: string) {
  const settings = await getSettings();
  const item = (await fetchModerationQueue()).find((candidate) => candidate.thingId === thingId);

  if (!item) {
    throw new Error("Queue item not found");
  }

  if (!settings.aiEnabled) {
    throw new Error("Command Center insights are disabled in settings");
  }

  const history = await getUserHistory(item.authorUsername ?? "unknown");
  const classification = await requestClassification(item, history);
  await saveClassification(classification);

  if (classification.needsSecondOpinion) {
    await saveStatus(item.thingId, "needs_second_opinion");
  }

  return classification;
}
