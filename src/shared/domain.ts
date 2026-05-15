export type ItemType = "post" | "comment";
export type RiskLevel = "low" | "medium" | "high";
export type SuggestedAction = "approve" | "remove" | "needs_review" | "needs_second_opinion";
export type WorkflowStatus =
  | "needs_review"
  | "claimed"
  | "needs_second_opinion"
  | "likely_approve"
  | "likely_remove"
  | "resolved"
  | "ignored_ai_suggestion";

export type ClassificationState =
  | "not_analyzed"
  | "analyzing"
  | "available"
  | "failed"
  | "disabled"
  | "fallback";

export type SecondOpinionReason =
  | "senior_mod_review"
  | "rule_ambiguity"
  | "policy_question"
  | "context_unclear"
  | "other";

export type QueueItem = {
  thingId: string;
  itemType: ItemType;
  subredditName: string;
  title?: string;
  body?: string;
  authorUsername?: string;
  reportReasons: string[];
  permalink?: string;
  createdAt: string;
};

export type SubredditRule = {
  id: string;
  title: string;
  description?: string;
  severity?: "low" | "medium" | "high";
};

export type UserHistory = {
  username: string;
  previousWarnings: number;
  previousApprovals: number;
  previousRemovals: number;
  previousSecondOpinions: number;
  repeatedRuleTags: string[];
  lastModerationAction?: string;
  updatedAt?: string;
};

export type ClassificationInput = {
  thingId: string;
  itemType: ItemType;
  subredditName: string;
  title?: string;
  body?: string;
  author: {
    username: string;
    accountAgeDays?: number;
    karma?: number;
  };
  reportReasons: string[];
  subredditRules: SubredditRule[];
  priorAppHistory?: Omit<UserHistory, "username" | "updatedAt">;
};

export type RuleMatch = {
  ruleId: string;
  ruleTitle: string;
  confidence: number;
};

export type ClassificationResult = {
  thingId: string;
  riskLevel: RiskLevel;
  confidence: number;
  suggestedAction: SuggestedAction;
  matchedRules: RuleMatch[];
  categories: string[];
  summary: string;
  reasoningForMods: string[];
  needsSecondOpinion: boolean;
  modelProvider: "gemini" | "openai" | "mock";
  modelVersion: string;
  promptVersion: string;
  createdAt: string;
  failed?: boolean;
};

export type ModeratorDecision = {
  thingId: string;
  finalAction: "approved" | "removed" | "escalated" | "ignored";
  selectedRuleId?: string;
  selectedRuleTitle?: string;
  moderatorUsername: string;
  note?: string;
  aiFeedback?: "correct" | "partially_correct" | "wrong" | "unclear" | "not_useful" | "missed_context";
  aiSnapshot?: ClassificationResult;
  secondOpinionReason?: SecondOpinionReason;
  decidedAt: string;
};

export type SecondOpinionRecord = {
  thingId: string;
  reason: SecondOpinionReason;
  note?: string;
  escalatedBy: string;
  escalatedAt: string;
  status: "open" | "resolved";
  resolvedBy?: string;
  resolvedAt?: string;
};

export type SubredditSettings = {
  aiEnabled: boolean;
  classificationMode: "manual" | "auto_on_load";
  secondOpinionThreshold: number;
  collapseLowRiskItems: boolean;
  showResolvedByDefault: boolean;
  showAiSummaryByDefault: boolean;
  customSensitiveKeywords: string[];
};

export type QueueViewItem = QueueItem & {
  classification?: ClassificationResult;
  classificationState: ClassificationState;
  status: WorkflowStatus;
  triageScore: number;
  userHistory: UserHistory;
  secondOpinion?: SecondOpinionRecord;
};
