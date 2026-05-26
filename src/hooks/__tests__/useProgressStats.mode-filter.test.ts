import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getModeAccuracy, getFilteredTrend, getDailyXP, ALL_MODES } from '../useProgressStats';
import { storage } from '@/services/storage';

describe('useProgressStats mode filter tests', () => {
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

    it('falls back to badge progress when no mode stats exist', () => {
      // Set up badge progress with some data
      const badgeProgress = storage.getBadgeProgress();
      badgeProgress.totalAnswered = 100;
      badgeProgress.totalCorrect = 80;
      storage.saveBadgeProgress(badgeProgress);

      const result = getModeAccuracy();

      // All modes should have the same accuracy (uniform distribution from badge progress)
      const expectedAccuracy = 80; // 80/100 = 80%
      result.forEach(modeStats => {
        expect(modeStats.accuracy).toBe(expectedAccuracy);
        expect(modeStats.totalQuestions).toBe(100);
        expect(modeStats.correctCount).toBe(80);
      });
    });

    it('uses mode-specific stats when available', () => {
      // Set up mode-specific stats
      storage.updateModeStats('fill-in-blanks', 20, 18); // 90% accuracy
      storage.updateModeStats('multiple-choice', 30, 21); // 70% accuracy
      storage.updateModeStats('dictation', 10, 5); // 50% accuracy
      storage.updateModeStats('sentence-reorder', 40, 36); // 90% accuracy

      const result = getModeAccuracy();

      const fillInBlanks = result.find(r => r.mode === 'fill-in-blanks')!;
      expect(fillInBlanks.accuracy).toBe(90);
      expect(fillInBlanks.totalQuestions).toBe(20);
      expect(fillInBlanks.correctCount).toBe(18);

      const multipleChoice = result.find(r => r.mode === 'multiple-choice')!;
      expect(multipleChoice.accuracy).toBe(70);
      expect(multipleChoice.totalQuestions).toBe(30);
      expect(multipleChoice.correctCount).toBe(21);

      const dictation = result.find(r => r.mode === 'dictation')!;
      expect(dictation.accuracy).toBe(50);
      expect(dictation.totalQuestions).toBe(10);
      expect(dictation.correctCount).toBe(5);

      const sentenceReorder = result.find(r => r.mode === 'sentence-reorder')!;
      expect(sentenceReorder.accuracy).toBe(90);
      expect(sentenceReorder.totalQuestions).toBe(40);
      expect(sentenceReorder.correctCount).toBe(36);
    });

    it('updates mode stats incrementally', () => {
      // Add stats multiple times
      storage.updateModeStats('fill-in-blanks', 10, 8);
      storage.updateModeStats('fill-in-blanks', 10, 9); // Second session: 10 questions, 9 correct

      const result = getModeAccuracy();
      const fillInBlanks = result.find(r => r.mode === 'fill-in-blanks')!;

      expect(fillInBlanks.totalQuestions).toBe(20);
      expect(fillInBlanks.correctCount).toBe(17);
      expect(fillInBlanks.accuracy).toBe(85); // 17/20 = 85%
    });

    it('mixes mode-specific and badge progress fallback', () => {
      // Only set up mode stats for some modes
      storage.updateModeStats('fill-in-blanks', 20, 18);

      // Set up badge progress for fallback
      const badgeProgress = storage.getBadgeProgress();
      badgeProgress.totalAnswered = 100;
      badgeProgress.totalCorrect = 80;
      storage.saveBadgeProgress(badgeProgress);

      const result = getModeAccuracy();

      // fill-in-blanks should use mode-specific stats
      const fillInBlanks = result.find(r => r.mode === 'fill-in-blanks')!;
      expect(fillInBlanks.accuracy).toBe(90);
      expect(fillInBlanks.totalQuestions).toBe(20);
      expect(fillInBlanks.correctCount).toBe(18);

      // Other modes should fall back to badge progress
      const multipleChoice = result.find(r => r.mode === 'multiple-choice')!;
      expect(multipleChoice.accuracy).toBe(80);
      expect(multipleChoice.totalQuestions).toBe(100);
      expect(multipleChoice.correctCount).toBe(80);
    });
  });

  describe('getFilteredTrend', () => {
    it('returns array with specified number of days', () => {
      const result = getFilteredTrend(['fill-in-blanks'], 7);

      expect(result).toHaveLength(7);
    });

    it('returns array with 7 days by default', () => {
      const result = getFilteredTrend(['fill-in-blanks']);

      expect(result).toHaveLength(7);
    });

    it('returns empty filter (all modes) when no modes provided', () => {
      // Add history entries with mixed modes
      const now = Date.now();
      storage.addHistory({
        id: 'session-1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'fill-in-blanks',
      });
      storage.addHistory({
        id: 'session-2',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 7,
        accuracy: 70,
        mode: 'multiple-choice',
      });

      const result = getFilteredTrend([], 7);

      // Should include all activity when no filter
      const todayResult = result.find(d => {
        const today = new Date().toISOString().split('T')[0];
        return d.date === today;
      });

      expect(todayResult).toBeDefined();
      expect(todayResult!.xp).toBe(180);
      expect(todayResult!.questions).toBe(20);
    });

    it('filters by single mode', () => {
      const now = Date.now();
      storage.addHistory({
        id: 'session-1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'fill-in-blanks',
      });
      storage.addHistory({
        id: 'session-2',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 7,
        accuracy: 70,
        mode: 'multiple-choice',
      });

      const result = getFilteredTrend(['fill-in-blanks'], 7);

      const todayResult = result.find(d => {
        const today = new Date().toISOString().split('T')[0];
        return d.date === today;
      });

      expect(todayResult).toBeDefined();
      expect(todayResult!.xp).toBe(100); // Only fill-in-blanks XP
      expect(todayResult!.questions).toBe(10); // Only fill-in-blanks questions
      expect(todayResult!.modesPracticed).toContain('fill-in-blanks');
      expect(todayResult!.hasActivity).toBe(true);
    });

    it('filters by multiple modes', () => {
      const now = Date.now();
      storage.addHistory({
        id: 'session-1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'fill-in-blanks',
      });
      storage.addHistory({
        id: 'session-2',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 7,
        accuracy: 70,
        mode: 'multiple-choice',
      });
      storage.addHistory({
        id: 'session-3',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 60,
        totalQuestions: 10,
        correctCount: 6,
        accuracy: 60,
        mode: 'dictation',
      });

      const result = getFilteredTrend(['fill-in-blanks', 'dictation'], 7);

      const todayResult = result.find(d => {
        const today = new Date().toISOString().split('T')[0];
        return d.date === today;
      });

      expect(todayResult).toBeDefined();
      expect(todayResult!.xp).toBe(160); // fill-in-blanks (100) + dictation (60)
      expect(todayResult!.questions).toBe(20); // fill-in-blanks (10) + dictation (10)
      expect(todayResult!.modesPracticed).toContain('fill-in-blanks');
      expect(todayResult!.modesPracticed).toContain('dictation');
      expect(todayResult!.modesPracticed).not.toContain('multiple-choice');
      expect(todayResult!.hasActivity).toBe(true);
    });

    it('excludes entries without mode field when filtering', () => {
      const now = Date.now();
      storage.addHistory({
        id: 'session-1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        // No mode field - should be excluded when filtering
      });
      storage.addHistory({
        id: 'session-2',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 7,
        accuracy: 70,
        mode: 'fill-in-blanks',
      });

      const result = getFilteredTrend(['fill-in-blanks'], 7);

      const todayResult = result.find(d => {
        const today = new Date().toISOString().split('T')[0];
        return d.date === today;
      });

      expect(todayResult).toBeDefined();
      expect(todayResult!.xp).toBe(80); // Only the mode-specified entry
      expect(todayResult!.questions).toBe(10);
    });

    it('marks hasActivity correctly for days with no matching mode', () => {
      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      // Session from 2 days ago with fill-in-blanks
      storage.addHistory({
        id: 'session-1',
        timestamp: twoDaysAgo,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'fill-in-blanks',
      });

      // Session from today with multiple-choice (should not match fill-in-blanks filter)
      storage.addHistory({
        id: 'session-2',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 7,
        accuracy: 70,
        mode: 'multiple-choice',
      });

      const result = getFilteredTrend(['fill-in-blanks'], 7);

      const todayResult = result.find(d => {
        const today = new Date().toISOString().split('T')[0];
        return d.date === today;
      });

      const twoDaysAgoResult = result.find(d => {
        const twoDaysAgoStr = new Date(twoDaysAgo).toISOString().split('T')[0];
        return d.date === twoDaysAgoStr;
      });

      expect(todayResult).toBeDefined();
      expect(todayResult!.hasActivity).toBe(false);
      expect(todayResult!.xp).toBe(0);

      expect(twoDaysAgoResult).toBeDefined();
      expect(twoDaysAgoResult!.hasActivity).toBe(true);
      expect(twoDaysAgoResult!.xp).toBe(100);
    });

    it('returns correct date format (YYYY-MM-DD)', () => {
      const result = getFilteredTrend(['fill-in-blanks'], 3);

      result.forEach(day => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('returns correct day names (周一 to 周日)', () => {
      const result = getFilteredTrend(['fill-in-blanks'], 7);

      result.forEach(day => {
        expect(day.dayName).toMatch(/^[周日月火水木金]/);
      });
    });

    it('orders results from oldest to newest', () => {
      const result = getFilteredTrend(['fill-in-blanks'], 3);

      for (let i = 1; i < result.length; i++) {
        const prevDate = new Date(result[i - 1].date);
        const currDate = new Date(result[i].date);
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
      }
    });

    it('handles custom day count', () => {
      const result = getFilteredTrend(['fill-in-blanks'], 14);

      expect(result).toHaveLength(14);
    });

    it('tracks modesPracticed correctly', () => {
      const now = Date.now();
      storage.addHistory({
        id: 'session-1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'fill-in-blanks',
      });
      storage.addHistory({
        id: 'session-2',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 7,
        accuracy: 70,
        mode: 'dictation',
      });

      const result = getFilteredTrend(['fill-in-blanks', 'dictation'], 7);

      const todayResult = result.find(d => {
        const today = new Date().toISOString().split('T')[0];
        return d.date === today;
      });

      expect(todayResult!.modesPracticed).toContain('fill-in-blanks');
      expect(todayResult!.modesPracticed).toContain('dictation');
      expect(todayResult!.modesPracticed).toHaveLength(2);
    });
  });

  describe('getDailyXP with modes', () => {
    it('includes modesPracticed in daily trend', () => {
      const now = Date.now();
      storage.addHistory({
        id: 'session-1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'fill-in-blanks',
      });
      storage.addHistory({
        id: 'session-2',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 7,
        accuracy: 70,
        mode: 'multiple-choice',
      });

      const result = getDailyXP(7);

      const todayResult = result.find(d => {
        const today = new Date().toISOString().split('T')[0];
        return d.date === today;
      });

      expect(todayResult).toBeDefined();
      expect(todayResult!.modesPracticed).toContain('fill-in-blanks');
      expect(todayResult!.modesPracticed).toContain('multiple-choice');
    });

    it('returns empty modesPracticed array for days with no history', () => {
      const result = getDailyXP(3);

      result.forEach(day => {
        expect(Array.isArray(day.modesPracticed)).toBe(true);
        expect(day.modesPracticed!.length).toBe(0);
      });
    });
  });
});