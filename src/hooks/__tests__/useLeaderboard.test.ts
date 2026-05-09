import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLeaderboard, getLeaderboardEntries } from '../useLeaderboard';
import type { SessionHistory } from '@/data/types';

const HISTORY_KEY = 'en-learn-history';

function setHistory(entries: SessionHistory[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function createSessionHistory(overrides: Partial<SessionHistory> = {}): SessionHistory {
  return {
    id: 'session-1',
    timestamp: Date.now(),
    duration: 60,
    dictionaryId: 'dict-1',
    dictionaryName: 'Test Dictionary',
    score: 100,
    totalQuestions: 10,
    correctCount: 8,
    accuracy: 80,
    ...overrides,
  };
}

describe('useLeaderboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns getLeaderboardEntries from hook', () => {
    const { result } = renderHook(() => useLeaderboard());
    expect(typeof result.current.getLeaderboardEntries).toBe('function');
  });

  it('sorts by score descending with correct ranks', () => {
    const now = new Date('2026-05-10T12:00:00').getTime();
    vi.setSystemTime(now);

    setHistory([
      createSessionHistory({ id: 's1', score: 50, timestamp: now }),
      createSessionHistory({ id: 's2', score: 150, timestamp: now }),
      createSessionHistory({ id: 's3', score: 100, timestamp: now }),
    ]);

    const entries = getLeaderboardEntries('score', 'all');
    expect(entries.map((e) => ({ rank: e.rank, sessionId: e.sessionId, score: e.score }))).toEqual([
      { rank: 1, sessionId: 's2', score: 150 },
      { rank: 2, sessionId: 's3', score: 100 },
      { rank: 3, sessionId: 's1', score: 50 },
    ]);
  });

  it('sorts by accuracy descending', () => {
    const now = new Date('2026-05-10T12:00:00').getTime();
    vi.setSystemTime(now);

    setHistory([
      createSessionHistory({ id: 's1', accuracy: 60, timestamp: now }),
      createSessionHistory({ id: 's2', accuracy: 95, timestamp: now }),
      createSessionHistory({ id: 's3', accuracy: 80, timestamp: now }),
    ]);

    const entries = getLeaderboardEntries('accuracy', 'all');
    expect(entries.map((e) => ({ rank: e.rank, sessionId: e.sessionId, accuracy: e.accuracy }))).toEqual([
      { rank: 1, sessionId: 's2', accuracy: 95 },
      { rank: 2, sessionId: 's3', accuracy: 80 },
      { rank: 3, sessionId: 's1', accuracy: 60 },
    ]);
  });

  it('sorts by speed descending and calculates speed correctly', () => {
    const now = new Date('2026-05-10T12:00:00').getTime();
    vi.setSystemTime(now);

    // speed = score / (duration / 60)
    // s1: 100 / (60/60) = 100
    // s2: 120 / (30/60) = 240
    // s3: 50 / (120/60) = 25
    setHistory([
      createSessionHistory({ id: 's1', score: 100, duration: 60, timestamp: now }),
      createSessionHistory({ id: 's2', score: 120, duration: 30, timestamp: now }),
      createSessionHistory({ id: 's3', score: 50, duration: 120, timestamp: now }),
    ]);

    const entries = getLeaderboardEntries('speed', 'all');
    expect(entries.map((e) => ({ rank: e.rank, sessionId: e.sessionId, speed: e.speed }))).toEqual([
      { rank: 1, sessionId: 's2', speed: 240 },
      { rank: 2, sessionId: 's1', speed: 100 },
      { rank: 3, sessionId: 's3', speed: 25 },
    ]);
  });

  it('handles zero duration as speed 0', () => {
    const now = new Date('2026-05-10T12:00:00').getTime();
    vi.setSystemTime(now);

    setHistory([
      createSessionHistory({ id: 's1', score: 100, duration: 0, timestamp: now }),
    ]);

    const entries = getLeaderboardEntries('speed', 'all');
    expect(entries[0].speed).toBe(0);
  });

  it('rounds speed to 1 decimal', () => {
    const now = new Date('2026-05-10T12:00:00').getTime();
    vi.setSystemTime(now);

    // speed = 100 / (37/60) = 162.162... -> rounded to 162.2
    setHistory([
      createSessionHistory({ id: 's1', score: 100, duration: 37, timestamp: now }),
    ]);

    const entries = getLeaderboardEntries('speed', 'all');
    expect(entries[0].speed).toBe(162.2);
  });

  it('filters by today', () => {
    const today = new Date('2026-05-10T12:00:00').getTime();
    const yesterday = new Date('2026-05-09T10:00:00').getTime();
    vi.setSystemTime(today);

    setHistory([
      createSessionHistory({ id: 's1', score: 100, timestamp: today }),
      createSessionHistory({ id: 's2', score: 200, timestamp: yesterday }),
    ]);

    const entries = getLeaderboardEntries('score', 'today');
    expect(entries).toHaveLength(1);
    expect(entries[0].sessionId).toBe('s1');
  });

  it('filters by week starting Sunday', () => {
    // 2026-05-10 is Sunday
    const sunday = new Date('2026-05-10T12:00:00').getTime();
    const saturday = new Date('2026-05-09T12:00:00').getTime();
    const monday = new Date('2026-05-11T12:00:00').getTime();
    vi.setSystemTime(monday);

    setHistory([
      createSessionHistory({ id: 's1', score: 100, timestamp: sunday }),
      createSessionHistory({ id: 's2', score: 200, timestamp: saturday }),
    ]);

    const entries = getLeaderboardEntries('score', 'week');
    expect(entries).toHaveLength(1);
    expect(entries[0].sessionId).toBe('s1');
  });

  it('includes all entries when filter is all', () => {
    const now = new Date('2026-05-10T12:00:00').getTime();
    const lastYear = new Date('2025-01-01T12:00:00').getTime();
    vi.setSystemTime(now);

    setHistory([
      createSessionHistory({ id: 's1', score: 100, timestamp: now }),
      createSessionHistory({ id: 's2', score: 200, timestamp: lastYear }),
    ]);

    const entries = getLeaderboardEntries('score', 'all');
    expect(entries).toHaveLength(2);
  });

  it('breaks ties by timestamp descending (more recent first)', () => {
    const now = new Date('2026-05-10T12:00:00').getTime();
    const earlier = new Date('2026-05-10T10:00:00').getTime();
    vi.setSystemTime(now);

    setHistory([
      createSessionHistory({ id: 's1', score: 100, timestamp: earlier }),
      createSessionHistory({ id: 's2', score: 100, timestamp: now }),
    ]);

    const entries = getLeaderboardEntries('score', 'all');
    expect(entries[0].sessionId).toBe('s2');
    expect(entries[1].sessionId).toBe('s1');
    expect(entries[0].rank).toBe(1);
    expect(entries[1].rank).toBe(2);
  });

  it('returns empty array when no history', () => {
    const now = new Date('2026-05-10T12:00:00').getTime();
    vi.setSystemTime(now);

    const entries = getLeaderboardEntries('score', 'all');
    expect(entries).toEqual([]);
  });
});
