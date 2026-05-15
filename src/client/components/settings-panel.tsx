import { Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SubredditSettings } from "../../shared/domain";
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
    <section className={isEmbedded ? "tab-section settings-panel" : "panel settings-panel"}>
      {!isEmbedded ? (
        <div className="panel-heading">
          <h2><Settings size={18} /> Moderator settings</h2>
          <span className="model-pill">Subreddit workspace</span>
        </div>
      ) : null}
      <div className="settings-grid">
        <label className="setting-card toggle-row">
          <span>
            <strong>Guided review</strong>
            <small>Enable Command Center review signals</small>
          </span>
          <input
            type="checkbox"
            checked={draft.aiEnabled}
            disabled={isDisabled}
            onChange={(event) => update({ aiEnabled: event.target.checked })}
          />
        </label>
        <label className="setting-card toggle-row">
          <span>
            <strong>Resolved default</strong>
            <small>Open with resolved items visible</small>
          </span>
          <input
            type="checkbox"
            checked={draft.showResolvedByDefault}
            disabled={isDisabled}
            onChange={(event) => update({ showResolvedByDefault: event.target.checked })}
          />
        </label>
        <label className="setting-card toggle-row">
          <span>
            <strong>Context notes</strong>
            <small>Expand review notes by default</small>
          </span>
          <input
            type="checkbox"
            checked={draft.showAiSummaryByDefault}
            disabled={isDisabled}
            onChange={(event) => update({ showAiSummaryByDefault: event.target.checked })}
          />
        </label>
        <label className="setting-card setting-field">
          <span>
            <strong>Review mode</strong>
            <small>Choose manual or automatic guidance</small>
          </span>
          <UiSelect
            value={draft.classificationMode}
            disabled={isDisabled || !draft.aiEnabled}
            options={classificationModeOptions}
            onChange={(classificationMode) => update({ classificationMode })}
          />
        </label>
        <label className="setting-card setting-field">
          <span>
            <strong>Second-opinion threshold</strong>
            <small>0-100 moderation sensitivity</small>
          </span>
          <input
            type="number"
            min={0}
            max={100}
            value={thresholdInput}
            disabled={isDisabled}
            onChange={(event) => setThresholdInput(event.target.value)}
          />
        </label>
      </div>
      <div className="settings-save-row">
        <p className={thresholdIsValid ? "muted" : "error-inline"}>
          {thresholdIsValid
            ? "Review changes, then save them for this subreddit workspace."
            : "Second-opinion threshold must be between 0 and 100."}
        </p>
        <button disabled={isDisabled || !hasChanges || !thresholdIsValid} onClick={() => void saveDraft()}>
          Save settings
        </button>
      </div>
    </section>
  );
}
