import { AlertTriangle, Brain, Sparkles } from "lucide-react";
import type { ClassificationResult, ClassificationState } from "../../shared/domain";
import { formatRiskLevel } from "../utils/format-risk-level";
import { RiskBadge } from "./status-badge";

const actionLabels: Record<ClassificationResult["suggestedAction"], string> = {
  approve: "Likely approve",
  remove: "Likely remove",
  needs_review: "Needs review",
  needs_second_opinion: "Needs second opinion",
};

function analysisMetadata(classification: ClassificationResult, state: ClassificationState) {
  if (state === "fallback") {
    return "Fallback analysis shown";
  }

  const createdAt = new Date(classification.createdAt).getTime();
  const elapsedSeconds = Number.isFinite(createdAt) ? Math.max(0, Math.floor((Date.now() - createdAt) / 1000)) : 0;

  if (elapsedSeconds < 60) {
    return "Analyzed just now";
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `Last analyzed ${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `Last analyzed ${elapsedHours}h ago`;
  }

  return `Last analyzed ${Math.floor(elapsedHours / 24)}d ago`;
}

export function AiSignalPanel({
  classification,
  state,
  showSummaryByDefault,
}: {
  classification?: ClassificationResult | undefined;
  state: ClassificationState;
  showSummaryByDefault: boolean;
}) {
  if (state === "disabled") {
    return (
      <section className="panel">
        <h2><Brain size={18} /> AI signal</h2>
        <p className="muted">AI analysis is disabled for this workspace.</p>
      </section>
    );
  }

  if (state === "analyzing") {
    return (
      <section className="panel">
        <h2><Brain size={18} /> AI signal</h2>
        <p className="muted">Analyzing this item...</p>
      </section>
    );
  }

  if (!classification) {
    return (
      <section className="panel">
        <h2><Brain size={18} /> AI signal</h2>
        <p className="muted">Not analyzed yet. Moderators can review manually or run AI analysis.</p>
      </section>
    );
  }

  const confidencePercent = Math.round(classification.confidence * 100);
  const metadata = analysisMetadata(classification, state);

  return (
    <section className="panel ai-signal-panel">
      <div className="panel-heading">
        <h2><Brain size={18} /> AI signal</h2>
        <span className="model-pill">
          <Sparkles size={14} /> {classification.modelProvider}
        </span>
      </div>
      <p className="muted analysis-metadata">{metadata}</p>
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
      <details className="ai-details" open={showSummaryByDefault}>
        <summary>Reasoning for mods</summary>
        <ul className="reasoning-list">
          {classification.reasoningForMods.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </details>
      <p className="muted model-footnote">
        {classification.modelVersion} / {classification.promptVersion}
      </p>
    </section>
  );
}
