// Share trigger frequency control - 5-minute deduplication
export type ShareTrigger = { type: string; id: string; timestamp: number };

export function isRecentShareTrigger(
  triggers: ShareTrigger[],
  type: string,
  id: string
): boolean {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const validTriggers = triggers.filter(t => t.timestamp > fiveMinutesAgo);
  return validTriggers.some(t => t.type === type && t.id === id);
}