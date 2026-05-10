import { useState, useCallback } from 'react';
import type { XPProfile } from '@/data/types';
import { storage } from '@/services/storage';

function getStreakMultiplier(streak: number): number {
  if (streak >= 10) return 3.0;
  if (streak >= 5) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

export function useXP() {
  const [profile, setProfile] = useState<XPProfile>(() => storage.getXPProfile());
  const [streak, setStreak] = useState(0);
  const [maxStreakReached, setMaxStreakReached] = useState(0);

  const recordCorrectAnswer = useCallback(() => {
    setStreak(prev => {
      const next = prev + 1;
      setMaxStreakReached(max => (next > max ? next : max));
      return next;
    });
  }, []);

  const recordWrongAnswer = useCallback(() => {
    setStreak(0);
  }, []);

  const resetStreak = useCallback(() => {
    setStreak(0);
  }, []);

  const addXP = useCallback((baseXP: number, firstTry: boolean = false) => {
    const multiplier = getStreakMultiplier(streak);
    const bonus = firstTry ? 5 : 0;
    const finalXP = Math.round(baseXP * multiplier) + bonus;
    const oldLevel = profile.currentLevel;
    const updated = storage.addXP(finalXP);
    const newLevel = updated.currentLevel;
    const leveledUp = oldLevel !== newLevel;
    setProfile(updated);
    return { profile: updated, finalXP, multiplier, streak, oldLevel, newLevel, leveledUp };
  }, [streak, profile.currentLevel]);

  const resetXPProfile = useCallback(() => {
    const defaultProfile: XPProfile = {
      totalXP: 0,
      currentLevel: 1,
      levelProgress: 0,
    };
    storage.updateXPProfile(defaultProfile);
    setProfile(defaultProfile);
  }, []);

  return {
    profile,
    addXP,
    resetXPProfile,
    streak,
    maxStreakReached,
    recordCorrectAnswer,
    recordWrongAnswer,
    resetStreak,
  };
}
