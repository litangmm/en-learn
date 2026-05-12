import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from '@/services/storage';
import { getWeeklyStats, getWeekStart } from './useProgressStats';
import type { WeeklyReport } from '@/data/types';

export interface UseWeeklyReportReturn {
  /** Current weekly report data */
  report: WeeklyReport | null;
  /** Whether report should be shown */
  shouldShow: boolean;
  /** Dismiss the report */
  dismiss: () => void;
  /** Mark report as shown */
  markShown: () => void;
  /** Check and refresh report data */
  refresh: () => void;
}

/**
 * Hook for managing weekly report display logic.
 * Checks if the report should be shown based on:
 * 1. First-time user (no history)
 * 2. New week since last shown
 * 3. Previously dismissed
 */
export function useWeeklyReport(): UseWeeklyReportReturn {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const checkedRef = useRef(false);

  /**
   * Calculate and set the report for the current week
   */
  const calculateReport = useCallback(() => {
    const now = new Date();
    const currentWeekStart = getWeekStart(now);
    const weekReport = getWeeklyStats(currentWeekStart);

    // Only show if there's activity this week
    if (weekReport.questionsAnswered === 0) {
      setReport(null);
      setShouldShow(false);
      return;
    }

    setReport(weekReport);

    // Check if we should show this report
    const config = storage.getWeeklyReportConfig();
    const weekStartStr = currentWeekStart.toISOString().split('T')[0];

    // Don't show if disabled
    if (!config.enabled) {
      setShouldShow(false);
      return;
    }

    // Don't show if already shown for this week
    if (config.lastShownWeekStart === weekStartStr && !config.dismissed) {
      setShouldShow(false);
      return;
    }

    // Don't show if dismissed recently (within same session)
    if (config.dismissed && config.dismissedAt) {
      const dismissedAge = Date.now() - config.dismissedAt;
      // Don't show if dismissed less than 1 hour ago
      if (dismissedAge < 60 * 60 * 1000) {
        setShouldShow(false);
        return;
      }
    }

    // Show if first time or new week
    setShouldShow(true);
  }, []);

  /**
   * Dismiss the current report
   */
  const dismiss = useCallback(() => {
    storage.dismissWeeklyReport();
    setShouldShow(false);
    checkedRef.current = true;
  }, []);

  /**
   * Mark the report as shown
   */
  const markShown = useCallback(() => {
    if (report) {
      storage.markWeeklyReportShown(report.weekStart);
      setShouldShow(false);
    }
  }, [report]);

  /**
   * Refresh report data
   */
  const refresh = useCallback(() => {
    checkedRef.current = false;
    calculateReport();
  }, [calculateReport]);

  // Initial check on mount
  useEffect(() => {
    if (!checkedRef.current) {
      checkedRef.current = true;
      // Use requestAnimationFrame to defer the calculation
      const frameId = requestAnimationFrame(() => {
        calculateReport();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [calculateReport]);

  // Check on visibility change (user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !checkedRef.current) {
        calculateReport();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [calculateReport]);

  return {
    report,
    shouldShow,
    dismiss,
    markShown,
    refresh,
  };
}

export default useWeeklyReport;