import type { ClassificationResult, ClassificationState } from "../../shared/domain";
import { panel, muted } from "../lib/ui";
import { formatRiskLevel } from "../utils/format-risk-level";
import { Icon } from "./icon";
import { RiskBadge } from "./status-badge";

const actionLabels: Record<ClassificationResult["suggestedAction"], string> = {
  approve: "Likely approve",
  remove: "Likely remove",
  needs_review: "Needs review",
  needs_second_opinion: "Needs second opinion",
};

function analysisMetadata(classification: ClassificationResult, state: ClassificationState) {
  if (state === "fallback") {
    return "Local review signal shown";
  }

  const createdAt = new Date(classification.createdAt).getTime();
  const elapsedSeconds = Number.isFinite(createdAt) ? Math.max(0, Math.floor((Date.now() - createdAt) / 1000)) : 0;

  if (elapsedSeconds < 60) {
    return "Reviewed just now";
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `Last reviewed ${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `Last reviewed ${elapsedHours}h ago`;
  }

  return `Last reviewed ${Math.floor(elapsedHours / 24)}d ago`;
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
      <section className={panel}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#1c1c1c]"><Icon name="brain" /> Review signal</h2>
        <p className={muted}>Review signals are disabled for this workspace.</p>
      </section>
    );
  }

  if (state === "analyzing") {
    return (
      <section className={panel}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#1c1c1c]"><Icon name="brain" /> Review signal</h2>
        <p className={muted}>Reading context and preparing guidance...</p>
      </section>
    );
  }

  if (!classification) {
    return (
      <section className={panel}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#1c1c1c]"><Icon name="brain" /> Review signal</h2>
        <p className={muted}>No review signal yet. Moderators can review manually or run a guided review.</p>
      </section>
    );
  }

  const confidencePercent = Math.round(classification.confidence * 100);
  const metadata = analysisMetadata(classification, state);

  return (
    <section className={panel}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="mb-0 flex items-center gap-2 text-lg font-bold text-[#1c1c1c]"><Icon name="brain" /> Review signal</h2>
        <span className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full border border-[#fed8c7] bg-[#fff1eb] px-2.5 py-1 text-xs font-bold text-[#d93a00]">
          <Icon name="sparkles" size={14} /> <span className="truncate">Command Center</span>
        </span>
      </div>
      <p className={`mb-4 text-sm ${muted}`}>{metadata}</p>
      <div className="mb-4 grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-1">
        <div className="rounded-md bg-[#f6f7f8] p-3">
          <span className={muted}>Recommendation</span>
          <strong>{actionLabels[classification.suggestedAction]}</strong>
        </div>
        <div className="rounded-md bg-[#f6f7f8] p-3">
          <span className={muted}>Risk</span>
          <span className="flex items-center gap-1.5">
            <RiskBadge riskLevel={classification.riskLevel} />
            <strong>{formatRiskLevel(classification.riskLevel)}</strong>
          </span>
        </div>
        <div className="rounded-md bg-[#f6f7f8] p-3">
          <span className={muted}>Confidence</span>
          <strong>{confidencePercent}%</strong>
          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[#dbe3e7]" aria-label={`${confidencePercent}% confidence`}>
            <span className="block h-full rounded-full bg-[#ff4500]" style={{ width: `${confidencePercent}%` }} />
          </span>
        </div>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-[#1c1c1c]">{classification.summary}</p>
      {classification.needsSecondOpinion ? (
        <p className="mb-4 flex items-center gap-2 rounded-md border border-[#fedf89] bg-[#fffaeb] px-3 py-2 text-sm font-semibold text-[#93370d]">
          <Icon name="alert" size={16} /> Second opinion suggested.
        </p>
      ) : null}
      <h3 className="mb-2 text-sm font-bold">Possible rule matches</h3>
      {classification.matchedRules.length > 0 ? (
        <ul className="mb-4 list-none p-0">
          {classification.matchedRules.map((rule) => (
            <li className="flex items-center justify-between gap-3 rounded-md border border-[#e5ebee] px-3 py-2" key={rule.ruleId}>
              <span>{rule.ruleTitle}</span>
              <strong>{Math.round(rule.confidence * 100)}%</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className={muted}>No direct subreddit rule match.</p>
      )}
      <details className="border-t border-[#e5ebee] pt-3" open={showSummaryByDefault}>
        <summary className="cursor-pointer text-sm font-bold">Context notes for mods</summary>
        <ul className="mb-0 mt-2 pl-5 text-sm leading-relaxed">
          {classification.reasoningForMods.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </details>
      <p className={`mt-4 border-t border-[#e5ebee] pt-3 text-sm ${muted}`}>
        Generated as moderator guidance. Final decisions stay with the mod team.
      </p>
    </section>
  );
}
