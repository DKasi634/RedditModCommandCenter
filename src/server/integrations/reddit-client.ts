import { context, reddit } from "@devvit/web/server";
import { DEFAULT_RULES } from "../../shared/defaults";
import type { QueueItem, SubredditRule } from "../../shared/domain";

const QUEUE_LIMIT = 25;

type QueueSource = "modqueue" | "reports" | "spam";

type RedditReportableThing = {
  id: string;
  subredditName: string;
  body?: string;
  authorName?: string;
  userReportReasons: string[];
  modReportReasons: string[];
  permalink: string;
  createdAt: Date;
};

type RedditModeratableThing = RedditReportableThing & {
  approve: () => Promise<void>;
  remove: (isSpam?: boolean) => Promise<void>;
};

type RedditQueuePost = RedditReportableThing & {
  title: string;
};

type RedditQueueComment = RedditReportableThing;

type RedditQueueThing = RedditQueuePost | RedditQueueComment;

type RedditModeratableQueueThing = RedditQueueThing & RedditModeratableThing;

type RedditRuleLike = {
  priority: number;
  shortName: string;
  description?: string;
  violationReason?: string;
};

export type QueueSourceSnapshot = {
  source: QueueSource;
  count: number;
  items: QueueItem[];
  failed: boolean;
  errorMessage?: string;
};

function getCurrentSubredditName() {
  if (!context.subredditName) {
    throw new Error("No subreddit context is available for this Devvit request");
  }

  return context.subredditName;
}

function reportReasonsForThing(thing: RedditQueueThing) {
  return Array.from(
    new Set([...(thing.userReportReasons ?? []), ...(thing.modReportReasons ?? [])]),
  ).filter(Boolean);
}

function isPost(thing: RedditQueueThing): thing is RedditQueuePost {
  return "title" in thing;
}

function mapQueueThing(thing: RedditQueueThing): QueueItem {
  if (isPost(thing)) {
    return {
      thingId: thing.id,
      itemType: "post",
      subredditName: thing.subredditName,
      title: thing.title,
      body: thing.body,
      authorUsername: thing.authorName,
      reportReasons: reportReasonsForThing(thing),
      permalink: thing.permalink,
      createdAt: thing.createdAt.toISOString(),
    };
  }

  return {
    thingId: thing.id,
    itemType: "comment",
    subredditName: thing.subredditName,
    body: thing.body,
    authorUsername: thing.authorName,
    reportReasons: reportReasonsForThing(thing),
    permalink: thing.permalink,
    createdAt: thing.createdAt.toISOString(),
  };
}

function mapSubredditRule(rule: RedditRuleLike): SubredditRule {
  return {
    id: `rule_${rule.priority + 1}`,
    title: rule.shortName,
    description: rule.description || rule.violationReason,
    severity: "medium",
  };
}

async function fetchQueueSource(source: QueueSource, subredditName: string): Promise<QueueSourceSnapshot> {
  try {
    const options = {
      subreddit: subredditName,
      type: "all" as const,
      limit: QUEUE_LIMIT,
    };

    const listing =
      source === "modqueue"
        ? reddit.getModQueue(options)
        : source === "reports"
          ? reddit.getReports(options)
          : reddit.getSpam(options);

    const things = await listing.get(QUEUE_LIMIT);
    const items = things.map((thing) => mapQueueThing(thing as RedditQueueThing));

    return {
      source,
      count: items.length,
      items,
      failed: false,
    };
  } catch (error) {
    console.warn(`[reddit-client] Failed to fetch ${source}`, error);

    return {
      source,
      count: 0,
      items: [],
      failed: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function mergeQueueSnapshots(snapshots: QueueSourceSnapshot[]) {
  const itemsById = new Map<string, QueueItem>();

  for (const snapshot of snapshots) {
    for (const item of snapshot.items) {
      const existing = itemsById.get(item.thingId);
      itemsById.set(item.thingId, {
        ...item,
        reportReasons: Array.from(
          new Set([
            ...(existing?.reportReasons ?? []),
            ...item.reportReasons,
            snapshot.source === "spam" ? "spam" : "",
          ]),
        ).filter(Boolean),
      });
    }
  }

  return Array.from(itemsById.values());
}

async function findModeratableThing(thingId: string): Promise<RedditModeratableQueueThing | undefined> {
  const subredditName = getCurrentSubredditName();
  const snapshots = await Promise.all(
    (["modqueue", "reports", "spam"] as QueueSource[]).map(async (source) => {
      const options = {
        subreddit: subredditName,
        type: "all" as const,
        limit: QUEUE_LIMIT,
      };

      const listing =
        source === "modqueue"
          ? reddit.getModQueue(options)
          : source === "reports"
            ? reddit.getReports(options)
            : reddit.getSpam(options);

      return listing.get(QUEUE_LIMIT);
    }),
  );

  return snapshots.flat().find((thing) => (thing as RedditQueueThing).id === thingId) as
    | RedditModeratableQueueThing
    | undefined;
}

export async function fetchModerationQueueSources(): Promise<QueueSourceSnapshot[]> {
  const subredditName = getCurrentSubredditName();

  return Promise.all([
    fetchQueueSource("modqueue", subredditName),
    fetchQueueSource("reports", subredditName),
    fetchQueueSource("spam", subredditName),
  ]);
}

export async function applyRedditModerationDecision(
  thingId: string,
  action: "approved" | "removed",
) {
  const thing = await findModeratableThing(thingId);

  if (!thing) {
    throw new Error(`Queue item ${thingId} was not found in modqueue, reports, or spam`);
  }

  if (action === "approved") {
    await thing.approve();
    return;
  }

  await thing.remove(true);
}

export async function fetchModerationQueue(): Promise<QueueItem[]> {
  if (process.env.DEVVIT_USE_DEMO_QUEUE === "true") {
    return fetchDemoModerationQueue();
  }

  try {
    const snapshots = await fetchModerationQueueSources();

    if (snapshots.every((snapshot) => snapshot.failed)) {
      throw new Error("All Reddit queue sources failed");
    }

    return mergeQueueSnapshots(snapshots);
  } catch (error) {
    console.warn("[reddit-client] Falling back to demo queue data", error);
    return fetchDemoModerationQueue();
  }
}

export async function fetchSubredditRules(subredditName?: string): Promise<SubredditRule[]> {
  try {
    const rules = await reddit.getRules(subredditName ?? getCurrentSubredditName());
    const mappedRules = rules.map((rule) => mapSubredditRule(rule as RedditRuleLike));

    return mappedRules.length > 0 ? mappedRules : DEFAULT_RULES;
  } catch (error) {
    console.warn("[reddit-client] Falling back to default rule set", error);
    return DEFAULT_RULES;
  }
}

function fetchDemoModerationQueue(): QueueItem[] {
  return [
    {
      thingId: "t3_demo_high",
      itemType: "post",
      subredditName: "demo-community",
      title: "This user keeps targeting people in every thread",
      body: "Reported post with hostile language and repeated callouts.",
      authorUsername: "heated_user",
      reportReasons: ["harassment", "uncivil"],
      permalink: "/r/demo-community/comments/demo_high",
      createdAt: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    },
    {
      thingId: "t1_demo_spam",
      itemType: "comment",
      subredditName: "demo-community",
      body: "Check my profile for the full guide and discount link.",
      authorUsername: "promo_account",
      reportReasons: ["spam"],
      permalink: "/r/demo-community/comments/demo_spam/_/demo",
      createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    },
    {
      thingId: "t1_demo_gray",
      itemType: "comment",
      subredditName: "demo-community",
      body: "This is probably sarcasm, but it reads close to a personal attack.",
      authorUsername: "regular_member",
      reportReasons: ["rule 1"],
      permalink: "/r/demo-community/comments/demo_gray/_/demo",
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
  ];
}
