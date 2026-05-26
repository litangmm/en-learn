import { useState, useMemo, useCallback } from 'react';
import type { PracticeRecommendation } from '@/data/types';

/**
 * State managed by usePracticeRecommendationPanel hook.
 */
export interface PracticeRecommendationPanelState {
  /** Recommendations that are visible (not dismissed) */
  visibleRecommendations: PracticeRecommendation[];
  /** Set of dismissed recommendation IDs */
  dismissedIds: Set<string>;
}

/**
 * Hook to manage practice recommendation panel visibility and dismiss state.
 *
 * @param recommendations - Full array of recommendations
 * @returns Object containing visible recommendations and control functions
 */
export function usePracticeRecommendationPanel(
  recommendations: PracticeRecommendation[]
): PracticeRecommendationPanelState & {
  /** Dismiss a recommendation by ID */
  onDismissRecommendation: (_id: string) => void;
  /** Reset all dismissed recommendations */
  resetDismissed: () => void;
} {
  // State to track dismissed recommendation IDs
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Filter recommendations to show only non-dismissed ones
  const visibleRecommendations = useMemo(() => {
    return recommendations.filter((rec) => !dismissedIds.has(rec.id));
  }, [recommendations, dismissedIds]);

  // Dismiss a recommendation by ID
  const onDismissRecommendation = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Reset all dismissed recommendations
  const resetDismissed = useCallback(() => {
    setDismissedIds(new Set());
  }, []);

  return {
    visibleRecommendations,
    dismissedIds,
    onDismissRecommendation,
    resetDismissed,
  };
}

export default usePracticeRecommendationPanel;