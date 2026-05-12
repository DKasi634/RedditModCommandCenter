import type { ClassificationResult, QueueItem, UserHistory } from "../../shared/domain";

const riskScore = {
  low: 10,
  medium: 35,
  high: 60
};

export function calculateTriageScore(
  item: QueueItem,
  classification: ClassificationResult | undefined,
  history: UserHistory
) {
  const reportScore = Math.min(item.reportReasons.length * 8, 24);
  const historyScore = history.previousRemovals * 10 + history.previousWarnings * 4 + history.previousSecondOpinions * 6;
  const aiScore = classification ? riskScore[classification.riskLevel] * classification.confidence : 0;
  const secondOpinionScore = classification?.needsSecondOpinion ? 12 : 0;
  const ageMinutes = (Date.now() - new Date(item.createdAt).getTime()) / 60000;
  const urgencyScore = Math.min(Math.floor(ageMinutes / 30) * 4, 16);

  return Math.round(reportScore + historyScore + aiScore + secondOpinionScore + urgencyScore);
}
