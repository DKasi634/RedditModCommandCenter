import type { UserHistory } from "../../shared/domain";
import { panel, muted } from "../lib/ui";
import { Icon } from "./icon";

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
    <section className={panel}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--cc-text)]"><Icon name="history" /> User history</h2>
      <div className="mb-3 grid grid-cols-4 gap-2.5 max-[720px]:grid-cols-2">
        <div className="rounded-md bg-[var(--cc-subtle)] p-3"><strong className="block text-xl">{history.previousWarnings}</strong><span className={muted}>Warnings</span></div>
        <div className="rounded-md bg-[var(--cc-subtle)] p-3"><strong className="block text-xl">{history.previousApprovals ?? 0}</strong><span className={muted}>Approvals</span></div>
        <div className="rounded-md bg-[var(--cc-subtle)] p-3"><strong className="block text-xl">{history.previousRemovals}</strong><span className={muted}>Removals</span></div>
        <div className="rounded-md bg-[var(--cc-subtle)] p-3"><strong className="block text-xl">{history.previousSecondOpinions}</strong><span className={muted}>Escalations</span></div>
      </div>
      {history.repeatedRuleTags.length > 0 ? (
        <p className={muted}>Repeated matches: {history.repeatedRuleTags.join(", ")}</p>
      ) : null}
      <p className={muted}>{lastAction}</p>
    </section>
  );
}
