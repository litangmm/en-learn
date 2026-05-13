import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChurnMetrics, calculateConversionRate, getMetricsSummary, getTriggerTrend } from '../useChurnMetrics';
import type { ChurnMetrics, InterventionTrigger, InterventionResponseEvent } from '@/data/types';

// ============================================================================
// Test Mocks
// ============================================================================

// Mock storage
const mockGetChurnMetrics = vi.fn();
const mockUpdateChurnMetrics = vi.fn();

vi.mock('@/services/storage', () => ({
  storage: {
    getChurnMetrics: () => mockGetChurnMetrics(),
    updateChurnMetrics: (updater: (_prev: ChurnMetrics) => ChurnMetrics) => mockUpdateChurnMetrics(updater),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

function createMockMetrics(overrides: Partial<ChurnMetrics> = {}): ChurnMetrics {
  return {
    triggers: [],
    responses: [],
    sessions: [],
    lastUpdated: Date.now(),
    cumulativeConversionRate: 0,
    ...overrides,
  };
}

function createMockTrigger(id: string, daysAgo: number, level: string = 'medium'): InterventionTrigger {
  return {
    id,
    level: level as 'low' | 'medium' | 'high' | 'critical',
    action: 'banner',
    triggeredAt: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    riskLevel: 'medium',
    signalCount: 1,
  };
}

function createMockResponse(
  id: string,
  triggerId: string,
  daysAgo: number,
  response: 'accepted' | 'dismissed' | 'snoozed'
): InterventionResponseEvent {
  return {
    id,
    triggerId,
    response,
    respondedAt: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    durationMs: 5000,
    riskLevel: 'medium',
  };
}

// ============================================================================
// Pure Function Tests
// ============================================================================

describe('calculateConversionRate', () => {
  it('should return 0 when no triggers', () => {
    const result = calculateConversionRate([], []);
    expect(result).toBe(0);
  });

  it('should calculate correct conversion rate', () => {
    const triggers = [
      createMockTrigger('t1', 1),
      createMockTrigger('t2', 1),
      createMockTrigger('t3', 1),
    ];
    const responses = [
      createMockResponse('r1', 't1', 1, 'accepted'),
      createMockResponse('r2', 't2', 1, 'accepted'),
    ];
    const result = calculateConversionRate(triggers, responses);
    expect(result).toBe(0.67); // 2 accepted / 3 triggers
  });

  it('should round to 2 decimal places', () => {
    const triggers = [
      createMockTrigger('t1', 1),
      createMockTrigger('t2', 1),
      createMockTrigger('t3', 1),
      createMockTrigger('t4', 1),
      createMockTrigger('t5', 1),
    ];
    const responses = [
      createMockResponse('r1', 't1', 1, 'accepted'),
    ];
    const result = calculateConversionRate(triggers, responses);
    expect(result).toBe(0.2); // 1 / 5 = 0.2
  });
});

describe('getMetricsSummary', () => {
  it('should return zeros for empty metrics', () => {
    const metrics = createMockMetrics();
    const result = getMetricsSummary(metrics);

    expect(result.totalTriggers).toBe(0);
    expect(result.acceptedCount).toBe(0);
    expect(result.dismissedCount).toBe(0);
    expect(result.snoozedCount).toBe(0);
    expect(result.conversionRate).toBe(0);
    expect(result.recentTriggers).toBe(0);
    expect(result.recentResponses).toBe(0);
  });

  it('should count triggers and responses correctly', () => {
    const metrics = createMockMetrics({
      triggers: [
        createMockTrigger('t1', 1),
        createMockTrigger('t2', 5),
        createMockTrigger('t3', 10),  // 10 days ago, outside 7-day window
      ],
      responses: [
        createMockResponse('r1', 't1', 1, 'accepted'),
        createMockResponse('r2', 't2', 5, 'dismissed'),
        createMockResponse('r3', 't3', 10, 'snoozed'),
      ],
      cumulativeConversionRate: 0.33,
    });

    const result = getMetricsSummary(metrics);

    expect(result.totalTriggers).toBe(3);
    expect(result.acceptedCount).toBe(1);
    expect(result.dismissedCount).toBe(1);
    expect(result.snoozedCount).toBe(1);
    expect(result.conversionRate).toBe(0.33);
    expect(result.recentTriggers).toBe(2); // Only t1 (1 day) and t2 (5 days) within 7 days
  });
});

describe('getTriggerTrend', () => {
  it('should return 30 days of data', () => {
    const metrics = createMockMetrics({
      triggers: [
        createMockTrigger('t1', 0),  // today
        createMockTrigger('t2', 0),  // today (same day)
        createMockTrigger('t3', 15), // 15 days ago
        createMockTrigger('t4', 31), // 31 days ago (outside range)
      ],
    });

    const result = getTriggerTrend(metrics);

    expect(result).toHaveLength(30);
    // First entry (29 days ago) has 0 triggers
    expect(result[0].count).toBe(0);
    // Last entry (today) has 2 triggers
    expect(result[29].count).toBe(2);
  });

  it('should handle empty triggers', () => {
    const metrics = createMockMetrics();
    const result = getTriggerTrend(metrics);

    expect(result).toHaveLength(30);
    expect(result.every(d => d.count === 0)).toBe(true);
  });
});

// ============================================================================
// Hook Tests
// ============================================================================

describe('useChurnMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetChurnMetrics.mockReturnValue(createMockMetrics());
    mockUpdateChurnMetrics.mockImplementation((updater) => {
      const current = mockGetChurnMetrics();
      const updated = updater(current);
      mockGetChurnMetrics.mockReturnValue(updated);
      return updated;
    });
  });

  describe('metrics loading', () => {
    it('should load metrics from storage', () => {
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 1)],
        cumulativeConversionRate: 0.5,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);

      const { result } = renderHook(() => useChurnMetrics());

      expect(mockGetChurnMetrics).toHaveBeenCalled();
      expect(result.current.metrics).toEqual(mockMetrics);
    });

    it('should compute hasMetrics correctly', () => {
      mockGetChurnMetrics.mockReturnValue(createMockMetrics());
      const { result: emptyResult } = renderHook(() => useChurnMetrics());
      expect(emptyResult.current.hasMetrics).toBe(false);

      mockGetChurnMetrics.mockReturnValue(
        createMockMetrics({ triggers: [createMockTrigger('t1', 1)] })
      );
      const { result: withTriggers } = renderHook(() => useChurnMetrics());
      expect(withTriggers.current.hasMetrics).toBe(true);
    });
  });

  describe('trackTrigger', () => {
    it('should be a function', () => {
      const { result } = renderHook(() => useChurnMetrics());
      expect(typeof result.current.trackTrigger).toBe('function');
    });
  });

  describe('trackResponse', () => {
    it('should be a function', () => {
      const { result } = renderHook(() => useChurnMetrics());
      expect(typeof result.current.trackResponse).toBe('function');
    });
  });

  describe('trackSession', () => {
    it('should be a function', () => {
      const { result } = renderHook(() => useChurnMetrics());
      expect(typeof result.current.trackSession).toBe('function');
    });
  });

  describe('conversionRate', () => {
    it('should return cumulativeConversionRate from metrics', () => {
      const mockMetrics = createMockMetrics({ cumulativeConversionRate: 0.75 });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);

      const { result } = renderHook(() => useChurnMetrics());

      expect(result.current.conversionRate).toBe(0.75);
    });
  });
});