import { useState, useCallback } from 'react';
import type { XPProfile } from '@/data/types';
import { storage } from '@/services/storage';

export function useXP() {
  const [profile, setProfile] = useState<XPProfile>(() => storage.getXPProfile());

  const addXP = useCallback((baseXP: number, firstTry: boolean = false) => {
    const total = baseXP + (firstTry ? 5 : 0);
    const updated = storage.addXP(total);
    setProfile(updated);
    return updated;
  }, []);

  const resetXPProfile = useCallback(() => {
    const defaultProfile: XPProfile = {
      totalXP: 0,
      currentLevel: 1,
      levelProgress: 0,
    };
    storage.updateXPProfile(defaultProfile);
    setProfile(defaultProfile);
  }, []);

  return { profile, addXP, resetXPProfile };
}
