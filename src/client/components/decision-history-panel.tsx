import { ClipboardCheck } from "lucide-react";
import type { ModeratorDecision } from "../../shared/domain";

const actionLabels: Record<ModeratorDecision["finalAction"], string> = {
  approved: "Archived",
  removed: "Removed",
  escalated: "Second opinion requested",
  ignored: "Suggestion ignored",
};

const feedbackLabels: Record<NonNullable<ModeratorDecision["aiFeedback"]>, string> = {
  correct: "Correct",
  partially_correct: "Partially correct",
  wrong: "Wrong",
  unclear: "Unclear",
  not_useful: "Not useful",
  missed_context: "Missed important context",
};

function formatDecisionTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DecisionHistoryPanel({ decision }: { decision: ModeratorDecision | undefined }) {
  if (!decision) {
    return (
      <section className="panel decision-history-panel">
        <h2><ClipboardCheck size={18} /> Decision history</h2>
        <p className="muted">No app-tracked decision has been recorded for this item yet.</p>
      </section>
    );
  }

  return (
    <section className="panel decision-history-panel">
      <div className="panel-heading">
        <h2><ClipboardCheck size={18} /> Decision history</h2>
        <span className="badge risk-none">{actionLabels[decision.finalAction]}</span>
      </div>
      <dl className="decision-history-list">
        <div>
          <dt>Moderator</dt>
          <dd>u/{decision.moderatorUsername}</dd>
        </div>
        <div>
          <dt>Recorded</dt>
          <dd>{formatDecisionTime(decision.decidedAt)}</dd>
        </div>
        <div>
          <dt>Review snapshot</dt>
          <dd>{decision.aiSnapshot ? "Saved with decision" : "Not used"}</dd>
        </div>
        <div>
          <dt>Signal feedback</dt>
          <dd>{decision.aiFeedback ? feedbackLabels[decision.aiFeedback] : "Not recorded"}</dd>
        </div>
        {decision.selectedRuleTitle ? (
          <div>
            <dt>Selected rule</dt>
            <dd>{decision.selectedRuleTitle}</dd>
          </div>
        ) : null}
        {decision.note ? (
          <div>
            <dt>Moderator note</dt>
            <dd>{decision.note}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
