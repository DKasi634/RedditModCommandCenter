import { useState } from "react";
import type { ModeratorDecision, QueueViewItem, SecondOpinionReason, WorkflowStatus } from "../../shared/domain";
import { buttonPrimary, buttonSecondary, field, muted, panel } from "../lib/ui";
import { Icon } from "./icon";
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
  const analyzeLabel = item.classification ? "Rerun review" : "Run guided review";
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
    <section className={isEmbedded ? "" : panel}>
      {!isEmbedded ? <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--cc-text)]"><Icon name="shield" /> Moderator controls</h2> : null}
      <div className="grid grid-cols-3 gap-3 max-[960px]:grid-cols-1">
        <label className="text-sm font-bold">
          Workflow status
          <UiSelect
            value={item.status}
            disabled={isBusy || isOwnOpenEscalation}
            options={statusOptions}
            onChange={(status) => void onStatusChange(status)}
          />
        </label>
        <div>
          <span className="mb-1 block text-sm font-bold">Guided review</span>
          <button className={`${buttonSecondary} h-10 w-full rounded-2xl`} disabled={isBusy || !aiEnabled} onClick={() => void onClassify()}>
            <Icon name="refresh" size={16} className={isAnalyzing ? "animate-spin" : undefined} />
            {isAnalyzing ? "Reviewing..." : analyzeLabel}
          </button>
        </div>
        <label className="text-sm font-bold">
          Signal feedback
          <UiSelect
            value={aiFeedback}
            disabled={isBusy}
            options={aiFeedbackOptions}
            onChange={setAiFeedback}
          />
        </label>
        <label className="col-span-3 text-sm font-bold max-[960px]:col-span-1">
          Moderator note
          <textarea
            className={`${field} min-h-[112px] resize-none rounded-2xl font-normal`}
            value={note}
            disabled={isBusy}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
          />
        </label>
      </div>
      {isEscalating ? (
        <div className="mt-4 rounded-md border border-[var(--cc-warning-border)] bg-[var(--cc-warning-bg)] p-4">
          <div>
            <h3 className="mb-1 text-sm font-bold">Request second opinion</h3>
            <p className={muted}>Ask another moderator to review this item before a final action is taken.</p>
          </div>
          <label className="mt-3 block text-sm font-bold">
            Reason
            <UiSelect
              value={secondOpinionReason}
              disabled={isBusy}
              options={secondOpinionReasonOptions}
              onChange={setSecondOpinionReason}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className={buttonPrimary}
              disabled={isBusy || !canEscalate}
              onClick={() => void saveDecision("escalated", { secondOpinionReason })}
            >
              <Icon name="flag" size={16} /> Send request
            </button>
            <button className={buttonSecondary} disabled={isBusy} onClick={() => setIsEscalating(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {!aiEnabled ? <p className={`mt-3 ${muted}`}>Guided review is disabled in settings.</p> : null}
      {!canEscalate ? (
        <p className={`mt-3 ${muted}`}>No other moderators are available for second opinion.</p>
      ) : null}
      {isOwnOpenEscalation ? (
        <p className={`mt-3 ${muted}`}>Waiting for another moderator to resolve this second-opinion request.</p>
      ) : null}
      {isResolvingSecondOpinion ? (
        <div className="mt-4 flex gap-2 rounded-md border border-[var(--cc-success-border)] bg-[var(--cc-success-bg)] p-3 text-sm text-[var(--cc-success-text)]">
          <Icon name="checkCircle" size={16} />
          <div>
            <strong>Resolving second opinion</strong>
            <span className="block">Archive or Remove will close the request from u/{item.secondOpinion?.escalatedBy} and record you as the resolving moderator.</span>
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={buttonPrimary} disabled={finalActionDisabled} onClick={() => void saveDecision("approved")}><Icon name="archive" size={16} /> Archive</button>
        <button className={buttonPrimary} disabled={finalActionDisabled} onClick={() => void saveDecision("removed")}><Icon name="x" size={16} /> Remove</button>
        <button className={buttonPrimary} disabled={requestSecondOpinionDisabled} onClick={() => setIsEscalating(true)}><Icon name="flag" size={16} /> Request opinion</button>
      </div>
      {isBusy ? <p className={`mt-3 ${muted}`}>Working...</p> : null}
    </section>
  );
}
