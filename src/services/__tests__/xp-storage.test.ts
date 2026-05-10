import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../storage';
import { __mockLocalStorage__ } from '../../../vitest.setup';

const XP_PROFILE_KEY = 'en-learn-xp-profile';

describe('StorageService XP', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getXPProfile', () => {
    it('returns default profile when no data', () => {
      const profile = StorageService.getXPProfile();
      expect(profile).toEqual({ totalXP: 0, currentLevel: 1, levelProgress: 0 });
    });

    it('returns stored valid profile', () => {
      localStorage.setItem(
        XP_PROFILE_KEY,
        JSON.stringify({ totalXP: 150, currentLevel: 2, levelProgress: 50 })
      );

      const profile = StorageService.getXPProfile();
      expect(profile.totalXP).toBe(150);
      expect(profile.currentLevel).toBe(2);
      expect(profile.levelProgress).toBe(50);
    });

    it('recovers from corrupted JSON data', () => {
      localStorage.setItem(XP_PROFILE_KEY, 'not valid json');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const profile = StorageService.getXPProfile();
      expect(profile).toEqual({ totalXP: 0, currentLevel: 1, levelProgress: 0 });
      expect(localStorage.getItem(XP_PROFILE_KEY)).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    it('recovers from invalid schema', () => {
      localStorage.setItem(
        XP_PROFILE_KEY,
        JSON.stringify({ totalXP: 'not a number', currentLevel: 1, levelProgress: 0 })
      );

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const profile = StorageService.getXPProfile();
      expect(profile).toEqual({ totalXP: 0, currentLevel: 1, levelProgress: 0 });
      expect(localStorage.getItem(XP_PROFILE_KEY)).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    it('recovers from negative currentLevel', () => {
      localStorage.setItem(
        XP_PROFILE_KEY,
        JSON.stringify({ totalXP: 100, currentLevel: -1, levelProgress: 0 })
      );

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const profile = StorageService.getXPProfile();
      expect(profile).toEqual({ totalXP: 0, currentLevel: 1, levelProgress: 0 });
      consoleWarnSpy.mockRestore();
    });
  });

  describe('updateXPProfile', () => {
    it('saves profile to localStorage', () => {
      const profile = { totalXP: 200, currentLevel: 3, levelProgress: 25 };
      StorageService.updateXPProfile(profile);

      const raw = localStorage.getItem(XP_PROFILE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toEqual(profile);
    });

    it('handles localStorage write errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Enable the mock's throw behavior
      __mockLocalStorage__.storage.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      StorageService.updateXPProfile({ totalXP: 100, currentLevel: 1, levelProgress: 0 });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Failed to save XP profile:',
        expect.any(Error)
      );
      consoleWarnSpy.mockRestore();
      // Restore the mock to its original implementation
      __mockLocalStorage__.storage.setItem.mockImplementation((key: string, value: string) => {
        __mockLocalStorage__.mock.setItem(key, value);
      });
    });
  });

  describe('addXP', () => {
    it('increments totalXP from default', () => {
      const profile = StorageService.addXP(50);
      expect(profile.totalXP).toBe(50);
    });

    it('calculates level 1 correctly (0-99 XP)', () => {
      const profile = StorageService.addXP(50);
      expect(profile.currentLevel).toBe(1);
    });

    it('calculates level 2 at threshold boundary (100 XP)', () => {
      const profile = StorageService.addXP(100);
      expect(profile.currentLevel).toBe(2);
    });

    it('calculates level 3 at threshold boundary (250 XP)', () => {
      StorageService.updateXPProfile({ totalXP: 0, currentLevel: 1, levelProgress: 0 });
      const profile = StorageService.addXP(250);
      expect(profile.currentLevel).toBe(3);
    });

    it('calculates level 12 at max threshold (4000 XP)', () => {
      StorageService.updateXPProfile({ totalXP: 0, currentLevel: 1, levelProgress: 0 });
      const profile = StorageService.addXP(4000);
      expect(profile.currentLevel).toBe(12);
    });

    it('calculates progress percentage accurately', () => {
      // Level 1: 0-100, 50 XP = 50%
      StorageService.updateXPProfile({ totalXP: 0, currentLevel: 1, levelProgress: 0 });
      let profile = StorageService.addXP(50);
      expect(profile.levelProgress).toBe(50);

      // Level 2: 100-250, 150 total = (50/150)*100 = 33%
      StorageService.updateXPProfile({ totalXP: 100, currentLevel: 2, levelProgress: 0 });
      profile = StorageService.addXP(50);
      expect(profile.levelProgress).toBe(33);
    });

    it('caps progress at 100 for max level', () => {
      StorageService.updateXPProfile({ totalXP: 0, currentLevel: 1, levelProgress: 0 });
      const profile = StorageService.addXP(5000);
      expect(profile.currentLevel).toBe(12);
      expect(profile.levelProgress).toBe(100);
    });

    it('accumulates XP on existing profile', () => {
      StorageService.updateXPProfile({ totalXP: 100, currentLevel: 2, levelProgress: 0 });
      const profile = StorageService.addXP(75);
      expect(profile.totalXP).toBe(175);
      expect(profile.currentLevel).toBe(2);
    });

    it('handles zero XP amount', () => {
      StorageService.updateXPProfile({ totalXP: 100, currentLevel: 2, levelProgress: 0 });
      const profile = StorageService.addXP(0);
      expect(profile.totalXP).toBe(100);
    });
  });

  describe('exportAllData with XP', () => {
    it('includes xpProfile in export', () => {
      StorageService.updateXPProfile({ totalXP: 200, currentLevel: 3, levelProgress: 25 });

      const result = StorageService.exportAllData();
      expect(result.data.xpProfile).toEqual({ totalXP: 200, currentLevel: 3, levelProgress: 25 });
    });

    it('includes default xpProfile when none set', () => {
      const result = StorageService.exportAllData();
      expect(result.data.xpProfile).toEqual({ totalXP: 0, currentLevel: 1, levelProgress: 0 });
    });
  });

  describe('importAllData with XP', () => {
    it('imports valid xpProfile', () => {
      const importPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: null,
          mistakes: [],
          history: [],
          xpProfile: { totalXP: 500, currentLevel: 4, levelProgress: 50 },
        },
      };

      const result = StorageService.importAllData(importPayload);
      expect(result.success).toBe(true);
      expect(result.importedCounts.xpProfile).toBe(1);

      const profile = StorageService.getXPProfile();
      expect(profile.totalXP).toBe(500);
      expect(profile.currentLevel).toBe(4);
    });

    it('handles missing xpProfile in import', () => {
      const importPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: null,
          mistakes: [],
          history: [],
        },
      };

      const result = StorageService.importAllData(importPayload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid xpProfile in import', () => {
      const importPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: null,
          mistakes: [],
          history: [],
          xpProfile: { totalXP: 'invalid', currentLevel: 1, levelProgress: 0 },
        },
      };

      const result = StorageService.importAllData(importPayload);
      expect(result.success).toBe(false);
    });
  });
});
