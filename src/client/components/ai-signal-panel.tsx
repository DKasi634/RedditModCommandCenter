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
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--cc-text)]"><Icon name="brain" /> Review signal</h2>
        <p className={muted}>Review signals are disabled for this workspace.</p>
      </section>
    );
  }

  if (state === "analyzing") {
    return (
      <section className={panel}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--cc-text)]"><Icon name="brain" /> Review signal</h2>
        <p className={muted}>Reading context and preparing guidance...</p>
      </section>
    );
  }

  if (!classification) {
    return (
      <section className={panel}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--cc-text)]"><Icon name="brain" /> Review signal</h2>
        <p className={muted}>No review signal yet. Moderators can review manually or run a guided review.</p>
      </section>
    );
  }

  const confidencePercent = Math.round(classification.confidence * 100);
  const metadata = analysisMetadata(classification, state);

  return (
    <section className={panel}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="mb-0 flex items-center gap-2 text-lg font-bold text-[var(--cc-text)]"><Icon name="brain" /> Review signal</h2>
        <span className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full border border-[var(--cc-accent-soft-border)] bg-[var(--cc-accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--cc-accent-strong)]">
          <Icon name="sparkles" size={14} /> <span className="truncate">Command Center</span>
        </span>
      </div>
      <p className={`mb-4 text-sm ${muted}`}>{metadata}</p>
      <div className="mb-4 grid grid-cols-3 gap-1.5 max-[720px]:grid-cols-1">
        <div>
          <div className="rounded-t-xl border border-b-0 border-[var(--cc-border)] bg-[var(--cc-panel)] px-3 py-2 text-xs font-bold uppercase tracking-[0.02em] text-[var(--cc-muted)]">
            Recommendation
          </div>
          <div className="min-h-[72px] rounded-b-xl border border-[var(--cc-border)] bg-[var(--cc-subtle)] p-3">
            <strong className="block leading-snug">{actionLabels[classification.suggestedAction]}</strong>
          </div>
        </div>
        <div>
          <div className="rounded-t-xl border border-b-0 border-[var(--cc-border)] bg-[var(--cc-panel)] px-3 py-2 text-xs font-bold uppercase tracking-[0.02em] text-[var(--cc-muted)]">
            Risk
          </div>
          <div className="min-h-[72px] rounded-b-xl border border-[var(--cc-border)] bg-[var(--cc-subtle)] p-3">
            <span className="flex items-center gap-1.5">
              <RiskBadge riskLevel={classification.riskLevel} />
              <strong>{formatRiskLevel(classification.riskLevel)}</strong>
            </span>
          </div>
        </div>
        <div>
          <div className="rounded-t-xl border border-b-0 border-[var(--cc-border)] bg-[var(--cc-panel)] px-3 py-2 text-xs font-bold uppercase tracking-[0.02em] text-[var(--cc-muted)]">
            Confidence
          </div>
          <div className="min-h-[72px] rounded-b-xl border border-[var(--cc-border)] bg-[var(--cc-subtle)] p-3">
            <strong>{confidencePercent}%</strong>
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[var(--cc-meter-track)]" aria-label={`${confidencePercent}% confidence`}>
              <span className="block h-full rounded-full bg-[var(--cc-accent)]" style={{ width: `${confidencePercent}%` }} />
            </span>
          </div>
        </div>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-[var(--cc-text)]">{classification.summary}</p>
      {classification.needsSecondOpinion ? (
        <p className="mb-4 flex items-center gap-2 rounded-md border border-[var(--cc-warning-border)] bg-[var(--cc-warning-bg)] px-3 py-2 text-sm font-semibold text-[var(--cc-warning-text)]">
          <Icon name="alert" size={16} /> Second opinion suggested.
        </p>
      ) : null}
      <h3 className="mb-2 text-sm font-bold">Possible rule matches</h3>
      {classification.matchedRules.length > 0 ? (
        <ul className="mb-4 list-none p-0">
          {classification.matchedRules.map((rule) => (
            <li className="flex items-center justify-between gap-3 rounded-md border border-[var(--cc-border)] px-3 py-2" key={rule.ruleId}>
              <span>{rule.ruleTitle}</span>
              <strong>{Math.round(rule.confidence * 100)}%</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className={muted}>No direct subreddit rule match.</p>
      )}
      <details className="border-t border-[var(--cc-border)] pt-3" open={showSummaryByDefault}>
        <summary className="cursor-pointer text-sm font-bold">Context notes for mods</summary>
        <ul className="mb-0 mt-2 pl-5 text-sm leading-relaxed">
          {classification.reasoningForMods.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </details>
      <p className={`mt-4 border-t border-[var(--cc-border)] pt-3 text-sm ${muted}`}>
        Generated as moderator guidance. Final decisions stay with the mod team.
      </p>
    </section>
  );
}
