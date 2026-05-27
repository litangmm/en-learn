/**
 * useAdaptiveViewRegistry Hook
 *
 * Combines adaptive view state with the view registry to produce
 * priority-sorted view lists for the ViewRouter's dynamic view display.
 *
 * Usage:
 *   const { adaptiveState, viewsByPriority, topViews } = useAdaptiveViewRegistry();
 *
 * The hook exposes:
 * - raw `adaptiveState` from useAdaptiveViewContext (difficultyLevel, flowState, etc.)
 * - `viewsByPriority`: all registered views sorted by adaptive priority (descending)
 * - `topViews`: top N views by priority (configurable, default 3)
 *
 * Gracefully handles empty `registeredViews` by returning empty arrays.
 */

import { useMemo } from 'react';
import { useAdaptiveViewContext, type AdaptiveViewState } from '@/hooks/useAdaptiveViewContext';
import { useViewRegistry } from '@/components/routing/useViewRegistry';
import type { ViewConfig } from '@/components/routing';

// ---------------------------------------------------------------------------
// Output Types
// ---------------------------------------------------------------------------

/**
 * A view entry with its computed adaptive priority.
 */
export interface PriorityView {
  /** View ID */
  id: string;
  /** Computed adaptive priority score */
  priority: number;
  /** Full view configuration */
  config: ViewConfig;
}

/**
 * Return type for useAdaptiveViewRegistry.
 */
export interface AdaptiveViewRegistryResult {
  /**
   * Raw adaptive state from useAdaptiveViewContext.
   * Consumers can access difficultyLevel, flowState, hasWeaknessBias, etc.
   */
  adaptiveState: AdaptiveViewState;

  /**
   * All registered views sorted by adaptive priority (descending).
   * Empty array if no views are registered.
   */
  viewsByPriority: PriorityView[];

  /**
   * Top N views by priority (default: 3).
   * Empty array if no views are registered.
   */
  topViews: PriorityView[];

  /**
   * Total count of registered views.
   * Useful for UI logic (e.g., "no views available" states).
   */
  totalViewCount: number;
}

// ---------------------------------------------------------------------------
// Main Hook
// ---------------------------------------------------------------------------

/**
 * Hook that combines adaptive view state with the view registry
 * to produce priority-sorted view lists.
 *
 * @param topN - Number of top views to return (default: 3)
 * @returns AdaptiveViewRegistryResult with adaptiveState and sorted view lists
 */
export function useAdaptiveViewRegistry(topN: number = 3): AdaptiveViewRegistryResult {
  // Raw adaptive state from context
  const adaptiveState = useAdaptiveViewContext();

  // View registry access
  const { registeredViews, getAdaptivePriority, getViewConfig } = useViewRegistry();

  const result = useMemo<AdaptiveViewRegistryResult>(() => {
    // Handle empty registeredViews gracefully
    if (registeredViews.size === 0) {
      return {
        adaptiveState,
        viewsByPriority: [],
        topViews: [],
        totalViewCount: 0,
      };
    }

    // Build priority view list for each registered view
    const priorityViews: PriorityView[] = [];
    for (const viewId of registeredViews) {
      // Get priority (0 for unregistered views via getAdaptivePriority guard,
      // but here we only iterate registered views so all should have configs)
      const priority = getAdaptivePriority(viewId, adaptiveState);
      priorityViews.push({
        id: viewId,
        priority,
        config: getViewConfig(viewId)!,
      });
    }

    // Sort by priority descending
    const viewsByPriority = priorityViews.sort((a, b) => b.priority - a.priority);

    // Get top N views
    const topViews = viewsByPriority.slice(0, topN);

    return {
      adaptiveState,
      viewsByPriority,
      topViews,
      totalViewCount: registeredViews.size,
    };
  }, [registeredViews, getAdaptivePriority, getViewConfig, adaptiveState, topN]);

  return result;
}

export default useAdaptiveViewRegistry;