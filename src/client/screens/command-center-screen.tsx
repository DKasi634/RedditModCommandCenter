import { useMemo, useState } from "react";
import { classifyItem } from "../api/classification-api";
import { recordDecision } from "../api/decision-api";
import { updateStatus } from "../api/queue-api";
import { AiSignalPanel } from "../components/ai-signal-panel";
import { DecisionPanel } from "../components/decision-panel";
import { QueueList } from "../components/queue-list";
import { UserHistoryPanel } from "../components/user-history-panel";
import { useQueueItems } from "../hooks/use-queue-items";
import type { ModeratorDecision, WorkflowStatus } from "../../shared/domain";

export function CommandCenterScreen() {
  const { data, error, isLoading, refresh } = useQueueItems();
  const [selectedThingId, setSelectedThingId] = useState<string | undefined>();
  const [showResolved, setShowResolved] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const isBusy = isLoading || isActionRunning;
  const activeItems = useMemo(
    () => data?.items.filter((item) => item.status !== "resolved") ?? [],
    [data?.items],
  );
  const resolvedCount = (data?.items.length ?? 0) - activeItems.length;
  const visibleItems = showResolved ? (data?.items ?? []) : activeItems;

  const selected = useMemo(() => {
    if (!visibleItems.length) return undefined;
    return visibleItems.find((item) => item.thingId === selectedThingId) ?? visibleItems[0];
  }, [selectedThingId, visibleItems]);

  async function withRefresh(action: () => Promise<unknown>) {
    setIsActionRunning(true);
    setActionError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsActionRunning(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI-assisted moderation, human-controlled decisions</p>
          <h1>Mod Queue Command Center</h1>
        </div>
        <div className="summary-strip">
          <span>{activeItems.length} active</span>
          <span>{resolvedCount} resolved</span>
          <span>{data?.items.filter((item) => item.status === "needs_second_opinion").length ?? 0} escalated</span>
          <span>AI {data?.settings.aiEnabled ? "enabled" : "disabled"}</span>
        </div>
      </header>

      {error || actionError ? <p className="error">{error ?? actionError}</p> : null}
      {isLoading ? <p className="loading">Loading queue workspace...</p> : null}

      {data && !isLoading && !selected ? (
        <section className="empty-state">
          <div>
            <p className="eyebrow">Live queue ready</p>
            <h2>{showResolved ? "No queue items right now" : "No active queue items right now"}</h2>
            <p className="muted">
              {resolvedCount > 0 && !showResolved
                ? "Resolved items are hidden from the active queue."
                : "Report or filter a test post/comment in this subreddit, then refresh this workspace."}
            </p>
          </div>
          <div className="button-row">
            {resolvedCount > 0 ? (
              <button className="secondary" disabled={isBusy} onClick={() => setShowResolved((value) => !value)}>
                {showResolved ? "Hide resolved" : "Show resolved"}
              </button>
            ) : null}
            <button disabled={isBusy} onClick={() => void refresh()}>Refresh queue</button>
          </div>
        </section>
      ) : null}

      {data && selected ? (
        <div className="workspace">
          <QueueList
            items={visibleItems}
            selectedThingId={selected.thingId}
            onSelect={setSelectedThingId}
            isDisabled={isBusy}
            showResolved={showResolved}
            resolvedCount={resolvedCount}
            onToggleResolved={() => setShowResolved((value) => !value)}
          />
          <section className="detail">
            <article className="item-detail">
              <p className="eyebrow">{selected.itemType} by u/{selected.authorUsername}</p>
              <h2>{selected.title ?? "Queue item"}</h2>
              <p>{selected.body}</p>
              <div className="report-row">
                {selected.reportReasons.map((reason) => <span key={reason}>{reason}</span>)}
              </div>
            </article>
            <div className="panel-grid">
              <AiSignalPanel classification={selected.classification} />
              <UserHistoryPanel history={selected.userHistory} />
              <DecisionPanel
                item={selected}
                isDisabled={isBusy}
                onClassify={() => withRefresh(() => classifyItem(selected.thingId))}
                onStatusChange={(status: WorkflowStatus) => withRefresh(() => updateStatus({ thingId: selected.thingId, status }))}
                onDecision={(decision: Omit<ModeratorDecision, "decidedAt" | "moderatorUsername">) =>
                  withRefresh(() => recordDecision({ decision }))
                }
              />
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
