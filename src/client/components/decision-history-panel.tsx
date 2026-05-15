import type { ModeratorDecision } from "../../shared/domain";
import { panel, muted } from "../lib/ui";
import { Icon } from "./icon";

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
      <section className={panel}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--cc-text)]"><Icon name="clipboard" /> Decision history</h2>
        <p className={muted}>No app-tracked decision has been recorded for this item yet.</p>
      </section>
    );
  }

  return (
    <section className={panel}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="mb-0 flex items-center gap-2 text-lg font-bold text-[var(--cc-text)]"><Icon name="clipboard" /> Decision history</h2>
        <span className="inline-flex items-center rounded-full border border-[var(--cc-border)] bg-[var(--cc-chip)] px-2 py-0.5 text-xs font-bold text-[var(--cc-muted-strong)]">{actionLabels[decision.finalAction]}</span>
      </div>
      <dl className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
        <div className="rounded-md bg-[var(--cc-subtle)] p-3">
          <dt className="text-xs font-bold text-[var(--cc-muted)]">Moderator</dt>
          <dd>u/{decision.moderatorUsername}</dd>
        </div>
        <div className="rounded-md bg-[var(--cc-subtle)] p-3">
          <dt className="text-xs font-bold text-[var(--cc-muted)]">Recorded</dt>
          <dd>{formatDecisionTime(decision.decidedAt)}</dd>
        </div>
        <div className="rounded-md bg-[var(--cc-subtle)] p-3">
          <dt className="text-xs font-bold text-[var(--cc-muted)]">Review snapshot</dt>
          <dd>{decision.aiSnapshot ? "Saved with decision" : "Not used"}</dd>
        </div>
        <div className="rounded-md bg-[var(--cc-subtle)] p-3">
          <dt className="text-xs font-bold text-[var(--cc-muted)]">Signal feedback</dt>
          <dd>{decision.aiFeedback ? feedbackLabels[decision.aiFeedback] : "Not recorded"}</dd>
        </div>
        {decision.selectedRuleTitle ? (
          <div className="rounded-md bg-[var(--cc-subtle)] p-3">
            <dt className="text-xs font-bold text-[var(--cc-muted)]">Selected rule</dt>
            <dd>{decision.selectedRuleTitle}</dd>
          </div>
        ) : null}
        {decision.note ? (
          <div className="rounded-md bg-[var(--cc-subtle)] p-3">
            <dt className="text-xs font-bold text-[var(--cc-muted)]">Moderator note</dt>
            <dd>{decision.note}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
