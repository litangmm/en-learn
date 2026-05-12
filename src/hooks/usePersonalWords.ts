import { useState, useCallback } from 'react';
import type { PersonalWord } from '@/data/types';
import { storage } from '@/services/storage';

/**
 * Hook for managing personal words with lazy loading.
 * Uses Map<word, PersonalWord> for O(1) lookups and mutations.
 */
export function usePersonalWords() {
  const [wordsMap, setWordsMap] = useState<Map<string, PersonalWord> | null>(null);

  /** Convert array from storage to Map */
  const loadMap = useCallback((): Map<string, PersonalWord> => {
    const fresh = storage.getPersonalWords();
    const map = new Map<string, PersonalWord>();
    fresh.forEach(w => map.set(w.word, w));
    setWordsMap(map);
    return map;
  }, []);

  /**
   * Add or update a personal word.
   * If the word already exists, it will be updated with the new data.
   */
  const addWord = useCallback((word: PersonalWord) => {
    storage.addPersonalWord(word);
    setWordsMap(prev => {
      const newMap = prev ? new Map(prev) : new Map<string, PersonalWord>();
      newMap.set(word.word, word);
      return newMap;
    });
  }, []);

  /**
   * Remove a word by its text value.
   */
  const removeWord = useCallback((word: string) => {
    storage.removePersonalWord(word);
    setWordsMap(prev => {
      if (!prev) return null;
      const newMap = new Map(prev);
      newMap.delete(word);
      return newMap;
    });
  }, []);

  /**
   * Check if a word is marked as personal.
   * Triggers lazy load if words haven't been loaded yet.
   */
  const isMarked = useCallback((word: string): boolean => {
    const map = wordsMap ?? loadMap();
    return map.get(word)?.marked ?? false;
  }, [wordsMap, loadMap]);

  /**
   * Get the count of personal words.
   * Triggers lazy load if words haven't been loaded yet.
   */
  const getCount = useCallback((): number => {
    const map = wordsMap ?? loadMap();
    return map.size;
  }, [wordsMap, loadMap]);

  /**
   * Get all personal words.
   * Triggers lazy load if words haven't been loaded yet.
   */
  const getWords = useCallback((): PersonalWord[] => {
    const map = wordsMap ?? loadMap();
    return Array.from(map.values());
  }, [wordsMap, loadMap]);

  /**
   * Toggle the marked state of a word.
   * If the word is marked, removes it.
   * If not marked, creates a new PersonalWord entry with marked=true.
   */
  const toggleMark = useCallback((word: string, sentence?: string) => {
    if (isMarked(word)) {
      removeWord(word);
    } else {
      addWord({
        word,
        translation: '',
        exampleSentence: sentence ?? '',
        exampleSentenceCn: '',
        marked: true,
        markedAt: Date.now(),
      });
    }
  }, [isMarked, removeWord, addWord]);

  /**
   * Mark a word from practice with full sentence information.
   * If the word is already marked, updates it with the new information.
   */
  const markFromPractice = useCallback((
    word: string,
    translation: string,
    exampleSentence: string,
    exampleSentenceCn: string,
    sentenceId?: string
  ) => {
    addWord({
      word,
      translation,
      exampleSentence,
      exampleSentenceCn,
      marked: true,
      markedAt: Date.now(),
      ...(sentenceId !== undefined && { sentenceId }),
    });
  }, [addWord]);

  return {
    addWord,
    removeWord,
    isMarked,
    getCount,
    getWords,
    toggleMark,
    markFromPractice,
  };
}