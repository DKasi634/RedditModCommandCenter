import type { ModeratorDecision } from "../../shared/domain";
import { applyRedditModerationDecision, fetchModerationQueue } from "../integrations/reddit-client";
import { saveDecision } from "../repositories/decision-repository";
import { getSecondOpinion, resolveSecondOpinion, saveSecondOpinion } from "../repositories/second-opinion-repository";
import { saveStatus } from "../repositories/status-repository";
import { updateUserHistory } from "../repositories/user-history-repository";
import { getModeratorWorkspaceContext } from "./moderator-service";

export async function recordModeratorDecision(decision: ModeratorDecision) {
  const item = (await fetchModerationQueue()).find((candidate) => candidate.thingId === decision.thingId);
  const secondOpinion = await getSecondOpinion(decision.thingId);

  if (decision.finalAction === "approved" || decision.finalAction === "removed") {
    if (
      secondOpinion?.status === "open" &&
      secondOpinion.escalatedBy.toLowerCase() === decision.moderatorUsername.toLowerCase()
    ) {
      throw new Error("A moderator cannot resolve their own escalation.");
    }

    await applyRedditModerationDecision(decision.thingId, decision.finalAction);
    await saveStatus(decision.thingId, "resolved");
    await resolveSecondOpinion(decision.thingId, decision.moderatorUsername);
  }

  if (decision.finalAction === "escalated") {
    const moderator = await getModeratorWorkspaceContext();

    if (!moderator.canEscalate) {
      throw new Error("Escalation requires another moderator in this subreddit.");
    }

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
