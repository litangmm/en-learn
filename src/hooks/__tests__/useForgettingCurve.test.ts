import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useForgettingCurve, useForgettingCurveForSentence } from '../useForgettingCurve';

// Mock storage
vi.mock('@/services/storage', () => ({
  storage: {
    getMistakes: vi.fn(),
  },
}));

import { storage } from '@/services/storage';

describe('useForgettingCurve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('empty state', () => {
    it('should return empty summary when no mistakes exist', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([]);

      const { result } = renderHook(() => useForgettingCurve());

      expect(result.current.totalTracked).toBe(0);
      expect(result.current.overdueCount).toBe(0);
      expect(result.current.dueSoonCount).toBe(0);
      expect(result.current.healthyCount).toBe(0);
      expect(result.current.averageRetention).toBe(0);
      expect(result.current.sortedByUrgency).toHaveLength(0);
    });
  });

  describe('single mistake', () => {
    it('should calculate retention for new item (never reviewed)', () => {
      const now = Date.now();
      const mistakes = [
        {
          sentenceId: 'test-sentence-1',
          dictionaryId: 'cet6',
          wrongAnswers: ['answer1'],
          correctAnswers: [],
          attempts: 1,
          timestamp: now - 86400000,
          reviewedCount: 0,
          // No nextReviewAt, no lastReviewedAt - new item
        },
      ];
      vi.mocked(storage.getMistakes).mockReturnValue(mistakes);

      const { result } = renderHook(() => useForgettingCurve());

      expect(result.current.totalTracked).toBe(1);
      expect(result.current.sortedByUrgency).toHaveLength(1);
      expect(result.current.sortedByUrgency[0].memoryRetentionScore).toBe(100);
      expect(result.current.sortedByUrgency[0].isOverdue).toBe(false);
    });

    it('should calculate retention for overdue item', () => {
      const now = Date.now();
      const pastReviewAt = now - 14 * 86400000; // 14 days ago
      const overdueNextReview = now - 3 * 86400000; // 3 days overdue
      const mistakes = [
        {
          sentenceId: 'test-sentence-1',
          dictionaryId: 'cet6',
          wrongAnswers: ['answer1'],
          correctAnswers: [],
          attempts: 3,
          timestamp: now - 86400000,
          reviewedCount: 3,
          nextReviewAt: overdueNextReview,
          lastReviewedAt: pastReviewAt,
          reviewHistory: [],
        },
      ];
      vi.mocked(storage.getMistakes).mockReturnValue(mistakes);

      const { result } = renderHook(() => useForgettingCurve());

      expect(result.current.totalTracked).toBe(1);
      expect(result.current.overdueCount).toBe(1);
      expect(result.current.sortedByUrgency[0].isOverdue).toBe(true);
      expect(result.current.sortedByUrgency[0].urgencyLevel).toBe(3);
    });

    it('should calculate retention for healthy item with good retention', () => {
      const now = Date.now();
      // Set lastReviewedAt to just now (or very recently) for high retention
      // retention = e^(-t/S), with S=1.25, for 80% retention: t ≈ 0.28 days ≈ 7 hours
      const recentReviewAt = now - 2 * 60 * 60 * 1000; // 2 hours ago
      const futureNextReview = now + 2 * 86400000; // 2 days from now
      const mistakes = [
        {
          sentenceId: 'test-sentence-1',
          dictionaryId: 'cet6',
          wrongAnswers: [],
          correctAnswers: ['answer1'],
          attempts: 5,
          timestamp: now - 86400000,
          reviewedCount: 5,
          nextReviewAt: futureNextReview,
          lastReviewedAt: recentReviewAt,
          reviewHistory: [],
        },
      ];
      vi.mocked(storage.getMistakes).mockReturnValue(mistakes);

      const { result } = renderHook(() => useForgettingCurve());

      expect(result.current.totalTracked).toBe(1);
      // With 2 hours since review, retention should be ~84%
      expect(result.current.sortedByUrgency[0].memoryRetentionScore).toBeGreaterThanOrEqual(80);
    });
  });

  describe('multiple mistakes', () => {
    it('should calculate correct urgency levels for different review states', () => {
      const now = Date.now();
      const mistakes: Array<{
        sentenceId: string;
        dictionaryId: string;
        wrongAnswers: string[];
        correctAnswers: string[];
        attempts: number;
        timestamp: number;
        reviewedCount: number;
        nextReviewAt: number | undefined;
        lastReviewedAt?: number;
      }> = [
        {
          sentenceId: 'healthy-item',
          dictionaryId: 'cet6',
          wrongAnswers: [],
          correctAnswers: [],
          attempts: 5,
          timestamp: now,
          reviewedCount: 5,
          nextReviewAt: now + 7 * 86400000, // 7 days from now
          lastReviewedAt: now - 86400000,
        },
        {
          sentenceId: 'overdue-item',
          dictionaryId: 'cet6',
          wrongAnswers: ['answer1'],
          correctAnswers: [],
          attempts: 2,
          timestamp: now - 86400000,
          reviewedCount: 2,
          nextReviewAt: now - 86400000, // 1 day overdue
          lastReviewedAt: now - 2 * 86400000,
        },
        {
          sentenceId: 'due-soon-item',
          dictionaryId: 'cet6',
          wrongAnswers: [],
          correctAnswers: [],
          attempts: 3,
          timestamp: now,
          reviewedCount: 3,
          nextReviewAt: now + 12 * 60 * 60 * 1000, // 12 hours from now
          lastReviewedAt: now - 2 * 86400000,
        },
      ];
      vi.mocked(storage.getMistakes).mockReturnValue(mistakes);

      const { result } = renderHook(() => useForgettingCurve());

      expect(result.current.totalTracked).toBe(3);
      expect(result.current.overdueCount).toBe(1);
      expect(result.current.dueSoonCount).toBe(1);
      // Verify each item has correct urgency level
      const overdue = result.current.sortedByUrgency.find(i => i.sentenceId === 'overdue-item');
      const dueSoon = result.current.sortedByUrgency.find(i => i.sentenceId === 'due-soon-item');
      const healthy = result.current.sortedByUrgency.find(i => i.sentenceId === 'healthy-item');
      expect(overdue).toBeDefined();
      expect(dueSoon).toBeDefined();
      expect(healthy).toBeDefined();
      // overdue should have highest urgency (3), due-soon medium (2), healthy low (1)
      expect(overdue?.urgencyLevel).toBeGreaterThanOrEqual(dueSoon?.urgencyLevel ?? 0);
      expect(dueSoon?.urgencyLevel).toBeGreaterThanOrEqual(healthy?.urgencyLevel ?? 0);
    });

    it('should calculate average retention across all items', () => {
      const now = Date.now();
      const mistakes = [
        {
          sentenceId: 'item-1',
          dictionaryId: 'cet6',
          wrongAnswers: [],
          correctAnswers: [],
          attempts: 1,
          timestamp: now,
          reviewedCount: 0,
        },
        {
          sentenceId: 'item-2',
          dictionaryId: 'cet6',
          wrongAnswers: ['answer1'],
          correctAnswers: [],
          attempts: 2,
          timestamp: now,
          reviewedCount: 2,
          nextReviewAt: now + 86400000,
          lastReviewedAt: now - 86400000,
        },
      ];
      vi.mocked(storage.getMistakes).mockReturnValue(mistakes);

      const { result } = renderHook(() => useForgettingCurve());

      expect(result.current.totalTracked).toBe(2);
      expect(result.current.averageRetention).toBeGreaterThan(0);
      expect(result.current.averageRetention).toBeLessThanOrEqual(100);
    });
  });

  describe('interval context', () => {
    it('should calculate correct interval based on review count', () => {
      const now = Date.now();
      const mistakes = [
        {
          sentenceId: 'item-1',
          dictionaryId: 'cet6',
          wrongAnswers: ['a'],
          correctAnswers: [],
          attempts: 1,
          timestamp: now,
          reviewedCount: 0, // Should be interval 1
          nextReviewAt: now + 86400000,
        },
        {
          sentenceId: 'item-2',
          dictionaryId: 'cet6',
          wrongAnswers: ['a'],
          correctAnswers: [],
          attempts: 2,
          timestamp: now,
          reviewedCount: 1, // Should be interval 3
          nextReviewAt: now + 3 * 86400000,
        },
        {
          sentenceId: 'item-3',
          dictionaryId: 'cet6',
          wrongAnswers: ['a'],
          correctAnswers: [],
          attempts: 5,
          timestamp: now,
          reviewedCount: 4, // Should be interval 14
          nextReviewAt: now + 14 * 86400000,
        },
      ];
      vi.mocked(storage.getMistakes).mockReturnValue(mistakes);

      const { result } = renderHook(() => useForgettingCurve());

      const item1 = result.current.sortedByUrgency.find((i) => i.sentenceId === 'item-1');
      const item2 = result.current.sortedByUrgency.find((i) => i.sentenceId === 'item-2');
      const item3 = result.current.sortedByUrgency.find((i) => i.sentenceId === 'item-3');

      expect(item1?.intervalContext.currentInterval).toBe(1);
      expect(item2?.intervalContext.currentInterval).toBe(3);
      expect(item3?.intervalContext.currentInterval).toBe(14);
    });
  });

  describe('review history data points', () => {
    it('should build data points from review history', () => {
      const now = Date.now();
      const baseTime = now - 10 * 86400000;
      const mistakes = [
        {
          sentenceId: 'item-1',
          dictionaryId: 'cet6',
          wrongAnswers: [],
          correctAnswers: [],
          attempts: 4,
          timestamp: now,
          reviewedCount: 3,
          lastReviewedAt: now,
          reviewHistory: [
            { timestamp: baseTime, isCorrect: true, interval: 1, nextReviewDate: baseTime + 86400000 },
            { timestamp: baseTime + 86400000, isCorrect: true, interval: 3, nextReviewDate: baseTime + 4 * 86400000 },
            { timestamp: baseTime + 4 * 86400000, isCorrect: false, interval: 1, nextReviewDate: baseTime + 5 * 86400000 },
          ],
        },
      ];
      vi.mocked(storage.getMistakes).mockReturnValue(mistakes);

      const { result } = renderHook(() => useForgettingCurve());

      const item = result.current.sortedByUrgency[0];
      expect(item.dataPoints).toHaveLength(3);
      expect(item.dataPoints[0].daysSinceReview).toBe(0);
    });
  });
});

describe('useForgettingCurveForSentence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null when sentence not found', () => {
    vi.mocked(storage.getMistakes).mockReturnValue([]);

    const { result } = renderHook(() => useForgettingCurveForSentence('non-existent'));

    expect(result.current).toBeNull();
  });

  it('should return curve data for existing sentence', () => {
    const now = Date.now();
    const mistakes = [
      {
        sentenceId: 'target-sentence',
        dictionaryId: 'cet6',
        wrongAnswers: ['wrong'],
        correctAnswers: [],
        attempts: 2,
        timestamp: now,
        reviewedCount: 2,
        nextReviewAt: now + 3 * 86400000,
        lastReviewedAt: now - 86400000,
        reviewHistory: [],
      },
    ];
    vi.mocked(storage.getMistakes).mockReturnValue(mistakes);

    const { result } = renderHook(() => useForgettingCurveForSentence('target-sentence'));

    expect(result.current).not.toBeNull();
    expect(result.current?.sentenceId).toBe('target-sentence');
    expect(result.current?.dictionaryId).toBe('cet6');
  });

  it('should include correct interval context', () => {
    const now = Date.now();
    const mistakes = [
      {
        sentenceId: 'target-sentence',
        dictionaryId: 'cet6',
        wrongAnswers: [],
        correctAnswers: [],
        attempts: 1,
        timestamp: now,
        reviewedCount: 1,
        nextReviewAt: now + 3 * 86400000,
      },
    ];
    vi.mocked(storage.getMistakes).mockReturnValue(mistakes);

    const { result } = renderHook(() => useForgettingCurveForSentence('target-sentence'));

    expect(result.current?.intervalContext.reviewCount).toBe(1);
    expect(result.current?.intervalContext.currentInterval).toBe(3);
  });
});