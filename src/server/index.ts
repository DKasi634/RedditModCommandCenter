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

function svgDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const commandCenterIconUri = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="58" fill="#ff4500"/>
  <path d="M72 78h112v26H72zM72 118h112v26H72zM72 158h70v26H72z" fill="#fff"/>
  <path d="M174 159l14 14 30-36" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);

const commandCenterBackgroundUri = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 1024">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="70%">
      <stop offset="0" stop-color="#1f3442"/>
      <stop offset=".58" stop-color="#0f1820"/>
      <stop offset="1" stop-color="#090f14"/>
    </radialGradient>
  </defs>
  <rect width="2048" height="1024" fill="url(#g)"/>
  <g opacity=".17" fill="#dbe7ee">
    <rect x="145" y="118" width="385" height="94" rx="47"/>
    <rect x="590" y="118" width="250" height="94" rx="28"/>
    <rect x="920" y="118" width="500" height="94" rx="47"/>
    <rect x="1500" y="118" width="270" height="94" rx="47"/>
    <rect x="180" y="276" width="310" height="260" rx="48"/>
    <rect x="560" y="276" width="380" height="260" rx="48"/>
    <rect x="1010" y="276" width="310" height="260" rx="48"/>
    <rect x="1390" y="276" width="380" height="260" rx="48"/>
    <rect x="145" y="614" width="460" height="96" rx="48"/>
    <rect x="685" y="614" width="685" height="96" rx="48"/>
    <rect x="1450" y="614" width="330" height="96" rx="48"/>
  </g>
  <g transform="translate(604 316)">
    <rect width="840" height="280" rx="38" fill="#111c24" stroke="#314352" stroke-width="2"/>
    <rect x="44" y="42" width="224" height="32" rx="16" fill="#ff4500"/>
    <rect x="44" y="100" width="752" height="34" rx="17" fill="#dbe7ee" opacity=".72"/>
    <rect x="44" y="162" width="330" height="74" rx="18" fill="#22313c"/>
    <rect x="402" y="162" width="394" height="74" rx="18" fill="#22313c"/>
    <circle cx="750" cy="67" r="18" fill="#86efac"/>
  </g>
  <path d="M0 0h2048v8H0z" fill="#ff4500" opacity=".85"/>
</svg>`);

async function createCommandCenterPost() {
  if (!context.subredditName) {
    throw new Error("No subreddit context is available for this menu action");
  }

  const post = await reddit.submitCustomPost({
    subredditName: context.subredditName,
    title: "Command Center",
    entry: "default",
    splash: {
      appDisplayName: "Command Center",
      appIconUri: commandCenterIconUri,
      backgroundUri: commandCenterBackgroundUri,
      heading: "Mod Queue Command Center",
      description: "Prioritize queue items, review context, and record moderator decisions from one workspace.",
      buttonLabel: "Open Command Center",
    },
    styles: {
      backgroundColor: "#F7F9FAFF",
      backgroundColorDark: "#101820FF",
      heightPixels: 512,
    },
    textFallback: {
      text: "Open the Mod Queue Command Center moderator workspace.",
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
