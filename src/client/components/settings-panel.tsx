import { Settings } from "lucide-react";
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
  function update(next: Partial<SubredditSettings>) {
    void onSave({ ...settings, ...next });
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
            <strong>AI analysis</strong>
            <small>Allow Gemini-assisted review</small>
          </span>
          <input
            type="checkbox"
            checked={settings.aiEnabled}
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
            checked={settings.showResolvedByDefault}
            disabled={isDisabled}
            onChange={(event) => update({ showResolvedByDefault: event.target.checked })}
          />
        </label>
        <label className="setting-card toggle-row">
          <span>
            <strong>AI reasoning</strong>
            <small>Expand reasoning by default</small>
          </span>
          <input
            type="checkbox"
            checked={settings.showAiSummaryByDefault}
            disabled={isDisabled}
            onChange={(event) => update({ showAiSummaryByDefault: event.target.checked })}
          />
        </label>
        <label className="setting-card setting-field">
          <span>
            <strong>Classification mode</strong>
            <small>Choose manual or auto analysis</small>
          </span>
          <UiSelect
            value={settings.classificationMode}
            disabled={isDisabled || !settings.aiEnabled}
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
            value={settings.secondOpinionThreshold}
            disabled={isDisabled}
            onChange={(event) => update({ secondOpinionThreshold: Number(event.target.value) })}
          />
        </label>
      </div>
      <p className="muted">Settings save immediately and apply to this subreddit workspace.</p>
    </section>
  );
}
