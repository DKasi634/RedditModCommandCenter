import { Check, Flag, RefreshCcw, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import type { ModeratorDecision, QueueViewItem, WorkflowStatus } from "../../shared/domain";

const statuses: WorkflowStatus[] = [
  "needs_review",
  "claimed",
  "needs_second_opinion",
  "likely_approve",
  "likely_remove",
  "resolved",
  "ignored_ai_suggestion"
];

type Props = {
  item: QueueViewItem;
  isDisabled?: boolean;
  isAnalyzing?: boolean;
  aiEnabled?: boolean;
  isEmbedded?: boolean;
  onStatusChange: (status: WorkflowStatus) => Promise<void>;
  onClassify: () => Promise<void>;
  onDecision: (decision: Omit<ModeratorDecision, "decidedAt" | "moderatorUsername">) => Promise<void>;
};

type AiFeedback = NonNullable<ModeratorDecision["aiFeedback"]>;

export function DecisionPanel({
  item,
  isDisabled = false,
  isAnalyzing = false,
  aiEnabled = true,
  isEmbedded = false,
  onStatusChange,
  onClassify,
  onDecision,
}: Props) {
  const [note, setNote] = useState("");
  const [aiFeedback, setAiFeedback] = useState<AiFeedback>("correct");
  const [isSaving, setIsSaving] = useState(false);
  const isBusy = isDisabled || isSaving;
  const analyzeLabel = item.classification ? "Reanalyze with AI" : "Analyze with AI";

  async function saveDecision(finalAction: ModeratorDecision["finalAction"]) {
    setIsSaving(true);
    try {
      const matchedRule = item.classification?.matchedRules[0];
      const decision: Omit<ModeratorDecision, "decidedAt" | "moderatorUsername"> = {
        thingId: item.thingId,
        finalAction,
        note,
        aiFeedback,
      };

      if (item.classification) {
        decision.aiSnapshot = item.classification;
      }

      if (matchedRule) {
        decision.selectedRuleId = matchedRule.ruleId;
        decision.selectedRuleTitle = matchedRule.ruleTitle;
      }

      await onDecision(decision);
      await onStatusChange("resolved");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={isEmbedded ? "tab-section decision-panel" : "panel decision-panel"}>
      {!isEmbedded ? <h2><ShieldAlert size={18} /> Moderator controls</h2> : null}
      <div className="decision-grid">
        <label>
          Workflow status
          <select
            value={item.status}
            disabled={isBusy}
            onChange={(event) => void onStatusChange(event.target.value as WorkflowStatus)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>
        <div className="decision-ai-action">
          <span className="field-label">AI analysis</span>
          <button className="secondary" disabled={isBusy || !aiEnabled} onClick={() => void onClassify()}>
            <RefreshCcw size={16} /> {isAnalyzing ? "Analyzing..." : analyzeLabel}
          </button>
        </div>
        <label>
          AI feedback
          <select
            value={aiFeedback}
            disabled={isBusy}
            onChange={(event) => setAiFeedback(event.target.value as AiFeedback)}
          >
            <option value="correct">Correct</option>
            <option value="partially_correct">Partially correct</option>
            <option value="wrong">Wrong</option>
            <option value="unclear">Unclear</option>
            <option value="not_useful">Not useful</option>
            <option value="missed_context">Missed important context</option>
          </select>
        </label>
        <label className="note-field">
          Moderator note
          <textarea value={note} disabled={isBusy} onChange={(event) => setNote(event.target.value)} rows={4} />
        </label>
      </div>
      {!aiEnabled ? <p className="muted action-status">AI analysis is disabled in settings.</p> : null}
      <div className="button-row">
        <button disabled={isBusy} onClick={() => void saveDecision("approved")}><Check size={16} /> Approve</button>
        <button disabled={isBusy} onClick={() => void saveDecision("removed")}><X size={16} /> Remove</button>
        <button disabled={isBusy} onClick={() => void saveDecision("escalated")}><Flag size={16} /> Escalate</button>
      </div>
      {isBusy ? <p className="muted action-status">Working...</p> : null}
    </section>
  );
}
