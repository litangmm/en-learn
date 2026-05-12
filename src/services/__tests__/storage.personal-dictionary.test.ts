import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../storage';
// Import the mock control from vitest.setup.ts
import { __mockLocalStorage__ } from '../../../vitest.setup';
import type { PersonalDictionary } from '@/data/types';

const PERSONAL_DICTIONARY_KEY = 'en-learn-personal-dictionary';

describe('StorageService PersonalDictionary', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getPersonalDictionary', () => {
    it('returns null when no data exists', () => {
      const result = StorageService.getPersonalDictionary();
      expect(result).toBeNull();
    });

    it('returns stored PersonalDictionary', () => {
      const data: PersonalDictionary = {
        activeSentenceIds: ['pw-1', 'pw-2'],
        lastPracticedAt: 1234567890,
      };
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify(data));

      const result = StorageService.getPersonalDictionary();
      expect(result).not.toBeNull();
      expect(result!.activeSentenceIds).toEqual(['pw-1', 'pw-2']);
      expect(result!.lastPracticedAt).toBe(1234567890);
    });

    it('returns null for corrupted JSON', () => {
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, 'not valid json');
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = StorageService.getPersonalDictionary();
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Corrupted personal dictionary data, clearing'
      );
      expect(localStorage.getItem(PERSONAL_DICTIONARY_KEY)).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    it('returns null for invalid schema (missing activeSentenceIds)', () => {
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify({ lastPracticedAt: 123 }));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = StorageService.getPersonalDictionary();
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Invalid personal dictionary schema, clearing'
      );
      consoleWarnSpy.mockRestore();
    });

    it('returns null for invalid activeSentenceIds (not an array)', () => {
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify({ activeSentenceIds: 'not-array' }));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = StorageService.getPersonalDictionary();
      expect(result).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    it('returns null for invalid activeSentenceIds (array with non-strings)', () => {
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify({ activeSentenceIds: [1, 2, 3] }));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = StorageService.getPersonalDictionary();
      expect(result).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    it('accepts null lastPracticedAt', () => {
      const data: PersonalDictionary = {
        activeSentenceIds: ['pw-1'],
        lastPracticedAt: null,
      };
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify(data));

      const result = StorageService.getPersonalDictionary();
      expect(result).not.toBeNull();
      expect(result!.lastPracticedAt).toBeNull();
    });

    it('accepts undefined lastPracticedAt', () => {
      const data: PersonalDictionary = {
        activeSentenceIds: ['pw-1'],
      } as PersonalDictionary;
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify(data));

      const result = StorageService.getPersonalDictionary();
      expect(result).not.toBeNull();
    });
  });

  describe('savePersonalDictionary', () => {
    it('stores PersonalDictionary correctly', () => {
      const data: PersonalDictionary = {
        activeSentenceIds: ['pw-1', 'pw-2', 'pw-3'],
        lastPracticedAt: 1234567890,
      };

      StorageService.savePersonalDictionary(data);
      const raw = localStorage.getItem(PERSONAL_DICTIONARY_KEY);
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!);
      expect(parsed.activeSentenceIds).toEqual(['pw-1', 'pw-2', 'pw-3']);
      expect(parsed.lastPracticedAt).toBe(1234567890);
    });

    it('handles quota exceeded gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Enable the mock's throw behavior
      __mockLocalStorage__.storage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const data: PersonalDictionary = { activeSentenceIds: ['pw-1'], lastPracticedAt: null };
      StorageService.savePersonalDictionary(data);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Failed to save personal dictionary:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
      // Restore the mock to its original implementation
      __mockLocalStorage__.storage.setItem.mockImplementation((key: string, value: string) => {
        __mockLocalStorage__.mock.setItem(key, value);
      });
    });
  });

  describe('updatePersonalDictionary', () => {
    it('creates new PersonalDictionary with default values if none exists', () => {
      const result = StorageService.updatePersonalDictionary(() => ({
        activeSentenceIds: ['pw-new'],
        lastPracticedAt: Date.now(),
      }));

      expect(result.activeSentenceIds).toEqual(['pw-new']);
      expect(result.lastPracticedAt).not.toBeNull();
    });

    it('updates existing PersonalDictionary', () => {
      const existing: PersonalDictionary = {
        activeSentenceIds: ['pw-1', 'pw-2'],
        lastPracticedAt: 1234567890,
      };
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify(existing));

      const result = StorageService.updatePersonalDictionary((prev) => ({
        activeSentenceIds: [...prev.activeSentenceIds, 'pw-3'],
        lastPracticedAt: 9999999999,
      }));

      expect(result.activeSentenceIds).toEqual(['pw-1', 'pw-2', 'pw-3']);
      expect(result.lastPracticedAt).toBe(9999999999);
    });

    it('preserves unchanged fields during update', () => {
      const existing: PersonalDictionary = {
        activeSentenceIds: ['pw-1'],
        lastPracticedAt: 1234567890,
      };
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify(existing));

      const result = StorageService.updatePersonalDictionary(() => ({
        activeSentenceIds: ['pw-new'],
      }));

      expect(result.activeSentenceIds).toEqual(['pw-new']);
      // lastPracticedAt should be preserved from the previous state
      expect(result.lastPracticedAt).toBe(1234567890);
    });
  });

  describe('exportAllData includes personalDictionary', () => {
    it('includes personalDictionary in export when it exists', () => {
      const existing: PersonalDictionary = {
        activeSentenceIds: ['pw-1', 'pw-2'],
        lastPracticedAt: 1234567890,
      };
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify(existing));

      const exportData = StorageService.exportAllData();
      expect(exportData.data.personalDictionary).toBeDefined();
      expect(exportData.data.personalDictionary!.activeSentenceIds).toEqual(['pw-1', 'pw-2']);
    });

    it('includes undefined personalDictionary in export when none exists', () => {
      const exportData = StorageService.exportAllData();
      expect('personalDictionary' in exportData.data).toBe(true);
    });
  });

  describe('importAllData with personalDictionary', () => {
    it('imports personalDictionary correctly', async () => {
      const importData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: null,
          mistakes: [],
          history: [],
          personalDictionary: {
            activeSentenceIds: ['pw-imported-1', 'pw-imported-2'],
            lastPracticedAt: 5555555555,
          },
        },
      };

      const result = StorageService.importAllData(importData);

      expect(result.success).toBe(true);
      expect(result.importedCounts.personalDictionary).toBe(1);

      const stored = StorageService.getPersonalDictionary();
      expect(stored).not.toBeNull();
      expect(stored!.activeSentenceIds).toEqual(['pw-imported-1', 'pw-imported-2']);
      expect(stored!.lastPracticedAt).toBe(5555555555);
    });

    it('reports import failure for invalid personalDictionary', () => {
      const importData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: null,
          mistakes: [],
          history: [],
          personalDictionary: {
            activeSentenceIds: 123, // Invalid: should be array
          },
        },
      };

      const result = StorageService.importAllData(importData);

      expect(result.success).toBe(false);
    });
  });
});
