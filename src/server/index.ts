import { Hono } from "hono";
import { getRequestListener } from "@hono/node-server";
import {
  context,
  createServer,
  getServerPort,
  reddit,
} from "@devvit/web/server";
import { redis } from "@devvit/redis";

import { classificationRoutes } from "./routes/classification-routes";
import { decisionRoutes } from "./routes/decision-routes";
import { queueRoutes } from "./routes/queue-routes";
import { settingsRoutes } from "./routes/settings-routes";
import {
  fetchModerationQueue,
  fetchModerationQueueSources,
  fetchSubredditRules,
} from "./integrations/reddit-client";
import { testGeminiProvider } from "./integrations/ai-backend-client";

const app = new Hono();

async function createCommandCenterPost() {
  if (!context.subredditName) {
    throw new Error("No subreddit context is available for this menu action");
  }

  const post = await reddit.submitCustomPost({
    subredditName: context.subredditName,
    title: "Mod Queue Command Center",
    entry: "default",
    textFallback: {
      text: "Open the Mod Queue Command Center.",
    },
  });

  // Keep the command center reachable to moderators from the returned URL while
  // avoiding a public launch card in the subreddit feed.
  await post.remove(false);

  return post.url;
}

app.post("/internal/menu/open-command-center", async (c) => {
  try {
    const postUrl = await createCommandCenterPost();

    return c.json({
      navigateTo: postUrl,
    });
  } catch (err) {
    console.error("Failed to create command center post", {
      err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      subredditName: context.subredditName,
    });

    return c.json({
      showToast: {
        text: "Failed to open Command Center. Check logs.",
        appearance: "neutral",
      },
    });
  }
});

app.post("/internal/menu/diagnostics/reddit-read", async (c) => {
  try {
    const subredditName = context.subredditName || "modqueuecc_dev";

    console.log("[diagnostics:reddit-read] Testing Reddit read access", {
      contextSubredditName: context.subredditName,
      requestedSubredditName: subredditName,
    });

    const subreddit = await reddit.getSubredditInfoByName(subredditName);

    console.log("[diagnostics:reddit-read] Read subreddit successfully", {
      name: subreddit.name,
      id: subreddit.id,
      title: subreddit.title,
    });

    return c.json({
      showToast: {
        text: `MCC Reddit read OK: r/${subreddit.name}`,
        appearance: "success",
      },
    });
  } catch (err) {
    console.error("[diagnostics:reddit-read] Failed", {
      err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      contextSubredditName: context.subredditName,
    });

    return c.json({
      showToast: {
        text: "MCC Reddit read failed. Check logs.",
        appearance: "neutral",
      },
    });
  }
});

app.post("/internal/menu/diagnostics/redis", async (c) => {
  try {
    const key = "migration:diagnostics:redis";
    await redis.set(key, new Date().toISOString());
    const value = await redis.get(key);

    console.log("[diagnostics:redis] Redis read/write result", { key, value });

    return c.json({
      showToast: {
        text: `MCC Redis OK: ${value ? "write/read" : "empty read"}`,
        appearance: "success",
      },
    });
  } catch (err) {
    console.error("[diagnostics:redis] Failed", {
      err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    return c.json({
      showToast: {
        text: "MCC Redis failed. Check logs.",
        appearance: "neutral",
      },
    });
  }
});

app.post("/internal/menu/diagnostics/rules", async (c) => {
  try {
    const rules = await fetchSubredditRules();

    console.log("[diagnostics:rules] Rules result", {
      count: rules.length,
      firstRule: rules[0],
      contextSubredditName: context.subredditName,
    });

    return c.json({
      showToast: {
        text: `MCC rules OK: ${rules.length}`,
        appearance: "success",
      },
    });
  } catch (err) {
    console.error("[diagnostics:rules] Failed", {
      err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      contextSubredditName: context.subredditName,
    });

    return c.json({
      showToast: {
        text: "MCC rules failed. Check logs.",
        appearance: "neutral",
      },
    });
  }
});

app.post("/internal/menu/diagnostics/queue", async (c) => {
  try {
    const [snapshots, items] = await Promise.all([
      fetchModerationQueueSources(),
      fetchModerationQueue(),
    ]);
    const demoItems = items.filter((item) => item.thingId.includes("_demo_"));
    const sourceSummary = snapshots
      .map((snapshot) => `${snapshot.source}:${snapshot.failed ? "failed" : snapshot.count}`)
      .join(" ");

    console.log("[diagnostics:queue] Queue result", {
      count: items.length,
      demoCount: demoItems.length,
      sources: snapshots.map((snapshot) => ({
        source: snapshot.source,
        count: snapshot.count,
        failed: snapshot.failed,
        errorMessage: snapshot.errorMessage,
      })),
      firstItem: items[0],
      contextSubredditName: context.subredditName,
    });

    return c.json({
      showToast: {
        text:
          demoItems.length > 0
            ? `MCC queue fallback/demo: ${items.length}`
            : `MCC queue OK: ${items.length} (${sourceSummary})`,
        appearance: "success",
      },
    });
  } catch (err) {
    console.error("[diagnostics:queue] Failed", {
      err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      contextSubredditName: context.subredditName,
    });

    return c.json({
      showToast: {
        text: "MCC queue failed. Check logs.",
        appearance: "neutral",
      },
    });
  }
});

app.post("/internal/menu/diagnostics/gemini", async (c) => {
  try {
    const result = await testGeminiProvider();

    console.log("[diagnostics:gemini] Gemini result", {
      provider: result.modelProvider,
      model: result.modelVersion,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
    });

    return c.json({
      showToast: {
        text: `MCC Gemini OK: ${result.modelVersion}`,
        appearance: "success",
      },
    });
  } catch (err) {
    console.error("[diagnostics:gemini] Failed", {
      err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    return c.json({
      showToast: {
        text: "MCC Gemini failed. Check API key/settings/logs.",
        appearance: "neutral",
      },
    });
  }
});

app.route("/api", queueRoutes);
app.route("/api", classificationRoutes);
app.route("/api", decisionRoutes);
app.route("/api", settingsRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || "Unexpected server error" }, 500);
});

export default app;

createServer(getRequestListener(app.fetch)).listen(getServerPort());
