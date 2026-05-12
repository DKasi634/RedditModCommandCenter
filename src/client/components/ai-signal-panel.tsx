import { AlertTriangle, Brain } from "lucide-react";
import type { ClassificationResult } from "../../shared/domain";
import { formatRiskLevel } from "../utils/format-risk-level";
import { RiskBadge } from "./status-badge";

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

  return (
    <section className="panel">
      <h2><Brain size={18} /> AI signal</h2>
      <div className="inline-row">
        <RiskBadge riskLevel={classification.riskLevel} />
        <strong>{formatRiskLevel(classification.riskLevel)}</strong>
        <span className="muted">{Math.round(classification.confidence * 100)}% confidence</span>
      </div>
      <p>{classification.summary}</p>
      {classification.needsSecondOpinion ? (
        <p className="callout"><AlertTriangle size={16} /> Second opinion suggested.</p>
      ) : null}
      <h3>Possible rule matches</h3>
      <ul>
        {classification.matchedRules.map((rule) => (
          <li key={rule.ruleId}>
            {rule.ruleTitle} <span className="muted">{Math.round(rule.confidence * 100)}%</span>
          </li>
        ))}
      </ul>
      <h3>Reasoning for mods</h3>
      <ul>
        {classification.reasoningForMods.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="muted">
        {classification.modelProvider} / {classification.modelVersion} / {classification.promptVersion}
      </p>
    </section>
  );
}
