import { useEffect, useMemo, useState } from "react";
import type { SubredditSettings } from "../../shared/domain";
import { cn } from "../lib/cn";
import { buttonPrimary, field, muted, panel } from "../lib/ui";
import { Icon } from "./icon";
import { UiSelect } from "./ui-select";

type Props = {
  settings: SubredditSettings;
  isDisabled?: boolean;
  isEmbedded?: boolean;
  onSave: (settings: SubredditSettings) => Promise<void>;
};

const classificationModeOptions: Array<{
  label: string;
  value: SubredditSettings["classificationMode"];
}> = [
  { label: "Manual", value: "manual" },
  { label: "Auto on load", value: "auto_on_load" },
];

export function SettingsPanel({ settings, isDisabled = false, isEmbedded = false, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  const [thresholdInput, setThresholdInput] = useState(String(settings.secondOpinionThreshold));

  useEffect(() => {
    setDraft(settings);
    setThresholdInput(String(settings.secondOpinionThreshold));
  }, [settings]);

  const thresholdValue = Number(thresholdInput);
  const thresholdIsValid = thresholdInput.trim() !== "" && Number.isFinite(thresholdValue) && thresholdValue >= 0 && thresholdValue <= 100;
  const hasChanges = useMemo(
    () => JSON.stringify({ ...draft, secondOpinionThreshold: thresholdInput }) !==
      JSON.stringify({ ...settings, secondOpinionThreshold: String(settings.secondOpinionThreshold) }),
    [draft, settings, thresholdInput],
  );

  function update(next: Partial<SubredditSettings>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  async function saveDraft() {
    if (!thresholdIsValid) return;
    await onSave({
      ...draft,
      secondOpinionThreshold: thresholdValue,
    });
  }

  return (
    <section className={isEmbedded ? "" : cn(panel, "max-[640px]:border-0 max-[640px]:bg-transparent max-[640px]:p-0")}>
      {!isEmbedded ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="mb-0 flex items-center gap-2 text-lg font-bold text-[var(--cc-text)]"><Icon name="settings" /> Moderator settings</h2>
          <span className="inline-flex rounded-full border border-[var(--cc-border)] bg-[var(--cc-chip)] px-2 py-0.5 text-xs font-bold text-[var(--cc-muted-strong)]">Subreddit workspace</span>
        </div>
      ) : null}
      <div className="grid grid-cols-5 gap-3 max-[1180px]:grid-cols-2 max-[720px]:grid-cols-1">
        <label className="flex min-h-[74px] items-center justify-between gap-3 rounded-md bg-[var(--cc-subtle)] p-3">
          <span>
            <strong className="block">Insight check</strong>
            <small className={muted}>Enable Command Center triage insights</small>
          </span>
          <input
            type="checkbox"
            checked={draft.aiEnabled}
            disabled={isDisabled}
            onChange={(event) => update({ aiEnabled: event.target.checked })}
          />
        </label>
        <label className="flex min-h-[74px] items-center justify-between gap-3 rounded-md bg-[var(--cc-subtle)] p-3">
          <span>
            <strong className="block">Resolved default</strong>
            <small className={muted}>Open with resolved items visible</small>
          </span>
          <input
            type="checkbox"
            checked={draft.showResolvedByDefault}
            disabled={isDisabled}
            onChange={(event) => update({ showResolvedByDefault: event.target.checked })}
          />
        </label>
        <label className="flex min-h-[74px] items-center justify-between gap-3 rounded-md bg-[var(--cc-subtle)] p-3">
          <span>
            <strong className="block">Context notes</strong>
            <small className={muted}>Expand review notes by default</small>
          </span>
          <input
            type="checkbox"
            checked={draft.showAiSummaryByDefault}
            disabled={isDisabled}
            onChange={(event) => update({ showAiSummaryByDefault: event.target.checked })}
          />
        </label>
        <label className="rounded-md bg-[var(--cc-subtle)] p-3">
          <span>
            <strong className="block">Review mode</strong>
            <small className={muted}>Choose manual or automatic guidance</small>
          </span>
          <UiSelect
            value={draft.classificationMode}
            disabled={isDisabled || !draft.aiEnabled}
            options={classificationModeOptions}
            onChange={(classificationMode) => update({ classificationMode })}
          />
        </label>
        <label className="rounded-md bg-[var(--cc-subtle)] p-3">
          <span>
            <strong className="block">Second-opinion threshold</strong>
            <small className={muted}>0-100 moderation sensitivity</small>
          </span>
          <input
            className={`${field} mt-2`}
            type="number"
            min={0}
            max={100}
            value={thresholdInput}
            disabled={isDisabled}
            onChange={(event) => setThresholdInput(event.target.value)}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 max-[720px]:block">
        <p className={thresholdIsValid ? muted : "text-sm font-semibold text-[var(--cc-danger-text)]"}>
          {thresholdIsValid
            ? "Review changes, then save them for this subreddit workspace."
            : "Second-opinion threshold must be between 0 and 100."}
        </p>
        <button className={`${buttonPrimary} max-[720px]:mt-3`} disabled={isDisabled || !hasChanges || !thresholdIsValid} onClick={() => void saveDraft()}>
          Save settings
        </button>
      </div>
    </section>
  );
}
