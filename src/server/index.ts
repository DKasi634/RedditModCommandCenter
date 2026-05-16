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
  <defs>
    <linearGradient id="icon-bg" x1="34" y1="22" x2="222" y2="232" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ff7a33"/>
      <stop offset=".55" stop-color="#ff4500"/>
      <stop offset="1" stop-color="#b92b00"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="64" fill="url(#icon-bg)"/>
  <path d="M128 45l68 26v55c0 43-28 70-68 85-40-15-68-42-68-85V71l68-26z" fill="#fff" opacity=".96"/>
  <path d="M91 101h74M91 129h74M91 157h40" fill="none" stroke="#ff4500" stroke-width="14" stroke-linecap="round"/>
  <path d="M151 158l15 15 34-40" fill="none" stroke="#1c1c1c" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);

const commandCenterBackgroundUri = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 1024">
  <defs>
    <radialGradient id="glow" cx="50%" cy="36%" r="72%">
      <stop offset="0" stop-color="#263846"/>
      <stop offset=".48" stop-color="#101820"/>
      <stop offset="1" stop-color="#071014"/>
    </radialGradient>
    <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#f8fafc" stop-opacity=".96"/>
      <stop offset="1" stop-color="#dce6ec" stop-opacity=".92"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="28" stdDeviation="26" flood-color="#000" flood-opacity=".32"/>
    </filter>
  </defs>
  <rect width="2048" height="1024" fill="url(#glow)"/>
  <g opacity=".18" fill="#e8f0f5">
    <rect x="-52" y="92" width="330" height="102" rx="51"/>
    <rect x="318" y="92" width="430" height="102" rx="51"/>
    <rect x="790" y="92" width="235" height="102" rx="34"/>
    <rect x="1072" y="92" width="550" height="102" rx="51"/>
    <rect x="1665" y="92" width="435" height="102" rx="51"/>
    <rect x="94" y="252" width="405" height="108" rx="54"/>
    <rect x="548" y="252" width="300" height="252" rx="46"/>
    <rect x="896" y="252" width="390" height="108" rx="54"/>
    <rect x="1332" y="252" width="392" height="252" rx="46"/>
    <rect x="1780" y="252" width="268" height="108" rx="54"/>
    <rect x="-60" y="608" width="450" height="106" rx="53"/>
    <rect x="438" y="608" width="650" height="106" rx="53"/>
    <rect x="1136" y="608" width="314" height="252" rx="46"/>
    <rect x="1500" y="608" width="494" height="106" rx="53"/>
  </g>
  <g filter="url(#shadow)" transform="translate(294 210)">
    <rect width="1460" height="560" rx="38" fill="url(#card)"/>
    <rect x="40" y="42" width="1380" height="82" rx="22" fill="#ffffff"/>
    <text x="72" y="76" fill="#516a75" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="2">MODERATOR WORKSPACE</text>
    <text x="72" y="108" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="800">Command Center</text>
    <rect x="1015" y="62" width="96" height="40" rx="20" fill="#fff1eb" stroke="#fed8c7"/>
    <text x="1043" y="89" fill="#d93a00" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800">2</text>
    <rect x="1130" y="62" width="150" height="40" rx="20" fill="#f6f7f8" stroke="#e5ebee"/>
    <text x="1156" y="89" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800">4 cleared</text>
    <rect x="1298" y="62" width="92" height="40" rx="20" fill="#ecfdf3" stroke="#abefc6"/>
    <text x="1324" y="89" fill="#027a48" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800">live</text>

    <rect x="40" y="150" width="360" height="370" rx="24" fill="#f7f9fa"/>
    <rect x="70" y="184" width="160" height="18" rx="9" fill="#ff4500"/>
    <rect x="70" y="230" width="270" height="78" rx="18" fill="#ffffff" stroke="#e5ebee"/>
    <rect x="70" y="330" width="270" height="78" rx="18" fill="#ffffff" stroke="#e5ebee"/>
    <rect x="86" y="254" width="170" height="12" rx="6" fill="#111827"/>
    <rect x="86" y="279" width="104" height="10" rx="5" fill="#576f76"/>
    <rect x="86" y="354" width="190" height="12" rx="6" fill="#111827"/>
    <rect x="86" y="379" width="124" height="10" rx="5" fill="#576f76"/>
    <path d="M372 188v330" stroke="#ff4500" stroke-width="4"/>

    <rect x="430" y="150" width="580" height="170" rx="24" fill="#ffffff" stroke="#e5ebee"/>
    <text x="470" y="199" fill="#516a75" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800">QUEUE ITEM</text>
    <text x="470" y="243" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="800">Review the strongest signal first</text>
    <rect x="470" y="272" width="108" height="36" rx="18" fill="#fff1eb" stroke="#fed8c7"/>
    <text x="502" y="297" fill="#d93a00" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800">spam</text>

    <rect x="430" y="344" width="370" height="176" rx="24" fill="#ffffff" stroke="#e5ebee"/>
    <text x="468" y="394" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800">Triage insight</text>
    <rect x="468" y="424" width="116" height="34" rx="17" fill="#fee4e2" stroke="#fecdca"/>
    <text x="499" y="447" fill="#b42318" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800">High</text>
    <rect x="468" y="474" width="278" height="14" rx="7" fill="#dbe3e7"/>
    <rect x="468" y="474" width="230" height="14" rx="7" fill="#ff4500"/>

    <rect x="830" y="344" width="580" height="176" rx="24" fill="#ffffff" stroke="#e5ebee"/>
    <text x="868" y="394" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800">Decision trail</text>
    <rect x="868" y="426" width="226" height="54" rx="15" fill="#f6f7f8"/>
    <rect x="1116" y="426" width="226" height="54" rx="15" fill="#f6f7f8"/>
    <text x="895" y="462" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800">2 removals</text>
    <text x="1144" y="462" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800">1 opinion</text>
  </g>
  <path d="M0 0h2048v10H0z" fill="#ff4500" opacity=".9"/>
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
      description: "A focused moderator workspace for queue triage, context checks, second opinions, and decision records.",
      buttonLabel: "Open workspace",
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
