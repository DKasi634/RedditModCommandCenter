import type { ModeratorDecision } from "../../shared/domain";
import { applyRedditModerationDecision, fetchModerationQueue } from "../integrations/reddit-client";
import { saveDecision } from "../repositories/decision-repository";
import { resolveSecondOpinion, saveSecondOpinion } from "../repositories/second-opinion-repository";
import { saveStatus } from "../repositories/status-repository";
import { updateUserHistory } from "../repositories/user-history-repository";

export async function recordModeratorDecision(decision: ModeratorDecision) {
  const item = (await fetchModerationQueue()).find((candidate) => candidate.thingId === decision.thingId);

  if (decision.finalAction === "approved" || decision.finalAction === "removed") {
    await applyRedditModerationDecision(decision.thingId, decision.finalAction);
    await saveStatus(decision.thingId, "resolved");
    await resolveSecondOpinion(decision.thingId, decision.moderatorUsername);
  }

  if (decision.finalAction === "escalated") {
    await saveStatus(decision.thingId, "needs_second_opinion");
    await saveSecondOpinion({
      thingId: decision.thingId,
      reason: decision.secondOpinionReason ?? "other",
      note: decision.note,
      escalatedBy: decision.moderatorUsername,
      escalatedAt: decision.decidedAt,
      status: "open",
    });
  }

  await saveDecision(decision);

  if (item) {
    await updateUserHistory(item.authorUsername ?? "unknown", decision);
  }
}
