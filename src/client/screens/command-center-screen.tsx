import { useEffect, useMemo, useState } from "react";
import { classifyItem } from "../api/classification-api";
import { recordDecision } from "../api/decision-api";
import { updateStatus } from "../api/queue-api";
import { saveSubredditSettings } from "../api/settings-api";
import { AiSignalPanel } from "../components/ai-signal-panel";
import { DecisionPanel } from "../components/decision-panel";
import { DecisionHistoryPanel } from "../components/decision-history-panel";
import { Icon } from "../components/icon";
import { type QueueFilterMode, QueueList } from "../components/queue-list";
import { SettingsPanel } from "../components/settings-panel";
import { UserHistoryPanel } from "../components/user-history-panel";
import { useQueueItems } from "../hooks/use-queue-items";
import { cn } from "../lib/cn";
import { buttonCompact, buttonPrimary, buttonSecondary, eyebrow, muted, panel } from "../lib/ui";
import type { QueueSortMode } from "../utils/sort-queue-items";
import type { ModeratorDecision, SecondOpinionReason, SubredditSettings, WorkflowStatus } from "../../shared/domain";

const secondOpinionReasonLabels: Record<SecondOpinionReason, string> = {
  senior_mod_review: "Needs another moderator",
  rule_ambiguity: "Rule ambiguity",
  policy_question: "Possible policy issue",
  context_unclear: "Context unclear",
  other: "Other",
};

const emptyFilterCopy: Record<QueueFilterMode, { title: string; description: string }> = {
  active: {
    title: "No active queue items right now",
    description: "Report or filter a test post/comment in this subreddit, then refresh this workspace.",
  },
  all: {
    title: "No queue items right now",
    description: "Report or filter a test post/comment in this subreddit, then refresh this workspace.",
  },
  resolved: {
    title: "No resolved items yet",
    description: "Archived and removed items will appear here after the mod team takes action.",
  },
  second_opinion: {
    title: "No second-opinion requests",
    description: "Items sent for another moderator's review will appear here.",
  },
  requested_by_me: {
    title: "No requests from you",
    description: "Second-opinion requests you create will appear here until another moderator resolves them.",
  },
  resolved_second_opinions: {
    title: "No resolved second opinions",
    description: "Second-opinion requests appear here after another moderator closes them.",
  },
  high_risk: {
    title: "No high-risk items",
    description: "Items with stronger review signals will appear here after guided review runs.",
  },
};

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const elapsedSeconds = Number.isFinite(timestamp)
    ? Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
    : 0;

  if (elapsedSeconds < 60) return "just now";

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  return `${Math.floor(elapsedHours / 24)}d ago`;
}

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

    if (filterMode === "second_opinion") {
      return items.filter((item) => item.status === "needs_second_opinion");
    }

    if (filterMode === "requested_by_me") {
      const currentModerator = data?.moderator.currentModeratorUsername.toLowerCase();
      return items.filter(
        (item) =>
          item.secondOpinion?.status === "open" &&
          item.secondOpinion.escalatedBy.toLowerCase() === currentModerator,
      );
    }

    if (filterMode === "resolved_second_opinions") {
      return items.filter((item) => item.secondOpinion?.status === "resolved");
    }

    if (filterMode === "high_risk") {
      return items.filter((item) => item.classification?.riskLevel === "high" && item.status !== "resolved");
    }

    return resolvedVisible ? items : activeItems;
  }, [activeItems, data?.items, data?.moderator.currentModeratorUsername, filterMode, resolvedVisible]);

  const selected = useMemo(() => {
    if (!visibleItems.length) return undefined;
    return visibleItems.find((item) => item.thingId === selectedThingId) ?? visibleItems[0];
  }, [selectedThingId, visibleItems]);
  const emptyCopy = emptyFilterCopy[filterMode];

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

  if (error === "Moderator access is required.") {
    return <main className="min-h-0 p-0" aria-hidden="true" />;
  }

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-[1420px] px-4 py-3.5 text-[#1c1c1c]">
        <QueueWorkspaceSkeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1420px] px-4 py-3.5 text-[#1c1c1c]">
      <header className="flex items-center justify-between gap-4 rounded-md border border-[#e5ebee] bg-white px-5 py-4 max-[860px]:block">
        <div>
          <p className={eyebrow}>Moderator workspace</p>
          <h1 className="mb-0 text-[25px] font-bold leading-tight tracking-normal">Mod Queue Command Center</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 max-[860px]:mt-3 max-[860px]:justify-start">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-8 items-center rounded-full border border-[#e5ebee] bg-white px-2.5 py-1 text-sm font-semibold">{activeItems.length} active</span>
            <span className="inline-flex min-h-8 items-center rounded-full border border-[#e5ebee] bg-white px-2.5 py-1 text-sm font-semibold">{resolvedCount} resolved</span>
            <span className="inline-flex min-h-8 items-center rounded-full border border-[#e5ebee] bg-white px-2.5 py-1 text-sm font-semibold">{data?.items.filter((item) => item.status === "needs_second_opinion").length ?? 0} second opinion</span>
            <span className="inline-flex min-h-8 items-center rounded-full border border-[#e5ebee] bg-white px-2.5 py-1 text-sm font-semibold">Signals {data?.settings.aiEnabled ? "enabled" : "disabled"}</span>
          </div>
          <button className={`${buttonSecondary} ${buttonCompact} min-h-8`} disabled={isBusy} onClick={() => void refresh()}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
        </div>
      </header>

      {error ? (
        <section className="mt-3 flex items-center justify-between gap-4 rounded-md border border-[#e5ebee] bg-white p-6">
          <div>
            <p className={eyebrow}>Workspace unavailable</p>
            <h2 className="mb-3 text-lg font-bold">Unable to load workspace</h2>
            <p className={muted}>{error}</p>
          </div>
        </section>
      ) : null}
      {actionError ? <p className="mt-3 rounded-md border border-[#fecdca] bg-[#fee4e2] px-4 py-3 text-sm font-semibold text-[#b42318]">{actionError}</p> : null}

      {data && !isLoading && !selected ? (
        <section className="mt-3 flex items-center justify-between gap-4 rounded-md border border-[#e5ebee] bg-white p-6 max-[720px]:block">
          <div>
            <p className={eyebrow}>Live queue ready</p>
            <h2 className="mb-3 text-lg font-bold">{emptyCopy.title}</h2>
            <p className={muted}>
              {resolvedCount > 0 && !resolvedVisible
                ? "Resolved items are hidden from the active queue."
                : emptyCopy.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 max-[720px]:mt-4">
            {resolvedCount > 0 ? (
              <button
                className={buttonSecondary}
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
            <button className={buttonPrimary} disabled={isBusy} onClick={() => void refresh()}>Refresh queue</button>
          </div>
        </section>
      ) : null}

      {data && selected ? (
        <div className="mt-3 grid grid-cols-[minmax(320px,360px)_1fr] overflow-hidden rounded-md border border-[#e5ebee] bg-white max-[860px]:block">
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
          <section className="bg-[#f7f9fa] p-5">
            <article className={panel}>
              <p className={eyebrow}>{selected.itemType} by u/{selected.authorUsername}</p>
              <h2 className="mb-3 text-xl font-bold leading-snug text-[#1c1c1c]">{selected.title ?? "Queue item"}</h2>
              <p className="mb-4 leading-relaxed">{selected.body}</p>
              <div className="flex flex-wrap gap-2">
                {selected.reportReasons.map((reason) => (
                  <span className="inline-flex min-h-8 items-center rounded-full border border-[#e5ebee] bg-white px-2.5 py-1 text-sm font-semibold" key={reason}>{reason}</span>
                ))}
              </div>
              {selected.secondOpinion ? (
                <div className="mt-4 rounded-md border border-[#fed8c7] bg-[#fff7ed] px-4 py-3 text-sm text-[#4b5563]">
                  <strong>
                    {selected.secondOpinion.status === "open" ? "Second opinion requested" : "Second opinion resolved"}
                  </strong>
                  <span className="mt-1 block">{secondOpinionReasonLabels[selected.secondOpinion.reason]}</span>
                  <span className="mt-1 block">
                    Requested by u/{selected.secondOpinion.escalatedBy} {relativeTime(selected.secondOpinion.escalatedAt)}
                  </span>
                  {selected.secondOpinion.resolvedBy ? (
                    <span className="mt-1 block">
                      Resolved by u/{selected.secondOpinion.resolvedBy}
                      {selected.secondOpinion.resolvedAt ? ` ${relativeTime(selected.secondOpinion.resolvedAt)}` : ""}
                    </span>
                  ) : (
                    <span className="mt-1 block">Waiting for another moderator to review this item.</span>
                  )}
                  {selected.secondOpinion.note ? <p>{selected.secondOpinion.note}</p> : null}
                </div>
              ) : null}
            </article>
            <div className="mt-3 grid grid-cols-2 gap-3 max-[1120px]:grid-cols-1">
              <AiSignalPanel
                classification={selected.classification}
                state={analyzingThingId === selected.thingId ? "analyzing" : selected.classificationState}
                showSummaryByDefault={data.settings.showAiSummaryByDefault}
              />
              <UserHistoryPanel history={selected.userHistory} />
              <DecisionHistoryPanel decision={selected.latestDecision} />
              <section className="col-span-2 rounded-md bg-transparent p-0 max-[1120px]:col-span-1">
                <div className="flex gap-6 border-b border-[#e5ebee]" role="tablist" aria-label="Moderator workspace">
                  <button
                    role="tab"
                    type="button"
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 border-0 border-b-[3px] border-transparent bg-transparent px-0 text-sm font-bold text-[#576f76] transition",
                      operationsTab === "controls" && "border-[#ff4500] text-[#1c1c1c]",
                    )}
                    aria-selected={operationsTab === "controls"}
                    onClick={() => setOperationsTab("controls")}
                  >
                    <Icon name="shield" size={16} /> Moderator controls
                  </button>
                  <button
                    role="tab"
                    type="button"
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 border-0 border-b-[3px] border-transparent bg-transparent px-0 text-sm font-bold text-[#576f76] transition",
                      operationsTab === "settings" && "border-[#ff4500] text-[#1c1c1c]",
                    )}
                    aria-selected={operationsTab === "settings"}
                    onClick={() => setOperationsTab("settings")}
                  >
                    <Icon name="settings" size={16} /> Moderator settings
                  </button>
                </div>
                <div className="pt-5">
                {operationsTab === "controls" ? (
                  <DecisionPanel
                    item={selected}
                    isDisabled={isBusy}
                    isAnalyzing={analyzingThingId === selected.thingId}
                    aiEnabled={data.settings.aiEnabled}
                    canEscalate={data.moderator.canEscalate}
                    currentModeratorUsername={data.moderator.currentModeratorUsername}
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
                </div>
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
    <div className="mt-3 grid animate-pulse grid-cols-[minmax(320px,360px)_1fr] overflow-hidden rounded-md border border-[#e5ebee] bg-white max-[860px]:block" aria-label="Loading queue workspace" aria-busy="true">
      <aside className="border-r border-[#e5ebee] bg-white">
        <div className="flex min-h-[58px] items-center justify-between gap-2 border-b border-[#e5ebee] px-4 py-3">
          <span className="h-3 w-24 rounded-full bg-[#edf1f5]" />
          <span className="h-8 w-24 rounded-full bg-[#edf1f5]" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 border-b border-[#e5ebee] px-4 py-3">
          <div className="h-10 rounded-2xl bg-[#edf1f5]" />
          <div className="h-10 rounded-2xl bg-[#edf1f5]" />
        </div>
        {[0, 1, 2].map((item) => (
          <div className="min-h-[120px] border-b border-[#e5ebee] px-4 py-3.5" key={item}>
            <span className="mb-4 block h-3 w-14 rounded-full bg-[#edf1f5]" />
            <span className="mb-3 block h-4 w-48 rounded-full bg-[#edf1f5]" />
            <span className="mb-3 block h-3 w-32 rounded-full bg-[#edf1f5]" />
            <span className="block h-7 w-20 rounded-full bg-[#edf1f5]" />
          </div>
        ))}
      </aside>
      <section className="bg-[#f7f9fa] p-5">
        <article className={panel}>
          <span className="mb-4 block h-3 w-36 rounded-full bg-[#edf1f5]" />
          <span className="mb-4 block h-6 w-2/3 rounded-full bg-[#edf1f5]" />
          <span className="mb-4 block h-4 w-full rounded-full bg-[#edf1f5]" />
          <span className="block h-8 w-20 rounded-full bg-[#edf1f5]" />
        </article>
        <div className="mt-3 grid grid-cols-2 gap-3 max-[1120px]:grid-cols-1">
          <section className={panel}>
            <span className="mb-5 block h-5 w-36 rounded-full bg-[#edf1f5]" />
            <div className="mb-5 grid grid-cols-3 gap-2.5">
              <span className="h-20 rounded-md bg-[#edf1f5]" />
              <span className="h-20 rounded-md bg-[#edf1f5]" />
              <span className="h-20 rounded-md bg-[#edf1f5]" />
            </div>
            <span className="mb-3 block h-4 w-full rounded-full bg-[#edf1f5]" />
            <span className="block h-4 w-1/2 rounded-full bg-[#edf1f5]" />
          </section>
          <section className={panel}>
            <span className="mb-5 block h-5 w-36 rounded-full bg-[#edf1f5]" />
            <div className="mb-5 grid grid-cols-3 gap-2.5">
              <span className="h-20 rounded-md bg-[#edf1f5]" />
              <span className="h-20 rounded-md bg-[#edf1f5]" />
              <span className="h-20 rounded-md bg-[#edf1f5]" />
            </div>
            <span className="block h-4 w-1/2 rounded-full bg-[#edf1f5]" />
          </section>
        </div>
      </section>
    </div>
  );
}
