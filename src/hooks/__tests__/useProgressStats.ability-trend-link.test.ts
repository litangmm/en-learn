import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getModeAccuracy, getFilteredTrend, ALL_MODES } from '../useProgressStats';
import { storage } from '@/services/storage';

/**
 * Tests for cross-mode trend filtering behavior.
 *
 * These tests verify that getFilteredTrend correctly:
 * - Filters trend data by selected mode(s) from radar chart
 * - Aggregates data from multiple modes when multiple are selected
 * - Correctly marks hasActivity flag for days with/without matching mode activity
 *
 * Related to epic-069 iter-002: Ability radar and trend line chart deep integration.
 */
describe('useProgressStats ability-trend-link tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getModeAccuracy integration with getFilteredTrend', () => {
    it('getModeAccuracy returns mode data that drives radar selection', () => {
      // Set up mode-specific stats
      storage.updateModeStats('fill-in-blanks', 20, 18); // 90%
      storage.updateModeStats('multiple-choice', 30, 21); // 70%
      storage.updateModeStats('dictation', 10, 5); // 50%
      storage.updateModeStats('sentence-reorder', 40, 36); // 90%

      const modeData = getModeAccuracy();

      // All 4 modes should be present
      expect(modeData).toHaveLength(4);
      expect(modeData.map(r => r.mode)).toEqual(ALL_MODES);

      // Each mode should have valid accuracy
      modeData.forEach(modeStats => {
        expect(modeStats.accuracy).toBeGreaterThanOrEqual(0);
        expect(modeStats.accuracy).toBeLessThanOrEqual(100);
      });
    });

    it('single mode selected in radar maps directly to getFilteredTrend filter', () => {
      const now = Date.now();

      // Add sessions for different modes across days
      storage.addHistory({
        id: 'session-fill-blanks',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 9,
        accuracy: 90,
        mode: 'fill-in-blanks',
      });
      storage.addHistory({
        id: 'session-mc',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 50,
        totalQuestions: 10,
        correctCount: 5,
        accuracy: 50,
        mode: 'multiple-choice',
      });
      storage.addHistory({
        id: 'session-dict',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'dictation',
      });

      // When radar clicks "fill-in-blanks" mode → getFilteredTrend(['fill-in-blanks'])
      const radarSelectedMode = 'fill-in-blanks';
      const trendData = getFilteredTrend([radarSelectedMode], 7);

      const todayResult = trendData.find(d => {
        const today = new Date().toISOString().split('T')[0];
        return d.date === today;
      });

      expect(todayResult).toBeDefined();
      // Only fill-in-blanks XP (100), not MC (50) or dictation (80)
      expect(todayResult!.xp).toBe(100);
      expect(todayResult!.questions).toBe(10);
      expect(todayResult!.modesPracticed).toContain('fill-in-blanks');
      expect(todayResult!.modesPracticed).not.toContain('multiple-choice');
      expect(todayResult!.modesPracticed).not.toContain('dictation');
      expect(todayResult!.hasActivity).toBe(true);
    });

    it('getFilteredTrend for each mode from radar returns different data', () => {
      const now = Date.now();

      storage.addHistory({
        id: 'session-fill',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 9,
        accuracy: 90,
        mode: 'fill-in-blanks',
      });
      storage.addHistory({
        id: 'session-mc',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 50,
        totalQuestions: 10,
        correctCount: 5,
        accuracy: 50,
        mode: 'multiple-choice',
      });
      storage.addHistory({
        id: 'session-reorder',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'sentence-reorder',
      });

      const todayStr = new Date(now).toISOString().split('T')[0];

      // Each mode filter should return different XP totals
      const fillInTrend = getFilteredTrend(['fill-in-blanks'], 7);
      const mcTrend = getFilteredTrend(['multiple-choice'], 7);
      const reorderTrend = getFilteredTrend(['sentence-reorder'], 7);

      const fillToday = fillInTrend.find(d => d.date === todayStr)!;
      const mcToday = mcTrend.find(d => d.date === todayStr)!;
      const reorderToday = reorderTrend.find(d => d.date === todayStr)!;

      expect(fillToday.xp).toBe(100);
      expect(mcToday.xp).toBe(50);
      expect(reorderToday.xp).toBe(80);

      // All should have activity since all were practiced today
      expect(fillToday.hasActivity).toBe(true);
      expect(mcToday.hasActivity).toBe(true);
      expect(reorderToday.hasActivity).toBe(true);
    });

    it('multi-mode selection aggregates data from all selected modes', () => {
      const now = Date.now();

      // Sessions for different modes on the same day
      storage.addHistory({
        id: 'session-fill',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 9,
        accuracy: 90,
        mode: 'fill-in-blanks',
      });
      storage.addHistory({
        id: 'session-dict',
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
      // Multiple sessions for sentence-reorder
      storage.addHistory({
        id: 'session-reorder1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 40,
        totalQuestions: 10,
        correctCount: 4,
        accuracy: 40,
        mode: 'sentence-reorder',
      });
      storage.addHistory({
        id: 'session-reorder2',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 30,
        totalQuestions: 10,
        correctCount: 3,
        accuracy: 30,
        mode: 'sentence-reorder',
      });

      // When user selects 2+ modes on radar (e.g., fill-in-blanks + dictation)
      const selectedModes = ['fill-in-blanks', 'dictation'] as const;
      const trendData = getFilteredTrend([...selectedModes], 7);

      const todayResult = trendData.find(d => {
        const today = new Date().toISOString().split('T')[0];
        return d.date === today;
      });

      expect(todayResult).toBeDefined();
      // Aggregated XP: fill-in-blanks (100) + dictation (60) = 160
      expect(todayResult!.xp).toBe(160);
      // Aggregated questions: 10 + 10 = 20
      expect(todayResult!.questions).toBe(20);
      // Both modes practiced
      expect(todayResult!.modesPracticed).toContain('fill-in-blanks');
      expect(todayResult!.modesPracticed).toContain('dictation');
      expect(todayResult!.hasActivity).toBe(true);
    });
  });

  describe('hasActivity flag for trend tooltip display', () => {
    it('hasActivity is true for days with selected mode activity', () => {
      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      // fill-in-blanks practiced 3 days ago
      storage.addHistory({
        id: 'session-3d-ago',
        timestamp: threeDaysAgo,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 9,
        accuracy: 90,
        mode: 'fill-in-blanks',
      });

      // fill-in-blanks practiced 2 days ago
      storage.addHistory({
        id: 'session-2d-ago',
        timestamp: twoDaysAgo,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'fill-in-blanks',
      });

      // Today: only multiple-choice (not fill-in-blanks)
      storage.addHistory({
        id: 'session-today',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 50,
        totalQuestions: 10,
        correctCount: 5,
        accuracy: 50,
        mode: 'multiple-choice',
      });

      const result = getFilteredTrend(['fill-in-blanks'], 7);
      const todayStr = new Date(now).toISOString().split('T')[0];
      const twoDaysAgoStr = new Date(twoDaysAgo).toISOString().split('T')[0];
      const threeDaysAgoStr = new Date(threeDaysAgo).toISOString().split('T')[0];

      const todayData = result.find(d => d.date === todayStr)!;
      const twoDaysAgoData = result.find(d => d.date === twoDaysAgoStr)!;
      const threeDaysAgoData = result.find(d => d.date === threeDaysAgoStr)!;

      // Today: fill-in-blanks not practiced → no activity
      expect(todayData.hasActivity).toBe(false);
      expect(todayData.xp).toBe(0);
      expect(todayData.questions).toBe(0);

      // 2 days ago: fill-in-blanks practiced → has activity
      expect(twoDaysAgoData.hasActivity).toBe(true);
      expect(twoDaysAgoData.xp).toBe(80);

      // 3 days ago: fill-in-blanks practiced → has activity
      expect(threeDaysAgoData.hasActivity).toBe(true);
      expect(threeDaysAgoData.xp).toBe(100);
    });

    it('hasActivity correctly marks days with partial mode activity in multi-mode filter', () => {
      const now = Date.now();

      // Today: only fill-in-blanks practiced (out of the 2 selected modes)
      storage.addHistory({
        id: 'session-fill-today',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 9,
        accuracy: 90,
        mode: 'fill-in-blanks',
      });
      // dictation NOT practiced today

      const todayStr = new Date(now).toISOString().split('T')[0];
      const result = getFilteredTrend(['fill-in-blanks', 'dictation'], 7);
      const todayData = result.find(d => d.date === todayStr)!;

      // Even though only one of the two selected modes was practiced,
      // hasActivity should still be true (at least one mode was active)
      expect(todayData.hasActivity).toBe(true);
      expect(todayData.modesPracticed).toContain('fill-in-blanks');
      expect(todayData.modesPracticed).not.toContain('dictation');
      expect(todayData.xp).toBe(100); // Only fill-in-blanks XP
    });

    it('all days without selected mode activity show hasActivity=false', () => {
      // No history at all → all days should show no activity for any mode
      const result = getFilteredTrend(['fill-in-blanks'], 7);

      result.forEach(day => {
        expect(day.hasActivity).toBe(false);
        expect(day.xp).toBe(0);
        expect(day.questions).toBe(0);
        expect(day.modesPracticed).toHaveLength(0);
      });
    });

    it('hasActivity with no mode filter (empty array) shows activity for any mode', () => {
      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      // 2 days ago: multiple-choice practiced
      storage.addHistory({
        id: 'session-2d',
        timestamp: twoDaysAgo,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 50,
        totalQuestions: 10,
        correctCount: 5,
        accuracy: 50,
        mode: 'multiple-choice',
      });

      // Today: no history
      const todayStr = new Date(now).toISOString().split('T')[0];
      const twoDaysAgoStr = new Date(twoDaysAgo).toISOString().split('T')[0];

      // Empty array = no filter = show all modes
      const result = getFilteredTrend([], 7);
      const todayData = result.find(d => d.date === todayStr)!;
      const twoDaysAgoData = result.find(d => d.date === twoDaysAgoStr)!;

      // Today: no activity
      expect(todayData.hasActivity).toBe(false);
      expect(todayData.xp).toBe(0);

      // 2 days ago: has activity (multiple-choice was practiced)
      expect(twoDaysAgoData.hasActivity).toBe(true);
      expect(twoDaysAgoData.xp).toBe(50);
    });
  });

  describe('trend data shape for ability-radar integration', () => {
    it('returns correct data shape for ProgressTrend component', () => {
      const now = Date.now();

      storage.addHistory({
        id: 'session-1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 9,
        accuracy: 90,
        mode: 'fill-in-blanks',
      });

      const result = getFilteredTrend(['fill-in-blanks'], 7);

      result.forEach(day => {
        // Must have all required fields for FilteredTrend type
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('dayName');
        expect(day).toHaveProperty('xp');
        expect(day).toHaveProperty('questions');
        expect(day).toHaveProperty('accuracy');
        expect(day).toHaveProperty('modesPracticed');
        expect(day).toHaveProperty('hasActivity');

        // Date format should be YYYY-MM-DD
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // dayName should be a valid Chinese day name
        expect(day.dayName).toMatch(/^[周日月火水木金]/);

        // modesPracticed should always be an array
        expect(Array.isArray(day.modesPracticed)).toBe(true);

        // hasActivity should be a boolean
        expect(typeof day.hasActivity).toBe('boolean');
      });
    });

    it('returns data ordered from oldest to newest for chart rendering', () => {
      const result = getFilteredTrend(['fill-in-blanks'], 7);

      expect(result).toHaveLength(7);

      for (let i = 1; i < result.length; i++) {
        const prevDate = new Date(result[i - 1].date);
        const currDate = new Date(result[i].date);
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
      }
    });

    it('handles 14-day range for longer trend view', () => {
      const result = getFilteredTrend(['fill-in-blanks'], 14);
      expect(result).toHaveLength(14);

      // First should be oldest, last should be newest
      const firstDate = new Date(result[0].date);
      const lastDate = new Date(result[result.length - 1].date);
      expect(lastDate.getTime()).toBeGreaterThan(firstDate.getTime());
    });

    it('handles 30-day range for extended trend view', () => {
      const result = getFilteredTrend(['fill-in-blanks'], 30);
      expect(result).toHaveLength(30);

      const firstDate = new Date(result[0].date);
      const lastDate = new Date(result[result.length - 1].date);
      expect(lastDate.getTime()).toBeGreaterThan(firstDate.getTime());
    });
  });

  describe('edge cases for mode filtering', () => {
    it('filters out entries without a mode field when mode filter is active', () => {
      const now = Date.now();

      // Entry WITH mode field
      storage.addHistory({
        id: 'session-with-mode',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 9,
        accuracy: 90,
        mode: 'fill-in-blanks',
      });

      // Entry WITHOUT mode field (legacy data)
      storage.addHistory({
        id: 'session-without-mode',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 200,
        totalQuestions: 20,
        correctCount: 18,
        accuracy: 90,
        // No mode field
      });

      const todayStr = new Date(now).toISOString().split('T')[0];
      const result = getFilteredTrend(['fill-in-blanks'], 7);
      const todayData = result.find(d => d.date === todayStr)!;

      // Should only include fill-in-blanks entry, not the legacy entry
      expect(todayData.xp).toBe(100);
      expect(todayData.questions).toBe(10);
      expect(todayData.modesPracticed).toEqual(['fill-in-blanks']);
    });

    it('handles mixed mode data across multiple days correctly', () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      // Day 1: fill-in-blanks
      storage.addHistory({
        id: 'session-d1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 9,
        accuracy: 90,
        mode: 'fill-in-blanks',
      });

      // Day 2: multiple-choice
      storage.addHistory({
        id: 'session-d2',
        timestamp: now - oneDayMs,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 50,
        totalQuestions: 10,
        correctCount: 5,
        accuracy: 50,
        mode: 'multiple-choice',
      });

      // Day 3: dictation
      storage.addHistory({
        id: 'session-d3',
        timestamp: now - 2 * oneDayMs,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'dictation',
      });

      const todayStr = new Date(now).toISOString().split('T')[0];
      const yesterdayStr = new Date(now - oneDayMs).toISOString().split('T')[0];
      const twoDaysAgoStr = new Date(now - 2 * oneDayMs).toISOString().split('T')[0];

      // Filter for fill-in-blanks only
      const result = getFilteredTrend(['fill-in-blanks'], 7);
      const todayData = result.find(d => d.date === todayStr)!;
      const yesterdayData = result.find(d => d.date === yesterdayStr)!;
      const twoDaysAgoData = result.find(d => d.date === twoDaysAgoStr)!;

      expect(todayData.hasActivity).toBe(true);
      expect(todayData.xp).toBe(100);
      expect(todayData.modesPracticed).toEqual(['fill-in-blanks']);

      expect(yesterdayData.hasActivity).toBe(false);
      expect(yesterdayData.xp).toBe(0);
      expect(yesterdayData.modesPracticed).toHaveLength(0);

      expect(twoDaysAgoData.hasActivity).toBe(false);
      expect(twoDaysAgoData.xp).toBe(0);
      expect(twoDaysAgoData.modesPracticed).toHaveLength(0);
    });

    it('accuracy calculation is correct for mode-filtered data', () => {
      const now = Date.now();

      // Multiple sessions for the same mode on same day
      storage.addHistory({
        id: 'session-1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 60,
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
        score: 40,
        totalQuestions: 10,
        correctCount: 6,
        accuracy: 60,
        mode: 'fill-in-blanks',
      });

      const todayStr = new Date(now).toISOString().split('T')[0];
      const result = getFilteredTrend(['fill-in-blanks'], 7);
      const todayData = result.find(d => d.date === todayStr)!;

      // Total: 20 questions, 14 correct → 70%
      expect(todayData.questions).toBe(20);
      expect(todayData.xp).toBe(100); // 60 + 40
      expect(todayData.accuracy).toBe(70);
      expect(todayData.hasActivity).toBe(true);
    });
  });
});