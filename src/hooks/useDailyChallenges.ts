import { useState, useCallback, useMemo } from 'react';
import type { DailyChallengeState, ChallengeType } from '@/data/types';
import { storage } from '@/services/storage';

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyChallenges() {
  const [state, setState] = useState<DailyChallengeState>(() => {
    const stored = storage.getDailyChallenges();
    const today = getToday();
    if (stored === null || stored.date !== today) {
      return storage.generateDailyChallenges(today);
    }
    return stored;
  });

  const trackActivity = useCallback((type: ChallengeType, value?: number) => {
    setState((prev) => {
      const today = getToday();
      if (prev.date !== today) {
        const regenerated = storage.generateDailyChallenges(today);
        // Apply activity to regenerated state
        const updatedChallenges = regenerated.challenges.map((c) => {
          if (c.type !== type || c.completed) return c;
          if (type === 'streak' && value !== undefined) {
            const newCurrent = Math.min(value, c.target);
            if (newCurrent >= c.target) {
              return { ...c, current: newCurrent, completed: true };
            }
            return { ...c, current: newCurrent };
          }
          // 'correct' or 'answer': increment by 1, cap at target
          const newCurrent = Math.min(c.current + 1, c.target);
          if (newCurrent >= c.target) {
            return { ...c, current: newCurrent, completed: true };
          }
          return { ...c, current: newCurrent };
        });
        const updated = { ...regenerated, challenges: updatedChallenges };
        storage.saveDailyChallenges(updated);
        return updated;
      }

      let hasChanges = false;
      const updatedChallenges = prev.challenges.map((c) => {
        if (c.type !== type || c.completed) return c;
        hasChanges = true;
        if (type === 'streak' && value !== undefined) {
          const newCurrent = Math.min(value, c.target);
          if (newCurrent <= c.current) return c;
          if (newCurrent >= c.target) {
            return { ...c, current: newCurrent, completed: true };
          }
          return { ...c, current: newCurrent };
        }
        // 'correct' or 'answer': increment by 1, cap at target
        const newCurrent = Math.min(c.current + 1, c.target);
        if (newCurrent >= c.target) {
          return { ...c, current: newCurrent, completed: true };
        }
        return { ...c, current: newCurrent };
      });

      if (!hasChanges) return prev;

      const updated = { ...prev, challenges: updatedChallenges };
      storage.saveDailyChallenges(updated);
      return updated;
    });
  }, []);

  const claimReward = useCallback((challengeId: string) => {
    setState((prev) => {
      const challenge = prev.challenges.find((c) => c.id === challengeId);
      if (!challenge || !challenge.completed || challenge.claimed) {
        return prev;
      }

      storage.addXP(challenge.rewardXP);

      const updatedChallenges = prev.challenges.map((c) =>
        c.id === challengeId ? { ...c, claimed: true } : c
      );
      const updated = { ...prev, challenges: updatedChallenges };
      storage.saveDailyChallenges(updated);
      return updated;
    });
  }, []);

  const unclaimedCount = useMemo(
    () => state.challenges.filter((c) => c.completed && !c.claimed).length,
    [state]
  );

  const resetDailyChallenges = useCallback(() => {
    const today = getToday();
    const regenerated = storage.generateDailyChallenges(today);
    setState(regenerated);
  }, []);

  return {
    state,
    trackActivity,
    claimReward,
    unclaimedCount,
    resetDailyChallenges,
  };
}
