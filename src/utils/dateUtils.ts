export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}
