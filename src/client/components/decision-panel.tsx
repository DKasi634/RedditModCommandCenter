import { Archive, CheckCircle2, Flag, RefreshCcw, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import type { ModeratorDecision, QueueViewItem, SecondOpinionReason, WorkflowStatus } from "../../shared/domain";
import { UiSelect } from "./ui-select";

type AiFeedback = NonNullable<ModeratorDecision["aiFeedback"]>;

const statuses: WorkflowStatus[] = [
  "needs_review",
  "claimed",
  "needs_second_opinion",
  "likely_approve",
  "likely_remove",
  "resolved",
  "ignored_ai_suggestion"
];

const statusOptions = statuses.map((status) => ({
  label: status.replaceAll("_", " "),
  value: status,
}));

const aiFeedbackOptions: Array<{ label: string; value: AiFeedback }> = [
  { label: "Correct", value: "correct" },
  { label: "Partially correct", value: "partially_correct" },
  { label: "Wrong", value: "wrong" },
  { label: "Unclear", value: "unclear" },
  { label: "Not useful", value: "not_useful" },
  { label: "Missed important context", value: "missed_context" },
];

const secondOpinionReasonOptions: Array<{ label: string; value: SecondOpinionReason }> = [
  { label: "Needs another moderator", value: "senior_mod_review" },
  { label: "Rule ambiguity", value: "rule_ambiguity" },
  { label: "Possible policy issue", value: "policy_question" },
  { label: "Context unclear", value: "context_unclear" },
  { label: "Other", value: "other" },
];

type Props = {
  item: QueueViewItem;
  isDisabled?: boolean;
  isAnalyzing?: boolean;
  aiEnabled?: boolean;
  isEmbedded?: boolean;
  canEscalate?: boolean;
  currentModeratorUsername?: string;
  onStatusChange: (status: WorkflowStatus) => Promise<void>;
  onClassify: () => Promise<void>;
  onDecision: (decision: Omit<ModeratorDecision, "decidedAt" | "moderatorUsername">) => Promise<void>;
};

export function DecisionPanel({
  item,
  isDisabled = false,
  isAnalyzing = false,
  aiEnabled = true,
  isEmbedded = false,
  canEscalate = false,
  currentModeratorUsername,
  onStatusChange,
  onClassify,
  onDecision,
}: Props) {
  const [note, setNote] = useState("");
  const [aiFeedback, setAiFeedback] = useState<AiFeedback>("correct");
  const [isEscalating, setIsEscalating] = useState(false);
  const [secondOpinionReason, setSecondOpinionReason] = useState<SecondOpinionReason>("context_unclear");
  const [isSaving, setIsSaving] = useState(false);
  const isBusy = isDisabled || isSaving;
  const analyzeLabel = item.classification ? "Reanalyze with AI" : "Analyze with AI";
  const isOwnOpenEscalation = item.secondOpinion?.status === "open" &&
    currentModeratorUsername !== undefined &&
    item.secondOpinion.escalatedBy.toLowerCase() === currentModeratorUsername.toLowerCase();
  const isResolvingSecondOpinion = item.secondOpinion?.status === "open" && !isOwnOpenEscalation;
  const finalActionDisabled = isBusy || isOwnOpenEscalation;
  const requestSecondOpinionDisabled = isBusy || !canEscalate || item.secondOpinion?.status === "open";

  async function saveDecision(
    finalAction: ModeratorDecision["finalAction"],
    options: { secondOpinionReason?: SecondOpinionReason } = {},
  ) {
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

      if (options.secondOpinionReason) {
        decision.secondOpinionReason = options.secondOpinionReason;
      }

      await onDecision(decision);
      if (finalAction === "approved" || finalAction === "removed") {
        await onStatusChange("resolved");
      } else if (finalAction === "escalated") {
        await onStatusChange("needs_second_opinion");
        setIsEscalating(false);
      }
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
          <UiSelect
            value={item.status}
            disabled={isBusy || isOwnOpenEscalation}
            options={statusOptions}
            onChange={(status) => void onStatusChange(status)}
          />
        </label>
        <div className="decision-ai-action">
          <span className="field-label">AI analysis</span>
          <button className="secondary" disabled={isBusy || !aiEnabled} onClick={() => void onClassify()}>
            <RefreshCcw className={isAnalyzing ? "spin-icon" : undefined} size={16} />
            {isAnalyzing ? "Analyzing..." : analyzeLabel}
          </button>
        </div>
        <label>
          AI feedback
          <UiSelect
            value={aiFeedback}
            disabled={isBusy}
            options={aiFeedbackOptions}
            onChange={setAiFeedback}
          />
        </label>
        <label className="note-field">
          Moderator note
          <textarea value={note} disabled={isBusy} onChange={(event) => setNote(event.target.value)} rows={4} />
        </label>
      </div>
      {isEscalating ? (
        <div className="second-opinion-form">
          <div>
            <h3>Request second opinion</h3>
            <p className="muted">Ask another moderator to review this item before a final action is taken.</p>
          </div>
          <label>
            Reason
            <UiSelect
              value={secondOpinionReason}
              disabled={isBusy}
              options={secondOpinionReasonOptions}
              onChange={setSecondOpinionReason}
            />
          </label>
          <div className="button-row">
            <button
              disabled={isBusy || !canEscalate}
              onClick={() => void saveDecision("escalated", { secondOpinionReason })}
            >
              <Flag size={16} /> Send request
            </button>
            <button className="secondary" disabled={isBusy} onClick={() => setIsEscalating(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {!aiEnabled ? <p className="muted action-status">AI analysis is disabled in settings.</p> : null}
      {!canEscalate ? (
        <p className="muted action-status">No other moderators are available for second opinion.</p>
      ) : null}
      {isOwnOpenEscalation ? (
        <p className="muted action-status">Waiting for another moderator to resolve this second-opinion request.</p>
      ) : null}
      {isResolvingSecondOpinion ? (
        <div className="resolution-callout">
          <CheckCircle2 size={16} />
          <div>
            <strong>Resolving second opinion</strong>
            <span>Archive or Remove will close the request from u/{item.secondOpinion?.escalatedBy} and record you as the resolving moderator.</span>
          </div>
        </div>
      ) : null}
      <div className="button-row">
        <button disabled={finalActionDisabled} onClick={() => void saveDecision("approved")}><Archive size={16} /> Archive</button>
        <button disabled={finalActionDisabled} onClick={() => void saveDecision("removed")}><X size={16} /> Remove</button>
        <button disabled={requestSecondOpinionDisabled} onClick={() => setIsEscalating(true)}><Flag size={16} /> Request opinion</button>
      </div>
      {isBusy ? <p className="muted action-status">Working...</p> : null}
    </section>
  );
}
