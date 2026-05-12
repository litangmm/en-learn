import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getThisWeekReport, getWeeklyStats, getWeekStart, getWeekEnd } from '../useProgressStats';
import { storage } from '@/services/storage';

vi.mock('@/services/storage', () => ({
  storage: {
    getHistory: vi.fn(),
    getXPProfile: vi.fn(),
    getBadgeProgress: vi.fn(),
  },
}));

describe('useProgressStats - Weekly Report Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWeekStart', () => {
    it('returns Monday as start of week', () => {
      // Create a date known to be a Monday (May 4, 2026)
      const monday = new Date(2026, 4, 4);
      const weekStart = getWeekStart(monday);
      expect(weekStart.getDay()).toBe(1); // Monday = 1
    });

    it('returns same date for Monday input', () => {
      const monday = new Date(2026, 4, 4);
      const weekStart = getWeekStart(monday);
      expect(weekStart.getDate()).toBe(4);
    });

    it('returns previous Monday for Sunday input', () => {
      const sunday = new Date(2026, 4, 10);
      const weekStart = getWeekStart(sunday);
      expect(weekStart.getDate()).toBe(4); // Previous Monday
    });
  });

  describe('getWeekEnd', () => {
    it('returns Sunday as end of week', () => {
      const monday = new Date(2026, 4, 4);
      const weekEnd = getWeekEnd(monday);
      expect(weekEnd.getDay()).toBe(0); // Sunday = 0
    });

    it('returns date 6 days after week start', () => {
      const monday = new Date(2026, 4, 4);
      const weekEnd = getWeekEnd(monday);
      expect(weekEnd.getDate()).toBe(10);
    });
  });

  describe('getWeeklyStats', () => {
    it('returns zero stats for week with no history', () => {
      vi.mocked(storage.getHistory).mockReturnValue([]);

      const weekStart = new Date(2026, 4, 4);
      const report = getWeeklyStats(weekStart);

      expect(report.xpEarned).toBe(0);
      expect(report.questionsAnswered).toBe(0);
      expect(report.correctAnswers).toBe(0);
      expect(report.learningDays).toBe(0);
      expect(report.sessionsCompleted).toBe(0);
      expect(report.accuracy).toBe(0);
    });

    it('aggregates history entries for the week', () => {
      const weekStart = new Date(2026, 4, 4);
      const entries = [
        { id: '1', timestamp: new Date(2026, 4, 4).getTime(), duration: 300, dictionaryId: 'junior', dictionaryName: '初中', score: 100, totalQuestions: 10, correctCount: 8, accuracy: 80 },
        { id: '2', timestamp: new Date(2026, 4, 5).getTime(), duration: 400, dictionaryId: 'junior', dictionaryName: '初中', score: 150, totalQuestions: 15, correctCount: 12, accuracy: 80 },
        { id: '3', timestamp: new Date(2026, 4, 10).getTime(), duration: 350, dictionaryId: 'senior', dictionaryName: '高中', score: 80, totalQuestions: 8, correctCount: 6, accuracy: 75 },
      ];
      vi.mocked(storage.getHistory).mockReturnValue(entries);

      const report = getWeeklyStats(weekStart);

      expect(report.xpEarned).toBe(330);
      expect(report.questionsAnswered).toBe(33);
      expect(report.correctAnswers).toBe(26);
      expect(report.sessionsCompleted).toBe(3);
      expect(report.accuracy).toBe(79);
      expect(report.learningDays).toBe(3);
    });

    it('calculates comparison with previous week', () => {
      const weekStart = new Date(2026, 4, 4);
      const currentWeekEntries = [
        { id: '1', timestamp: new Date(2026, 4, 5).getTime(), duration: 300, dictionaryId: 'junior', dictionaryName: '初中', score: 200, totalQuestions: 20, correctCount: 16, accuracy: 80 },
      ];
      vi.mocked(storage.getHistory).mockReturnValue(currentWeekEntries);

      const report = getWeeklyStats(weekStart);

      expect(report.comparison).toBeDefined();
      expect(report.comparison?.xpChange).toBeGreaterThan(0);
    });
  });

  describe('getThisWeekReport', () => {
    it('returns report for current week', () => {
      vi.mocked(storage.getHistory).mockReturnValue([]);

      const report = getThisWeekReport();

      const today = new Date();
      const weekStart = getWeekStart(today);
      const weekEnd = getWeekEnd(today);

      expect(report.weekStart).toBe(weekStart.toISOString().split('T')[0]);
      expect(report.weekEnd).toBe(weekEnd.toISOString().split('T')[0]);
    });
  });
});