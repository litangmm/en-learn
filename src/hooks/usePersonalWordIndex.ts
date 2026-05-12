import { useState } from 'react';
import type { PersonalWordIndex, PersonalWordIndexEntry, Sentence } from '@/data/types';
import { buildPersonalWordIndex } from '@/data/personalWordIndex';
import { storage } from '@/services/storage';

/**
 * Hook providing personal word index for efficient lookups.
 *
 * Lazily initializes the index from storage on first access.
 * Provides O(1) lookup by word or prefix.
 */
export function usePersonalWordIndex() {
  // Synchronous initialization on first render
  const [index] = useState<PersonalWordIndex | null>(() =>
    buildPersonalWordIndex(storage.getPersonalWords())
  );

  /**
   * Check if a word exists in the index.
   */
  function hasWord(word: string): boolean {
    return index?.hasWord(word) ?? false;
  }

  /**
   * Get a personal word entry by exact word match.
   */
  function getByWord(word: string): PersonalWordIndexEntry | undefined {
    return index?.getByWord(word);
  }

  /**
   * Get personal word entries by prefix match.
   */
  function getByPrefix(prefix: string): PersonalWordIndexEntry[] {
    return index?.getByPrefix(prefix) ?? [];
  }

  /**
   * Get all personal words as Sentence format for practice mode.
   */
  function getAllAsSentences(): Sentence[] {
    return index?.getAllAsSentences() ?? [];
  }

  /**
   * Reload the index from storage (call after personal words are modified).
   * Note: Returns a new index object, caller should use the return value.
   */
  function reload(): PersonalWordIndex {
    return buildPersonalWordIndex(storage.getPersonalWords());
  }

  return {
    index,
    hasWord,
    getByWord,
    getByPrefix,
    getAllAsSentences,
    reload,
  };
}