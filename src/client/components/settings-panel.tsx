import { Settings } from "lucide-react";
import type { SubredditSettings } from "../../shared/domain";

type Props = {
  settings: SubredditSettings;
  isDisabled?: boolean;
  onSave: (settings: SubredditSettings) => Promise<void>;
};

export function SettingsPanel({ settings, isDisabled = false, onSave }: Props) {
  function update(next: Partial<SubredditSettings>) {
    void onSave({ ...settings, ...next });
  }

  return (
    <section className="panel settings-panel">
      <h2><Settings size={18} /> Moderator settings</h2>
      <div className="settings-grid">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.aiEnabled}
            disabled={isDisabled}
            onChange={(event) => update({ aiEnabled: event.target.checked })}
          />
          AI analysis
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.showResolvedByDefault}
            disabled={isDisabled}
            onChange={(event) => update({ showResolvedByDefault: event.target.checked })}
          />
          Show resolved by default
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.showAiSummaryByDefault}
            disabled={isDisabled}
            onChange={(event) => update({ showAiSummaryByDefault: event.target.checked })}
          />
          Expand AI reasoning
        </label>
        <label>
          Classification mode
          <select
            value={settings.classificationMode}
            disabled={isDisabled || !settings.aiEnabled}
            onChange={(event) =>
              update({ classificationMode: event.target.value as SubredditSettings["classificationMode"] })
            }
          >
            <option value="manual">Manual</option>
            <option value="auto_on_load">Auto on load</option>
          </select>
        </label>
        <label>
          Second-opinion threshold
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
