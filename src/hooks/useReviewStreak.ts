import { useState, useCallback } from 'react';
import type { ReviewStreakData } from '@/data/types';
import { getTodayDateString, getYesterdayDateString } from '@/utils/dateUtils';

const STREAK_STORAGE_KEY = 'en-learn-review-streak';

interface StoredStreakData {
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string | null;
  totalReviewDays: number;
}

const DEFAULT_STREAK_DATA: StoredStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastReviewDate: null,
  totalReviewDays: 0,
};

function getDayDifference(dateStr1: string, dateStr2: string): number {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  const diffTime = date1.getTime() - date2.getTime();
  return Math.abs(Math.round(diffTime / (1000 * 60 * 60 * 24)));
}

function loadStreakData(): StoredStreakData {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (raw === null) {
      return { ...DEFAULT_STREAK_DATA };
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.currentStreak === 'number' &&
      typeof parsed.longestStreak === 'number' &&
      (parsed.lastReviewDate === null || typeof parsed.lastReviewDate === 'string') &&
      typeof parsed.totalReviewDays === 'number'
    ) {
      return parsed;
    }
    return { ...DEFAULT_STREAK_DATA };
  } catch {
    return { ...DEFAULT_STREAK_DATA };
  }
}

function saveStreakData(data: StoredStreakData): void {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('[useReviewStreak] Failed to save streak data:', error);
  }
}

function computeIsStreakActive(data: StoredStreakData): boolean {
  if (data.lastReviewDate === null) {
    return false;
  }
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  return data.lastReviewDate === today || data.lastReviewDate === yesterday;
}

function toReviewStreakData(stored: StoredStreakData): ReviewStreakData {
  return {
    currentStreak: stored.currentStreak,
    longestStreak: stored.longestStreak,
    lastReviewDate: stored.lastReviewDate,
    totalReviewDays: stored.totalReviewDays,
    isStreakActive: computeIsStreakActive(stored),
  };
}

export function useReviewStreak() {
  const [streakData, setStreakData] = useState<StoredStreakData>(() => loadStreakData());

  const data: ReviewStreakData = toReviewStreakData(streakData);

  const recordReview = useCallback(() => {
    setStreakData((prev) => {
      const today = getTodayDateString();

      // Already recorded today
      if (prev.lastReviewDate === today) {
        return prev;
      }

      let newCurrentStreak: number;
      let newTotalReviewDays: number;

      if (prev.lastReviewDate === null) {
        // First review ever
        newCurrentStreak = 1;
        newTotalReviewDays = 1;
      } else {
        const dayDiff = getDayDifference(today, prev.lastReviewDate);

        if (dayDiff === 1) {
          // Consecutive day - extend streak
          newCurrentStreak = prev.currentStreak + 1;
        } else if (dayDiff === 0) {
          // Same day (shouldn't happen since we check above, but handle it)
          return prev;
        } else {
          // Gap of 2+ days - reset streak to 1
          newCurrentStreak = 1;
        }

        newTotalReviewDays = prev.totalReviewDays + 1;
      }

      const newLongestStreak = Math.max(prev.longestStreak, newCurrentStreak);

      const updated: StoredStreakData = {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastReviewDate: today,
        totalReviewDays: newTotalReviewDays,
      };

      saveStreakData(updated);
      return updated;
    });
  }, []);

  const getTodayReviewedCount = useCallback((): number => {
    const today = getTodayDateString();
    if (streakData.lastReviewDate === today) {
      return streakData.currentStreak;
    }
    return 0;
  }, [streakData]);

  return {
    data,
    recordReview,
    getTodayReviewedCount,
  };
}