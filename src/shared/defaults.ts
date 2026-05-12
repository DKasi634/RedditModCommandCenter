import type { SubredditRule, SubredditSettings } from "./domain";

export const DEFAULT_SETTINGS: SubredditSettings = {
  aiEnabled: true,
  classificationMode: "manual",
  secondOpinionThreshold: 75,
  collapseLowRiskItems: false,
  showAiSummaryByDefault: true,
  customSensitiveKeywords: []
};

export const DEFAULT_RULES: SubredditRule[] = [
  {
    id: "rule_1",
    title: "Be civil",
    description: "No harassment, personal attacks, or targeted hostility.",
    severity: "high"
  },
  {
    id: "rule_2",
    title: "No spam or self-promotion",
    description: "Avoid repetitive, low-context, or promotional content.",
    severity: "medium"
  },
  {
    id: "rule_3",
    title: "Stay on topic",
    description: "Posts and comments should fit the community topic.",
    severity: "low"
  }
];
