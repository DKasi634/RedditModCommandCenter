import { useEffect, useMemo, useState } from "react";
import { Settings, ShieldAlert } from "lucide-react";
import { classifyItem } from "../api/classification-api";
import { recordDecision } from "../api/decision-api";
import { updateStatus } from "../api/queue-api";
import { saveSubredditSettings } from "../api/settings-api";
import { AiSignalPanel } from "../components/ai-signal-panel";
import { DecisionPanel } from "../components/decision-panel";
import { type QueueFilterMode, QueueList } from "../components/queue-list";
import { SettingsPanel } from "../components/settings-panel";
import { UserHistoryPanel } from "../components/user-history-panel";
import { useQueueItems } from "../hooks/use-queue-items";
import type { QueueSortMode } from "../utils/sort-queue-items";
import type { ModeratorDecision, SubredditSettings, WorkflowStatus } from "../../shared/domain";

export function CommandCenterScreen() {
  const { data, error, isLoading, refresh } = useQueueItems();
  const [selectedThingId, setSelectedThingId] = useState<string | undefined>();
  const [showResolved, setShowResolved] = useState<boolean | undefined>();
  const [filterMode, setFilterMode] = useState<QueueFilterMode>("active");
  const [sortMode, setSortMode] = useState<QueueSortMode>("priority");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [analyzingThingId, setAnalyzingThingId] = useState<string | null>(null);
  const [operationsTab, setOperationsTab] = useState<"controls" | "settings">("controls");
  const isBusy = isLoading || isActionRunning;
  const resolvedVisible = showResolved ?? data?.settings.showResolvedByDefault ?? false;
  const activeItems = useMemo(
    () => data?.items.filter((item) => item.status !== "resolved") ?? [],
    [data?.items],
  );
  const resolvedCount = (data?.items.length ?? 0) - activeItems.length;
  const visibleItems = useMemo(() => {
    const items = data?.items ?? [];

    if (filterMode === "all") {
      return items;
    }

    if (filterMode === "resolved") {
      return items.filter((item) => item.status === "resolved");
    }

    if (filterMode === "escalated") {
      return items.filter((item) => item.status === "needs_second_opinion");
    }

    if (filterMode === "high_risk") {
      return items.filter((item) => item.classification?.riskLevel === "high" && item.status !== "resolved");
    }

    return resolvedVisible ? items : activeItems;
  }, [activeItems, data?.items, filterMode, resolvedVisible]);

  const selected = useMemo(() => {
    if (!visibleItems.length) return undefined;
    return visibleItems.find((item) => item.thingId === selectedThingId) ?? visibleItems[0];
  }, [selectedThingId, visibleItems]);

  useEffect(() => {
    if (showResolved === undefined && data) {
      setShowResolved(data.settings.showResolvedByDefault);
      setFilterMode(data.settings.showResolvedByDefault ? "all" : "active");
    }
  }, [data, showResolved]);

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

  async function analyzeSelected(thingId: string) {
    setAnalyzingThingId(thingId);
    try {
      await withRefresh(() => classifyItem(thingId));
    } finally {
      setAnalyzingThingId(null);
    }
  }

  async function saveSettings(settings: SubredditSettings) {
    await withRefresh(() => saveSubredditSettings(settings));
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

      {error ? (
        <section className="empty-state">
          <div>
            <p className="eyebrow">Workspace unavailable</p>
            <h2>{error === "Moderator access is required." ? "Moderator access required" : "Unable to load workspace"}</h2>
            <p className="muted">{error}</p>
          </div>
        </section>
      ) : null}
      {actionError ? <p className="error">{actionError}</p> : null}
      {isLoading ? <QueueWorkspaceSkeleton /> : null}

      {data && !isLoading && !selected ? (
        <section className="empty-state">
          <div>
            <p className="eyebrow">Live queue ready</p>
            <h2>{resolvedVisible ? "No queue items right now" : "No active queue items right now"}</h2>
            <p className="muted">
              {resolvedCount > 0 && !resolvedVisible
                ? "Resolved items are hidden from the active queue."
                : "Report or filter a test post/comment in this subreddit, then refresh this workspace."}
            </p>
          </div>
          <div className="button-row">
            {resolvedCount > 0 ? (
              <button
                className="secondary"
                disabled={isBusy}
                onClick={() => {
                  const next = !resolvedVisible;
                  setShowResolved(next);
                  setFilterMode(next ? "all" : "active");
                }}
              >
                {resolvedVisible ? "Hide resolved" : "Show resolved"}
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
            showResolved={resolvedVisible}
            resolvedCount={resolvedCount}
            onToggleResolved={() => {
              const next = !resolvedVisible;
              setShowResolved(next);
              setFilterMode(next ? "all" : "active");
            }}
            filterMode={filterMode}
            sortMode={sortMode}
            onFilterModeChange={(mode) => {
              setFilterMode(mode);
              setShowResolved(mode === "all" || mode === "resolved");
            }}
            onSortModeChange={setSortMode}
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
              <AiSignalPanel
                classification={selected.classification}
                state={analyzingThingId === selected.thingId ? "analyzing" : selected.classificationState}
                showSummaryByDefault={data.settings.showAiSummaryByDefault}
              />
              <UserHistoryPanel history={selected.userHistory} />
              <section className="panel operations-panel">
                <div className="tabs" role="tablist" aria-label="Moderator workspace">
                  <button
                    role="tab"
                    type="button"
                    className={operationsTab === "controls" ? "tab active" : "tab"}
                    aria-selected={operationsTab === "controls"}
                    onClick={() => setOperationsTab("controls")}
                  >
                    <ShieldAlert size={16} /> Moderator controls
                  </button>
                  <button
                    role="tab"
                    type="button"
                    className={operationsTab === "settings" ? "tab active" : "tab"}
                    aria-selected={operationsTab === "settings"}
                    onClick={() => setOperationsTab("settings")}
                  >
                    <Settings size={16} /> Moderator settings
                  </button>
                </div>
                {operationsTab === "controls" ? (
                  <DecisionPanel
                    item={selected}
                    isDisabled={isBusy}
                    isAnalyzing={analyzingThingId === selected.thingId}
                    aiEnabled={data.settings.aiEnabled}
                    isEmbedded
                    onClassify={() => analyzeSelected(selected.thingId)}
                    onStatusChange={(status: WorkflowStatus) => withRefresh(() => updateStatus({ thingId: selected.thingId, status }))}
                    onDecision={(decision: Omit<ModeratorDecision, "decidedAt" | "moderatorUsername">) =>
                      withRefresh(() => recordDecision({ decision }))
                    }
                  />
                ) : (
                  <SettingsPanel settings={data.settings} isDisabled={isBusy} isEmbedded onSave={saveSettings} />
                )}
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function QueueWorkspaceSkeleton() {
  return (
    <div className="workspace skeleton-workspace" aria-label="Loading queue workspace" aria-busy="true">
      <aside className="queue-list">
        <div className="queue-list-toolbar">
          <span className="skeleton-line short" />
          <span className="skeleton-pill" />
        </div>
        <div className="queue-controls">
          <div className="skeleton-field" />
          <div className="skeleton-field" />
        </div>
        {[0, 1, 2].map((item) => (
          <div className="queue-card skeleton-card" key={item}>
            <span className="skeleton-line tiny" />
            <span className="skeleton-line medium" />
            <span className="skeleton-line short" />
            <span className="skeleton-pill" />
          </div>
        ))}
      </aside>
      <section className="detail">
        <article className="item-detail skeleton-detail">
          <span className="skeleton-line short" />
          <span className="skeleton-line title" />
          <span className="skeleton-line wide" />
          <span className="skeleton-pill" />
        </article>
        <div className="panel-grid">
          <section className="panel skeleton-panel">
            <span className="skeleton-line medium" />
            <div className="skeleton-metric-row">
              <span />
              <span />
              <span />
            </div>
            <span className="skeleton-line wide" />
            <span className="skeleton-line medium" />
          </section>
          <section className="panel skeleton-panel">
            <span className="skeleton-line medium" />
            <div className="skeleton-metric-row">
              <span />
              <span />
              <span />
            </div>
            <span className="skeleton-line short" />
          </section>
        </div>
      </section>
    </div>
  );
}
