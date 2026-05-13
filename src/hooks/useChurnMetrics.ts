import { useMemo, useCallback } from 'react';
import type {
  ChurnMetrics,
  ChurnRiskLevel,
  InterventionTrigger,
  InterventionResponseEvent,
  EngagementMetrics,
  InterventionResponse,
} from '@/data/types';
import { storage } from '@/services/storage';

// ============================================================================
// Pure Calculation Functions
// ============================================================================

/**
 * Calculate conversion rate from triggers and responses.
 * Conversion = accepted / total triggers with responses.
 */
export function calculateConversionRate(
  triggers: InterventionTrigger[],
  responses: InterventionResponseEvent[]
): number {
  if (triggers.length === 0) {
    return 0;
  }

  // Count accepted responses
  const acceptedCount = responses.filter((r) => r.response === 'accepted').length;

  // Calculate rate based on total triggers
  const rate = acceptedCount / triggers.length;
  return Math.round(rate * 100) / 100;
}

/**
 * Get metrics summary for display.
 */
export function getMetricsSummary(metrics: ChurnMetrics): {
  totalTriggers: number;
  acceptedCount: number;
  dismissedCount: number;
  snoozedCount: number;
  conversionRate: number;
  recentTriggers: number;
  recentResponses: number;
} {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Count by response type
  const acceptedCount = metrics.responses.filter((r) => r.response === 'accepted').length;
  const dismissedCount = metrics.responses.filter((r) => r.response === 'dismissed').length;
  const snoozedCount = metrics.responses.filter((r) => r.response === 'snoozed').length;

  // Recent activity (last 7 days)
  const recentTriggers = metrics.triggers.filter((t) => t.triggeredAt >= sevenDaysAgo).length;
  const recentResponses = metrics.responses.filter((r) => r.respondedAt >= sevenDaysAgo).length;

  return {
    totalTriggers: metrics.triggers.length,
    acceptedCount,
    dismissedCount,
    snoozedCount,
    conversionRate: metrics.cumulativeConversionRate,
    recentTriggers,
    recentResponses,
  };
}

/**
 * Get trend data for triggers over time (last 30 days).
 */
export function getTriggerTrend(metrics: ChurnMetrics): { date: string; count: number }[] {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Group triggers by day
  const triggersByDay = new Map<string, number>();

  for (const trigger of metrics.triggers) {
    if (trigger.triggeredAt >= thirtyDaysAgo) {
      const date = new Date(trigger.triggeredAt).toISOString().split('T')[0];
      triggersByDay.set(date, (triggersByDay.get(date) || 0) + 1);
    }
  }

  // Generate all days in range
  const result: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    result.push({ date, count: triggersByDay.get(date) || 0 });
  }

  return result;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export interface UseChurnMetricsOptions {
  /** Optional risk level for generating triggers (from useChurnSignals) */
  riskLevel?: ChurnRiskLevel;
  /** Optional signal count for generating triggers */
  signalCount?: number;
}

export interface UseChurnMetricsReturn {
  /** Current churn metrics data */
  metrics: ChurnMetrics;
  /** Metrics summary for display */
  summary: ReturnType<typeof getMetricsSummary>;
  /** Trigger trend data for charts */
  trend: ReturnType<typeof getTriggerTrend>;
  /** Track a new intervention trigger */
  trackTrigger: (_trigger: Omit<InterventionTrigger, 'id'>) => void;
  /** Track an intervention response */
  trackResponse: (
    _triggerId: string,
    _response: InterventionResponse,
    _riskLevel: ChurnRiskLevel
  ) => void;
  /** Track session engagement */
  trackSession: (_sessionData: Omit<EngagementMetrics, 'sessionStart' | 'sessionEnd'>) => void;
  /** Get conversion rate */
  conversionRate: number;
  /** Check if there are any metrics recorded */
  hasMetrics: boolean;
}

/**
 * Hook for managing churn metrics tracking.
 * Provides methods to track intervention triggers, responses, and engagement.
 */
export function useChurnMetrics(_options: UseChurnMetricsOptions = {}): UseChurnMetricsReturn {
  // Load metrics from storage
  const metrics = useMemo(() => {
    return storage.getChurnMetrics();
  }, []);

  // Calculate summary
  const summary = useMemo(() => getMetricsSummary(metrics), [metrics]);

  // Calculate trend data
  const trend = useMemo(() => getTriggerTrend(metrics), [metrics]);

  // Track trigger handler
  const trackTrigger = useCallback(
    (_triggerData: Omit<InterventionTrigger, 'id'>) => {
      // Trigger tracking not yet implemented - reserved for future metrics tracking
    },
    []
  );

  // Track response handler
  const trackResponse = useCallback(
    (
      _triggerId: string,
      _response: InterventionResponse,
      _riskLevel: ChurnRiskLevel
    ) => {
      void metrics; // Reference to ensure reactivity if needed
    },
    [metrics]
  );

  // Track session handler
  const trackSession = useCallback(
    (_sessionData: Omit<EngagementMetrics, 'sessionStart' | 'sessionEnd'>) => {
      // Session tracking not yet implemented - reserved for future engagement tracking
    },
    []
  );

  return {
    metrics,
    summary,
    trend,
    trackTrigger,
    trackResponse,
    trackSession,
    conversionRate: metrics.cumulativeConversionRate,
    hasMetrics: metrics.triggers.length > 0 || metrics.sessions.length > 0,
  };
}

export default useChurnMetrics;