import { useState, useCallback, useMemo } from 'react';
import { storage } from '@/services/storage';
import { MILESTONE_DEFINITIONS, type Milestone, type MilestoneDefinition } from '@/data/types';
import { useReviewStreak } from './useReviewStreak';

/**
 * Progress information for the next milestone.
 */
export interface NextMilestoneInfo {
  /** The next milestone definition */
  definition: MilestoneDefinition;
  /** Days required to reach this milestone */
  requiredDays: number;
  /** Current learning days */
  currentDays: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Days remaining to unlock */
  daysRemaining: number;
}

/**
 * Hook return type for useMilestones.
 */
export interface UseMilestonesReturn {
  /** All milestone definitions */
  milestoneDefinitions: MilestoneDefinition[];
  /** Currently unlocked milestones */
  unlockedMilestones: Milestone[];
  /** Total cumulative learning days */
  totalLearningDays: number;
  /** Next milestone (first not unlocked) with progress info, or null if all unlocked */
  nextMilestone: NextMilestoneInfo | null;
  /** Progress percentage to next milestone (0-100), -1 if all unlocked */
  milestoneProgress: number;
  /** Number of unlocked milestones */
  unlockedCount: number;
  /** Check and unlock milestones based on current totalLearningDays */
  checkAndUnlockMilestones: () => Milestone[];
  /** Manually award a specific milestone */
  awardMilestone: (_milestoneId: string) => Milestone | null;
}

/**
 * Hook that provides milestone functionality.
 * Manages unlocked milestones, calculates progress, and handles milestone unlocking.
 */
export function useMilestones(): UseMilestonesReturn {
  // Get review streak data for totalLearningDays
  const { data: streakData } = useReviewStreak();

  // Track unlocked milestones from storage
  const [unlockedMilestones, setUnlockedMilestones] = useState<Milestone[]>(() =>
    storage.getMilestones().unlockedMilestones
  );

  // Derived: unlocked milestone IDs for quick lookup
  const unlockedIds = useMemo(
    () => new Set(unlockedMilestones.map((m) => m.id)),
    [unlockedMilestones]
  );

  // Derived: total learning days from streak data
  const totalLearningDays = streakData.totalReviewDays;

  // Derived: find next milestone (first not unlocked)
  const nextMilestone = useMemo((): NextMilestoneInfo | null => {
    // Find first milestone that hasn't been unlocked
    const nextDef = MILESTONE_DEFINITIONS.find((def) => !unlockedIds.has(def.id));

    if (!nextDef) {
      return null;
    }

    const requiredDays = nextDef.requiredDays;
    const currentDays = totalLearningDays;
    // Progress capped at 0-100 range
    const progress = Math.min(100, Math.max(0, Math.round((currentDays / requiredDays) * 100)));
    // Days remaining is the gap to the requirement, capped at 0 minimum
    // If currentDays exceeds requiredDays, daysRemaining is 0 (milestone can be unlocked)
    const daysRemaining = Math.max(0, requiredDays - currentDays);

    return {
      definition: nextDef,
      requiredDays,
      currentDays,
      progress,
      daysRemaining,
    };
  }, [unlockedIds, totalLearningDays]);

  // Derived: milestone progress to next milestone (0-100, -1 if all unlocked)
  const milestoneProgress = nextMilestone?.progress ?? -1;

  // Derived: count of unlocked milestones
  const unlockedCount = unlockedMilestones.length;

  /**
   * Check if any milestones should be unlocked based on totalLearningDays.
   * Awards new milestones via storage and returns array of newly awarded milestones.
   */
  const checkAndUnlockMilestones = useCallback((): Milestone[] => {
    const newlyUnlocked: Milestone[] = [];

    // Check each milestone definition
    for (const definition of MILESTONE_DEFINITIONS) {
      // Skip if already unlocked
      if (unlockedIds.has(definition.id)) {
        continue;
      }

      // Check if requirement is met
      if (totalLearningDays >= definition.requiredDays) {
        // Award the milestone
        const awarded = storage.awardMilestone(definition.id);
        if (awarded) {
          newlyUnlocked.push(awarded);
        }
      }
    }

    // Update local state if any new milestones were awarded
    if (newlyUnlocked.length > 0) {
      setUnlockedMilestones((prev) => [...prev, ...newlyUnlocked]);
    }

    return newlyUnlocked;
  }, [unlockedIds, totalLearningDays]);

  /**
   * Manually award a specific milestone.
   * Useful for testing or admin purposes.
   */
  const awardMilestone = useCallback((milestoneId: string): Milestone | null => {
    const awarded = storage.awardMilestone(milestoneId);

    if (awarded) {
      setUnlockedMilestones((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === awarded.id)) {
          return prev;
        }
        return [...prev, awarded];
      });
    }

    return awarded;
  }, []);

  return {
    milestoneDefinitions: MILESTONE_DEFINITIONS,
    unlockedMilestones,
    totalLearningDays,
    nextMilestone,
    milestoneProgress,
    unlockedCount,
    checkAndUnlockMilestones,
    awardMilestone,
  };
}
