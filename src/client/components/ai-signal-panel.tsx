import { AlertTriangle, Brain, Sparkles } from "lucide-react";
import type { ClassificationResult } from "../../shared/domain";
import { formatRiskLevel } from "../utils/format-risk-level";
import { RiskBadge } from "./status-badge";

const actionLabels: Record<ClassificationResult["suggestedAction"], string> = {
  approve: "Likely approve",
  remove: "Likely remove",
  needs_review: "Needs review",
  needs_second_opinion: "Needs second opinion",
};

export function AiSignalPanel({
  classification,
}: {
  classification?: ClassificationResult | undefined;
}) {
  if (!classification) {
    return (
      <section className="panel">
        <h2><Brain size={18} /> AI signal</h2>
        <p className="muted">No cached classification yet. Moderators can still review manually.</p>
      </section>
    );
  }

  const confidencePercent = Math.round(classification.confidence * 100);

  return (
    <section className="panel ai-signal-panel">
      <div className="panel-heading">
        <h2><Brain size={18} /> AI signal</h2>
        <span className="model-pill">
          <Sparkles size={14} /> {classification.modelProvider}
        </span>
      </div>
      <div className="ai-signal-summary">
        <div>
          <span className="muted">Recommendation</span>
          <strong>{actionLabels[classification.suggestedAction]}</strong>
        </div>
        <div>
          <span className="muted">Risk</span>
          <span className="inline-row tight">
            <RiskBadge riskLevel={classification.riskLevel} />
            <strong>{formatRiskLevel(classification.riskLevel)}</strong>
          </span>
        </div>
        <div>
          <span className="muted">Confidence</span>
          <strong>{confidencePercent}%</strong>
          <span className="confidence-meter" aria-label={`${confidencePercent}% confidence`}>
            <span style={{ width: `${confidencePercent}%` }} />
          </span>
        </div>
      </div>
      <p className="ai-summary-text">{classification.summary}</p>
      {classification.needsSecondOpinion ? (
        <p className="callout"><AlertTriangle size={16} /> Second opinion suggested.</p>
      ) : null}
      <h3>Possible rule matches</h3>
      {classification.matchedRules.length > 0 ? (
        <ul className="rule-match-list">
          {classification.matchedRules.map((rule) => (
            <li key={rule.ruleId}>
              <span>{rule.ruleTitle}</span>
              <strong>{Math.round(rule.confidence * 100)}%</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No direct subreddit rule match.</p>
      )}
      <h3>Reasoning for mods</h3>
      <ul className="reasoning-list">
        {classification.reasoningForMods.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="muted model-footnote">
        {classification.modelVersion} / {classification.promptVersion}
      </p>
    </section>
  );
}
