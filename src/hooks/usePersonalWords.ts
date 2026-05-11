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