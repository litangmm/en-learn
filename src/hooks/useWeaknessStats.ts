import { useState, useCallback, useMemo } from 'react';
import type { Mistake, Weakness, WeaknessStats } from '@/data/types';
import { storage } from '@/services/storage';
import { detectAllWeaknesses, getWeaknessesByDictionary, getWeaknessCountByType, calculateOverallStrength } from './useWeaknessDetection';

/**
 * Hook providing aggregated weakness statistics.
 *
 * Computes derived stats from mistakes data:
 * - totalWeakCount: number of weak sentences
 * - byDictionary: count of weaknesses per dictionary
 * - byType: count of weaknesses by type
 * - overallStrength: 0-100 score (higher is better)
 */

/**
 * Get weakness stats from mistakes array.
 * Pure function for easy testing.
 */
export function getWeaknessStats(mistakes: Mistake[]): WeaknessStats {
  const weaknesses = detectAllWeaknesses(mistakes);

  const totalWeakCount = weaknesses.length;

  // Group by dictionary
  const byDictionary: Record<string, number> = {};
  for (const w of weaknesses) {
    byDictionary[w.dictionaryId] = (byDictionary[w.dictionaryId] ?? 0) + 1;
  }

  // Group by type
  const byType = getWeaknessCountByType(weaknesses);

  // Calculate overall strength
  const overallStrength = calculateOverallStrength(mistakes.length, totalWeakCount);

  return {
    totalWeakCount,
    byDictionary,
    byType,
    overallStrength,
  };
}

/**
 * Hook returning weakness stats from live storage data.
 * Refreshes when storage changes.
 */
export function useWeaknessStats() {
  const [mistakes, setMistakes] = useState<Mistake[]>(() => storage.getMistakes());

  const refresh = useCallback(() => {
    setMistakes(storage.getMistakes());
  }, []);

  const stats = useMemo(() => getWeaknessStats(mistakes), [mistakes]);

  const getAllWeaknesses = useCallback((): Weakness[] => detectAllWeaknesses(mistakes), [mistakes]);

  const getByDictionary = useCallback(
    (dictionaryId: string): Weakness[] => getWeaknessesByDictionary(detectAllWeaknesses(mistakes), dictionaryId),
    [mistakes]
  );

  return {
    stats,
    refresh,
    getAllWeaknesses,
    getByDictionary,
  };
}

export default useWeaknessStats;
