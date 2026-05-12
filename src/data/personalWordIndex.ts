/**
 * Personal Word Index Module
 *
 * Provides efficient O(1) lookups for personal words by word or prefix.
 * Indexes both the word itself and words from example sentences.
 */

import type { PersonalWord, PersonalWordIndex, PersonalWordIndexEntry, Sentence } from './types';

/**
 * Regular expression to extract English words (alphanumeric sequences only).
 */
const WORD_REGEX = /[a-zA-Z0-9]+/g;

/**
 * Extracts English words from text.
 * Returns lowercase alphanumeric words only.
 *
 * @param text - The text to extract words from
 * @returns Array of lowercase words found in the text
 */
function extractWords(text: string): string[] {
  const matches = text.match(WORD_REGEX);
  if (!matches) {
    return [];
  }
  // Convert to lowercase and filter out empty strings
  return [...new Set(matches.map((word) => word.toLowerCase()).filter((word) => word.length > 0))];
}

/**
 * Converts a PersonalWord to a Sentence for use in practice mode.
 * Uses the word as the target blank and the example sentence as context.
 *
 * @param personalWord - The personal word to convert
 * @param id - The sentence ID to use
 * @returns Sentence format suitable for practice mode
 */
export function personalWordToSentence(personalWord: PersonalWord, id: string): Sentence {
  return {
    id,
    english: personalWord.exampleSentence,
    chinese: personalWord.translation,
    blanks: [{ word: personalWord.word }],
    level: 'personal',
  };
}

/**
 * Builds a personal word index from an array of personal words.
 * Creates Maps for O(1) lookup by word and prefix.
 *
 * @param personalWords - Array of personal words to index
 * @returns PersonalWordIndex with efficient lookup methods
 */
export function buildPersonalWordIndex(personalWords: PersonalWord[]): PersonalWordIndex {
  // Map of lowercase word -> entry
  const byWord = new Map<string, PersonalWordIndexEntry>();
  // Track main words (personal word itself) separately to avoid example words
  const mainWords = new Set<string>();

  for (const personalWord of personalWords) {
    const word = personalWord.word.toLowerCase();
    const exampleSentenceWords = extractWords(personalWord.exampleSentence);

    const entry: PersonalWordIndexEntry = {
      personalWord,
      exampleSentenceWords,
    };

    // Index by the word itself (main word)
    byWord.set(word, entry);
    mainWords.add(word);

    // Also index all words from the example sentence for cross-referencing
    for (const w of exampleSentenceWords) {
      if (!byWord.has(w)) {
        byWord.set(w, entry);
      }
    }
  }

  return {
    byWord,

    getAllAsSentences(): Sentence[] {
      // Only return sentences for actual personal words, not example sentence words
      const sentences: Sentence[] = [];
      let index = 0;

      for (const word of mainWords) {
        const entry = byWord.get(word);
        if (entry) {
          sentences.push(personalWordToSentence(entry.personalWord, `pw-${index++}`));
        }
      }

      return sentences;
    },

    hasWord(word: string): boolean {
      return byWord.has(word.toLowerCase());
    },

    getByWord(word: string): PersonalWordIndexEntry | undefined {
      return byWord.get(word.toLowerCase());
    },

    getByPrefix(prefix: string): PersonalWordIndexEntry[] {
      const lowerPrefix = prefix.toLowerCase();
      const results: PersonalWordIndexEntry[] = [];
      const seen = new Set<PersonalWord>();

      for (const word of mainWords) {
        if (word.startsWith(lowerPrefix)) {
          const entry = byWord.get(word);
          if (entry && !seen.has(entry.personalWord)) {
            seen.add(entry.personalWord);
            results.push(entry);
          }
        }
      }

      return results;
    },
  };
}