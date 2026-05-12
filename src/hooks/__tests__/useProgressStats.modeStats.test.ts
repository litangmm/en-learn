import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getModeAccuracy, getDailyXP, ALL_MODES } from '../useProgressStats';
import { storage } from '@/services/storage';
import type { PracticeMode } from '@/data/types';

describe('useProgressStats extended functions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getModeAccuracy', () => {
    it('returns array with all 4 practice modes', () => {
      const result = getModeAccuracy();

      expect(result).toHaveLength(4);
      expect(result.map(r => r.mode)).toEqual(ALL_MODES);
    });

    it('returns zero accuracy for new user with no data', () => {
      const result = getModeAccuracy();

      result.forEach(modeStats => {
        expect(modeStats.accuracy).toBe(0);
        expect(modeStats.totalQuestions).toBe(0);
        expect(modeStats.correctCount).toBe(0);
      });
    });

    it('calculates accuracy from badge progress', () => {
      // Set up badge progress with some data
      const badgeProgress = storage.getBadgeProgress();
      badgeProgress.totalAnswered = 100;
      badgeProgress.totalCorrect = 80;
      storage.saveBadgeProgress(badgeProgress);

      const result = getModeAccuracy();

      // All modes should have the same accuracy (uniform distribution)
      const expectedAccuracy = 80; // 80/100 = 80%
      result.forEach(modeStats => {
        expect(modeStats.accuracy).toBe(expectedAccuracy);
        expect(modeStats.totalQuestions).toBe(100);
        expect(modeStats.correctCount).toBe(80);
      });
    });

    it('returns correct mode types', () => {
      const result = getModeAccuracy();

      const expectedModes: PracticeMode[] = ['fill-in-blanks', 'multiple-choice', 'sentence-reorder', 'dictation'];
      result.forEach((modeStats, index) => {
        expect(modeStats.mode).toBe(expectedModes[index]);
      });
    });
  });

  describe('getDailyXP', () => {
    it('returns array with specified number of days', () => {
      const result = getDailyXP(7);

      expect(result).toHaveLength(7);
    });

    it('returns array with 7 days by default', () => {
      const result = getDailyXP();

      expect(result).toHaveLength(7);
    });

    it('returns array with correct date format (YYYY-MM-DD)', () => {
      const result = getDailyXP(3);

      result.forEach(day => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('returns array with day names (周一 to 周日)', () => {
      const result = getDailyXP(7);

      result.forEach(day => {
        expect(day.dayName).toMatch(/^[周日月火水木金]/);
      });
    });

    it('returns zero values for days with no history', () => {
      const result = getDailyXP(7);

      result.forEach(day => {
        expect(day.xp).toBe(0);
        expect(day.questions).toBe(0);
        expect(day.accuracy).toBe(0);
      });
    });

    it('calculates correct daily stats from history', () => {
      // Add history entries for today
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      storage.addHistory({
        id: 'session-1',
        timestamp: today.getTime(),
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
      });

      storage.addHistory({
        id: 'session-2',
        timestamp: today.getTime(),
        duration: 200,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 8,
        correctCount: 6,
        accuracy: 75,
      });

      const result = getDailyXP(7);

      // Find today in results
      const todayResult = result.find(d => d.date === todayStr);
      expect(todayResult).toBeDefined();
      expect(todayResult!.xp).toBe(180); // 100 + 80
      expect(todayResult!.questions).toBe(18); // 10 + 8
      expect(todayResult!.accuracy).toBe(78); // (8 + 6) / (10 + 8) = 14/18 ≈ 78%
    });

    it('orders results from oldest to newest', () => {
      const result = getDailyXP(3);

      // Each date should be later than the previous
      for (let i = 1; i < result.length; i++) {
        const prevDate = new Date(result[i - 1].date);
        const currDate = new Date(result[i].date);
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
      }
    });

    it('handles custom day count', () => {
      const result = getDailyXP(14);

      expect(result).toHaveLength(14);
    });
  });
});
