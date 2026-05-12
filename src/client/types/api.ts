import type {
  ClassificationResult,
  ModeratorDecision,
  QueueViewItem,
  SubredditSettings,
  WorkflowStatus
} from "../../shared/domain";

export type QueueResponse = {
  items: QueueViewItem[];
  settings: SubredditSettings;
};

export type ClassifyResponse = {
  classification: ClassificationResult;
};

export type StatusRequest = {
  thingId: string;
  status: WorkflowStatus;
};

export type DecisionRequest = {
  decision: Omit<ModeratorDecision, "decidedAt" | "moderatorUsername"> & {
    moderatorUsername?: string;
  };
};
