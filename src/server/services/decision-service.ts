import type { ModeratorDecision } from "../../shared/domain";
import { applyRedditModerationDecision, fetchModerationQueue } from "../integrations/reddit-client";
import { saveDecision } from "../repositories/decision-repository";
import { updateUserHistory } from "../repositories/user-history-repository";

export async function recordModeratorDecision(decision: ModeratorDecision) {
  const item = (await fetchModerationQueue()).find((candidate) => candidate.thingId === decision.thingId);

  if (decision.finalAction === "approved" || decision.finalAction === "removed") {
    await applyRedditModerationDecision(decision.thingId, decision.finalAction);
  }

  await saveDecision(decision);

  if (item) {
    await updateUserHistory(item.authorUsername ?? "unknown", decision);
  }
}
