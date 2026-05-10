import { useState, useCallback } from 'react';
import type { PersonalWord } from '@/data/types';
import { storage } from '@/services/storage';

/**
 * Hook for managing personal words with lazy loading.
 * Words are only loaded from storage when first accessed.
 */
export function usePersonalWords() {
  const [words, setWords] = useState<PersonalWord[] | null>(null);

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
    if (words === null) {
      const fresh = storage.getPersonalWords();
      setWords(fresh);
      return fresh.some(w => w.word === word && w.marked);
    }
    return words.some(w => w.word === word && w.marked);
  }, [words]);

  /**
   * Get the count of personal words.
   * Triggers lazy load if words haven't been loaded yet.
   */
  const getCount = useCallback((): number => {
    if (words === null) {
      const fresh = storage.getPersonalWords();
      setWords(fresh);
      return fresh.length;
    }
    return words.length;
  }, [words]);

  /**
   * Get all personal words.
   * Triggers lazy load if words haven't been loaded yet.
   */
  const getWords = useCallback((): PersonalWord[] => {
    if (words === null) {
      const fresh = storage.getPersonalWords();
      setWords(fresh);
      return fresh;
    }
    return words;
  }, [words]);

  return {
    addWord,
    removeWord,
    isMarked,
    getCount,
    getWords,
  };
}