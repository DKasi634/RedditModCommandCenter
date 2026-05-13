import { History } from "lucide-react";
import type { UserHistory } from "../../shared/domain";

const actionLabels: Record<string, string> = {
  approved: "Last app-tracked action: approved",
  removed: "Last app-tracked action: removed",
  escalated: "Last app-tracked action: escalated",
  ignored: "Last app-tracked action: ignored",
};

export function UserHistoryPanel({ history }: { history: UserHistory }) {
  const lastAction = history.lastModerationAction
    ? actionLabels[history.lastModerationAction] ?? `Last app-tracked action: ${history.lastModerationAction}`
    : "No prior app-tracked moderation action.";

  return (
    <section className="panel">
      <h2><History size={18} /> User history</h2>
      <div className="metric-grid">
        <div><strong>{history.previousWarnings}</strong><span>Warnings</span></div>
        <div><strong>{history.previousApprovals ?? 0}</strong><span>Approvals</span></div>
        <div><strong>{history.previousRemovals}</strong><span>Removals</span></div>
        <div><strong>{history.previousSecondOpinions}</strong><span>Escalations</span></div>
      </div>
      {history.repeatedRuleTags.length > 0 ? (
        <p className="muted">Repeated matches: {history.repeatedRuleTags.join(", ")}</p>
      ) : null}
      <p className="muted">{lastAction}</p>
    </section>
  );
}
