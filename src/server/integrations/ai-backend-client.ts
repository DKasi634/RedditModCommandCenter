import { settings } from "@devvit/web/server";

import type { ClassificationInput, ClassificationResult, QueueItem, UserHistory } from "../../shared/domain";
import { classificationResultSchema } from "../schemas/classification.schema";
import { fetchSubredditRules } from "./reddit-client";

const GEMINI_API_KEY_SETTING = "geminiApiKey";
const GEMINI_MODEL_SETTING = "geminiModel";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_PROMPT_VERSION = "gemini-moderation-v1";

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function textForClassification(item: QueueItem) {
  return `${item.title ?? ""} ${item.body ?? ""} ${item.reportReasons.join(" ")}`.toLowerCase();
}

function requestLocalClassification(
  item: QueueItem,
  history: UserHistory,
  input: ClassificationInput,
): ClassificationResult {
  const text = textForClassification(item);
  const matchedRules = input.subredditRules
    .filter((rule) => {
      const title = rule.title.toLowerCase();
      return text.includes(title) || title.split(/\W+/).some((word) => word.length > 3 && text.includes(word));
    })
    .slice(0, 3)
    .map((rule) => ({
      ruleId: rule.id,
      ruleTitle: rule.title,
      confidence: rule.severity === "high" ? 0.78 : rule.severity === "medium" ? 0.66 : 0.56,
    }));

  const reports = item.reportReasons.map((reason) => reason.toLowerCase());
  const hasSpamSignal = reports.some((reason) => reason.includes("spam")) || text.includes("discount link");
  const hasHarassmentSignal = reports.some((reason) => reason.includes("harass") || reason.includes("abuse")) ||
    /\b(idiot|moron|kill yourself|targeting|personal attack)\b/.test(text);
  const hasRepeatedHistory = history.previousRemovals + history.previousWarnings >= 2;
  const reportCount = item.reportReasons.length;

  const riskLevel =
    hasHarassmentSignal || hasRepeatedHistory || reportCount >= 3
      ? "high"
      : hasSpamSignal || reportCount > 0
        ? "medium"
        : "low";

  const suggestedAction =
    riskLevel === "high"
      ? "needs_second_opinion"
      : hasSpamSignal
        ? "remove"
        : riskLevel === "low"
          ? "approve"
          : "needs_review";

  const categories = [
    hasSpamSignal ? "spam_signal" : "",
    hasHarassmentSignal ? "harassment_signal" : "",
    hasRepeatedHistory ? "repeat_history" : "",
    reportCount > 0 ? "reported" : "unreported",
    "local_fallback",
  ].filter(Boolean);

  return {
    thingId: item.thingId,
    riskLevel,
    confidence: riskLevel === "low" ? 0.58 : riskLevel === "medium" ? 0.66 : 0.74,
    suggestedAction,
    matchedRules,
    categories,
    summary:
      riskLevel === "low"
        ? "Local fallback found limited risk signals. Review briefly before approving."
        : riskLevel === "medium"
          ? "Local fallback found moderation signals that deserve review."
          : "Local fallback found stronger risk signals; a second opinion is recommended.",
    reasoningForMods: [
      reportCount > 0
        ? `Reports/signals: ${item.reportReasons.join(", ")}.`
        : "No report reasons were available from Reddit.",
      hasRepeatedHistory
        ? "The author has prior app-tracked moderation history."
        : "No repeat app-tracked moderation pattern was found.",
      "The external AI backend was unavailable, so this result used the local fallback classifier.",
    ],
    needsSecondOpinion: suggestedAction === "needs_second_opinion",
    modelProvider: "mock",
    modelVersion: "local-fallback",
    promptVersion: "heuristic-v1",
    createdAt: new Date().toISOString(),
    failed: true,
  };
}

async function buildClassificationInput(item: QueueItem, history: UserHistory): Promise<ClassificationInput> {
  const subredditRules = await fetchSubredditRules(item.subredditName);
  const priorAppHistory: ClassificationInput["priorAppHistory"] = {
    previousWarnings: history.previousWarnings,
    previousApprovals: history.previousApprovals ?? 0,
    previousRemovals: history.previousRemovals,
    previousSecondOpinions: history.previousSecondOpinions,
    repeatedRuleTags: history.repeatedRuleTags,
  };

  if (history.lastModerationAction) {
    priorAppHistory.lastModerationAction = history.lastModerationAction;
  }

  const input: ClassificationInput = {
    thingId: item.thingId,
    itemType: item.itemType,
    subredditName: item.subredditName,
    author: { username: item.authorUsername ?? "unknown" },
    reportReasons: item.reportReasons,
    subredditRules,
    priorAppHistory,
  };

  if (item.title) {
    input.title = item.title;
  }

  if (item.body) {
    input.body = item.body;
  }

  return input;
}

function settingString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return settingString(value[0]);
  }

  if (value && typeof value === "object" && "value" in value) {
    return settingString((value as { value?: unknown }).value);
  }

  return "";
}

function normalizeGeminiModel(model: unknown) {
  const normalized = settingString(model).replace(/^models\//, "");
  return normalized || DEFAULT_GEMINI_MODEL;
}

function buildGeminiPrompt(input: ClassificationInput) {
  return [
    "You are an assistant for human Reddit moderators.",
    "Classify the queued post or comment using only the supplied moderation context.",
    "Return strict JSON only. Do not include markdown, commentary, or extra keys.",
    "",
    "JSON schema:",
    "{",
    '  "riskLevel": "low" | "medium" | "high",',
    '  "confidence": number from 0 to 1,',
    '  "suggestedAction": "approve" | "remove" | "needs_review" | "needs_second_opinion",',
    '  "matchedRules": [{"ruleId": string, "ruleTitle": string, "confidence": number from 0 to 1}],',
    '  "categories": string[],',
    '  "summary": string,',
    '  "reasoningForMods": string[],',
    '  "needsSecondOpinion": boolean',
    "}",
    "",
    "Guidelines:",
    "- Prefer human review when context is ambiguous.",
    "- Do not recommend removal only because content was reported.",
    "- Flag high risk for clear harassment, threats, hate, spam campaigns, or repeated app-tracked removals.",
    "- Keep summary and reasoning concise and suitable for moderators.",
    "",
    `Moderation context: ${JSON.stringify(input)}`,
  ].join("\n");
}

function parseGeminiJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced?.[1] ?? trimmed;
  return JSON.parse(jsonText);
}

async function getGeminiConfig() {
  const [settingsApiKey, configuredModel] = await Promise.all([
    settings.get<unknown>(GEMINI_API_KEY_SETTING),
    settings.get<unknown>(GEMINI_MODEL_SETTING),
  ]);
  const apiKey = settingString(process.env.GEMINI_API_KEY) || settingString(settingsApiKey);

  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Set GEMINI_API_KEY for playtest or geminiApiKey via Devvit settings.");
  }

  return {
    apiKey,
    model: normalizeGeminiModel(configuredModel),
  };
}

async function requestGeminiClassification(input: ClassificationInput): Promise<ClassificationResult> {
  const { apiKey, model } = await getGeminiConfig();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildGeminiPrompt(input) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini failed with ${response.status}: ${errorText.slice(0, 500)}`);
  }

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

  if (!text) {
    throw new Error("Gemini response did not include classification text");
  }

  const parsed = parseGeminiJson(text);
  return classificationResultSchema.parse({
    ...parsed,
    thingId: input.thingId,
    modelProvider: "gemini",
    modelVersion: model,
    promptVersion: GEMINI_PROMPT_VERSION,
    createdAt: new Date().toISOString(),
    failed: false,
  });
}

export async function requestClassification(item: QueueItem, history: UserHistory): Promise<ClassificationResult> {
  const input = await buildClassificationInput(item, history);

  try {
    return await requestGeminiClassification(input);
  } catch (error) {
    console.warn("[ai-backend-client] Using local fallback classification after Gemini failure", error);
    return requestLocalClassification(item, history, input);
  }
}

export async function testGeminiProvider(): Promise<ClassificationResult> {
  const demoItem: QueueItem = {
    thingId: "t3_gemini_diagnostic",
    itemType: "post",
    subredditName: "modqueuecc_dev",
    title: "Diagnostic moderation test post",
    body: "This is a harmless diagnostic post used to verify Gemini access.",
    authorUsername: "diagnostic-user",
    reportReasons: ["diagnostic"],
    createdAt: new Date().toISOString(),
  };
  const demoHistory: UserHistory = {
    username: "diagnostic-user",
    previousWarnings: 0,
    previousApprovals: 0,
    previousRemovals: 0,
    previousSecondOpinions: 0,
    repeatedRuleTags: [],
  };

  const input = await buildClassificationInput(demoItem, demoHistory);
  return requestGeminiClassification(input);
}
