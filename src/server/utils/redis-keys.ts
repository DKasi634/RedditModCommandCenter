export const redisKeys = {
  classification: (thingId: string) => `classification:${thingId}`,
  decision: (thingId: string) => `decision:${thingId}`,
  status: (thingId: string) => `status:${thingId}`,
  userHistory: (username: string) => `user-history:${username.toLowerCase()}`,
  settings: "settings",
  secondOpinion: (thingId: string) => `second-opinion:${thingId}`,
  triageScore: (thingId: string) => `triage-score:${thingId}`
};
