import { useState, useCallback } from 'react';
import type { PersonalWord } from '@/data/types';
import { storage } from '@/services/storage';

/**
 * Hook for managing personal words with lazy loading.
 * Words are only loaded from storage when first accessed.
 */
export function usePersonalWords() {
  const [words, setWords] = useState<PersonalWord[] | null>(null);

  // Lazy load words on first access
  const ensureLoaded = useCallback(() => {
    if (words === null) {
      setWords(storage.getPersonalWords());
    }
  }, [words]);

  /**
   * Add or update a personal word.
   * If the word already exists, it will be updated with the new data.
   */
  const addWord = useCallback((word: PersonalWord) => {
    storage.addPersonalWord(word);
    setWords(storage.getPersonalWords());
  }, []);

  /**
   * Remove a word by its text value.
   */
  const removeWord = useCallback((word: string) => {
    storage.removePersonalWord(word);
    setWords(storage.getPersonalWords());
  }, []);

  /**
   * Check if a word is marked as personal.
   * Triggers lazy load if words haven't been loaded yet.
   */
  const isMarked = useCallback((word: string): boolean => {
    ensureLoaded();
    // words is guaranteed to be non-null after ensureLoaded
    return (words ?? []).some((w) => w.word === word && w.marked);
  }, [words, ensureLoaded]);

  /**
   * Get the count of personal words.
   * Triggers lazy load if words haven't been loaded yet.
   */
  const getCount = useCallback((): number => {
    ensureLoaded();
    // words is guaranteed to be non-null after ensureLoaded
    return (words ?? []).length;
  }, [words, ensureLoaded]);

  /**
   * Get all personal words.
   * Triggers lazy load if words haven't been loaded yet.
   */
  const getWords = useCallback((): PersonalWord[] => {
    ensureLoaded();
    return words ?? [];
  }, [words, ensureLoaded]);

  return {
    addWord,
    removeWord,
    isMarked,
    getCount,
    getWords,
  };
}