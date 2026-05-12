import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTimeOfDayAnalysis, getTimePeriodId } from '../useTimeOfDayAnalysis';

// Mock storage
const mockGetHistory = vi.fn();
vi.mock('@/services/storage', () => ({
  storage: {
    getHistory: () => mockGetHistory(),
  },
}));

describe('useTimeOfDayAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTimePeriodId', () => {
    it('should return correct period for each hour', () => {
      expect(getTimePeriodId(0)).toBe('dawn');
      expect(getTimePeriodId(3)).toBe('dawn');
      expect(getTimePeriodId(5)).toBe('dawn');

      expect(getTimePeriodId(6)).toBe('morning');
      expect(getTimePeriodId(8)).toBe('morning');

      expect(getTimePeriodId(9)).toBe('late_morning');
      expect(getTimePeriodId(11)).toBe('late_morning');

      expect(getTimePeriodId(12)).toBe('noon');
      expect(getTimePeriodId(13)).toBe('noon');

      expect(getTimePeriodId(14)).toBe('afternoon');
      expect(getTimePeriodId(17)).toBe('afternoon');

      expect(getTimePeriodId(18)).toBe('evening');
      expect(getTimePeriodId(19)).toBe('evening');

      expect(getTimePeriodId(20)).toBe('night');
      expect(getTimePeriodId(22)).toBe('night');

      expect(getTimePeriodId(23)).toBe('late_night');
    });
  });

  describe('useTimeOfDayAnalysis hook', () => {
    it('should return empty result when no history', () => {
      mockGetHistory.mockReturnValue([]);

      const { result } = renderHook(() => useTimeOfDayAnalysis());

      expect(result.current.periodMetrics).toHaveLength(0);
      expect(result.current.bestPeriod).toBeNull();
      expect(result.current.worstPeriod).toBeNull();
      expect(result.current.totalSessions).toBe(0);
      expect(result.current.hasEnoughData).toBe(false);
      expect(result.current.recommendation).toContain('开始学习后');
    });

    it('should analyze sessions by time period', () => {
      // Create sessions at different times
      const now = new Date();
      const sessions = [
        // Morning session (8 AM)
        {
          id: '1',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0).getTime(),
          duration: 300,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 100,
          totalQuestions: 10,
          correctCount: 8,
          accuracy: 80,
        },
        // Another morning session (8:30 AM)
        {
          id: '2',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30).getTime(),
          duration: 600,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 100,
          totalQuestions: 20,
          correctCount: 18,
          accuracy: 90,
        },
        // Evening session (7 PM)
        {
          id: '3',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0).getTime(),
          duration: 400,
          dictionaryId: 'ielts',
          dictionaryName: 'IELTS',
          score: 80,
          totalQuestions: 15,
          correctCount: 9,
          accuracy: 60,
        },
      ];
      mockGetHistory.mockReturnValue(sessions);

      const { result } = renderHook(() => useTimeOfDayAnalysis());

      expect(result.current.periodMetrics).toHaveLength(2);

      const morningMetrics = result.current.periodMetrics.find(
        (m) => m.periodId === 'morning'
      );
      expect(morningMetrics).toBeDefined();
      expect(morningMetrics?.sessionCount).toBe(2);
      expect(morningMetrics?.totalQuestions).toBe(30);
      expect(morningMetrics?.correctAnswers).toBe(26);
      expect(morningMetrics?.averageAccuracy).toBe(87); // (26/30)*100 rounded

      const eveningMetrics = result.current.periodMetrics.find(
        (m) => m.periodId === 'evening'
      );
      expect(eveningMetrics).toBeDefined();
      expect(eveningMetrics?.sessionCount).toBe(1);
      expect(eveningMetrics?.averageAccuracy).toBe(60);
    });

    it('should identify best period correctly', () => {
      const now = new Date();
      // Need at least 2 sessions in a period to be considered "enough data"
      const sessions = [
        // Morning - high accuracy (2 sessions for enough data)
        {
          id: '1',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0).getTime(),
          duration: 300,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 100,
          totalQuestions: 10,
          correctCount: 9,
          accuracy: 90,
        },
        {
          id: '1b',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30).getTime(),
          duration: 300,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 100,
          totalQuestions: 10,
          correctCount: 9,
          accuracy: 90,
        },
        // Night - lower accuracy (2 sessions for enough data)
        {
          id: '2',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0).getTime(),
          duration: 300,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 70,
          totalQuestions: 10,
          correctCount: 6,
          accuracy: 60,
        },
        {
          id: '2b',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0).getTime(),
          duration: 300,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 70,
          totalQuestions: 10,
          correctCount: 6,
          accuracy: 60,
        },
      ];
      mockGetHistory.mockReturnValue(sessions);

      const { result } = renderHook(() => useTimeOfDayAnalysis());

      expect(result.current.bestPeriod?.periodId).toBe('morning');
      expect(result.current.worstPeriod?.periodId).toBe('night');
    });

    it('should have enough data when sessions >= 5', () => {
      const now = new Date();
      const sessions = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8 + i, 0).getTime(),
        duration: 300,
        dictionaryId: 'toefl',
        dictionaryName: 'TOEFL',
        score: 80,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
      }));
      mockGetHistory.mockReturnValue(sessions);

      const { result } = renderHook(() => useTimeOfDayAnalysis());

      expect(result.current.hasEnoughData).toBe(true);
    });

    it('should not have enough data when sessions < 5', () => {
      const now = new Date();
      const sessions = Array.from({ length: 3 }, (_, i) => ({
        id: `${i}`,
        timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8 + i, 0).getTime(),
        duration: 300,
        dictionaryId: 'toefl',
        dictionaryName: 'TOEFL',
        score: 80,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
      }));
      mockGetHistory.mockReturnValue(sessions);

      const { result } = renderHook(() => useTimeOfDayAnalysis());

      expect(result.current.hasEnoughData).toBe(false);
    });

    it('should generate appropriate recommendations', () => {
      const now = new Date();

      // Test case: few sessions
      mockGetHistory.mockReturnValue([]);
      const { result: result1 } = renderHook(() => useTimeOfDayAnalysis());
      expect(result1.current.recommendation).toContain('开始学习后');

      // Test case: accumulating data
      mockGetHistory.mockReturnValue([
        {
          id: '1',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0).getTime(),
          duration: 300,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 80,
          totalQuestions: 10,
          correctCount: 5,
          accuracy: 50,
        },
      ]);
      const { result: result2 } = renderHook(() => useTimeOfDayAnalysis());
      expect(result2.current.recommendation).toContain('数据积累中');
    });

    it('should calculate total duration correctly', () => {
      const now = new Date();
      const sessions = [
        {
          id: '1',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0).getTime(),
          duration: 300,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 100,
          totalQuestions: 10,
          correctCount: 8,
          accuracy: 80,
        },
        {
          id: '2',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).getTime(),
          duration: 600,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 100,
          totalQuestions: 20,
          correctCount: 16,
          accuracy: 80,
        },
      ];
      mockGetHistory.mockReturnValue(sessions);

      const { result } = renderHook(() => useTimeOfDayAnalysis());

      expect(result.current.totalDuration).toBe(900); // 300 + 600
    });

    it('should identify peak hour correctly', () => {
      const now = new Date();
      const sessions = [
        // Multiple sessions at 8 AM
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `morning-${i}`,
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0).getTime(),
          duration: 300,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 80,
          totalQuestions: 10,
          correctCount: 8,
          accuracy: 80,
        })),
        // Two sessions at 9 AM
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `late-morning-${i}`,
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).getTime(),
          duration: 300,
          dictionaryId: 'toefl',
          dictionaryName: 'TOEFL',
          score: 80,
          totalQuestions: 10,
          correctCount: 8,
          accuracy: 80,
        })),
      ];
      mockGetHistory.mockReturnValue(sessions);

      const { result } = renderHook(() => useTimeOfDayAnalysis());

      const morningMetrics = result.current.periodMetrics.find(
        (m) => m.periodId === 'morning'
      );
      expect(morningMetrics?.peakHour).toBe(8);

      const lateMorningMetrics = result.current.periodMetrics.find(
        (m) => m.periodId === 'late_morning'
      );
      expect(lateMorningMetrics?.peakHour).toBe(9);
    });
  });
});
