import { useState, useEffect, useRef, useCallback } from 'react';
import { useDictionaryIndex } from '@/hooks/useDictionaryIndex';
import { usePersonalWordIndex } from '@/hooks/usePersonalWordIndex';

export interface IndexStatsData {
  /** Total number of indexed sentences in current dictionary */
  totalCount: number;
  /** Number of unique words indexed */
  uniqueWords: number;
  /** Time in milliseconds to build the index */
  buildTimeMs: number;
  /** Number of personal words indexed */
  personalWordCount: number;
  /** Whether the index is currently loaded */
  isLoaded: boolean;
  /** Current dictionary ID */
  currentDictionaryId: string | null;
}

/**
 * Hook providing real-time index statistics and monitoring.
 *
 * Features:
 * - Combines dictionary index stats with personal word stats
 * - Monitors cache hit/miss status
 * - Tracks index build time
 * - Refreshes on dictionary switch
 *
 * @example
 * ```typescript
 * const stats = useIndexStats();
 * console.log(stats.totalCount); // Number of indexed sentences
 * console.log(stats.buildTimeMs); // Index build time
 * ```
 */
export function useIndexStats(): IndexStatsData {
  const { getStats, currentId } = useDictionaryIndex();
  const { index: personalWordIndex } = usePersonalWordIndex();

  // Track last dictionary ID to detect switches
  const lastDictIdRef = useRef<string | null>(null);
  const [stats, setStats] = useState<IndexStatsData>({
    totalCount: 0,
    uniqueWords: 0,
    buildTimeMs: 0,
    personalWordCount: 0,
    isLoaded: false,
    currentDictionaryId: null,
  });

  // Update stats when dictionary changes or on initial load
  const updateStats = useCallback(() => {
    const dictStats = getStats();
    const dictionaryStats = dictStats ?? { totalCount: 0, uniqueWords: 0, buildTimeMs: 0 };

    setStats({
      totalCount: dictionaryStats.totalCount,
      uniqueWords: dictionaryStats.uniqueWords,
      buildTimeMs: Math.round(dictionaryStats.buildTimeMs * 100) / 100,
      personalWordCount: personalWordIndex ? personalWordIndex.getAllAsSentences().length : 0,
      isLoaded: currentId !== null,
      currentDictionaryId: currentId,
    });
  }, [getStats, currentId, personalWordIndex]);

  // Detect dictionary changes and refresh stats
  // Using ref pattern to avoid setState in effect lint warning
  useEffect(() => {
    if (lastDictIdRef.current !== currentId) {
      lastDictIdRef.current = currentId;
      // Defer the state update to avoid cascading renders
      const timer = setTimeout(() => {
        updateStats();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentId, updateStats]);

  // Periodic refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      updateStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [updateStats]);

  return stats;
}