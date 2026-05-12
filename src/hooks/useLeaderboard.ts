import type { LeaderboardCategory, LeaderboardTimeFilter, LeaderboardEntry } from '@/data/types';
import { storage } from '@/services/storage';

function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getStartOfWeek(timestamp: number): number {
  const date = new Date(timestamp);
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = date.getDate() - day;
  const sunday = new Date(date.getFullYear(), date.getMonth(), diff);
  sunday.setHours(0, 0, 0, 0);
  return sunday.getTime();
}

export function getLeaderboardEntries(
  category: LeaderboardCategory,
  timeFilter: LeaderboardTimeFilter
): LeaderboardEntry[] {
  const history = storage.getHistory();
  const now = Date.now();

  let filtered = history;

  if (timeFilter === 'today') {
    const startOfToday = getStartOfDay(now);
    filtered = history.filter((entry) => entry.timestamp >= startOfToday);
  } else if (timeFilter === 'week') {
    const startOfWeek = getStartOfWeek(now);
    filtered = history.filter((entry) => entry.timestamp >= startOfWeek);
  }

  const entries: LeaderboardEntry[] = filtered.map((history) => ({
    rank: 0,
    sessionId: history.id,
    dictionaryName: history.dictionaryName,
    score: history.score,
    accuracy: history.accuracy,
    speed: history.duration > 0 ? Math.round((history.score / (history.duration / 60)) * 10) / 10 : 0,
    timestamp: history.timestamp,
  }));

  entries.sort((a, b) => {
    const primaryA = a[category];
    const primaryB = b[category];
    if (primaryB !== primaryA) {
      return primaryB - primaryA;
    }
    return b.timestamp - a.timestamp;
  });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export function useLeaderboard() {
  return {
    getLeaderboardEntries,
  };
}
