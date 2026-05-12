import { useCallback } from 'react';
import { storage } from '@/services/storage';
import type { ShareFormat } from '@/data/types';

/**
 * Hook for tracking and retrieving share metrics.
 * Provides methods to record share operations and retrieve aggregated data.
 */
export function useShareMetrics() {
  /**
   * Track a share event with the specified format and trigger type.
   * @param format - The share format used ('text' or 'image')
   * @param triggerType - The type/cause of the share (e.g., 'result-modal', 'levelup-toast', 'badge-toast')
   */
  const trackShare = useCallback((format: ShareFormat, triggerType: string) => {
    const now = Date.now();
    storage.updateShareMetrics((prev) => {
      // Initialize typeCounts entry if needed
      const newTypeCounts = { ...prev.typeCounts };
      newTypeCounts[triggerType] = (newTypeCounts[triggerType] || 0) + 1;

      return {
        totalShareCount: prev.totalShareCount + 1,
        formatCounts: {
          text: format === 'text' ? prev.formatCounts.text + 1 : prev.formatCounts.text,
          image: format === 'image' ? prev.formatCounts.image + 1 : prev.formatCounts.image,
        },
        typeCounts: newTypeCounts,
        lastShareAt: now,
        firstShareAt: prev.firstShareAt ?? now,
      };
    });
  }, []);

  /**
   * Get current share metrics from storage.
   */
  const getMetrics = useCallback(() => {
    return storage.getShareMetrics();
  }, []);

  return {
    trackShare,
    getMetrics,
  };
}