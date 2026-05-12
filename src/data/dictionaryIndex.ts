/**
 * Dictionary Index Module
 *
 * Provides efficient O(1) lookups for dictionary sentences by ID, word, and level.
 */

import type { Blank, DictionaryIndex, IndexEntry, IndexStats, Sentence } from './types';

/**
 * Regular expression to extract English words (alphanumeric sequences only).
 * Matches sequences of one or more letters or digits.
 */
const WORD_REGEX = /[a-zA-Z0-9]+/g;

/**
 * Extracts English words from text.
 * Returns lowercase alphanumeric words only.
 *
 * @param text - The text to extract words from
 * @returns Array of lowercase words found in the text
 */
export function splitIntoWords(text: string): string[] {
  const matches = text.match(WORD_REGEX);
  if (!matches) {
    return [];
  }
  // Convert to lowercase and filter out empty strings
  return matches.map((word) => word.toLowerCase()).filter((word) => word.length > 0);
}

/**
 * Extracts words from a blank (target word).
 *
 * @param blank - The blank to extract word from
 * @returns Array containing the lowercase blank word
 */
function extractBlankWord(blank: Blank): string[] {
  if (!blank.word || blank.word.trim() === '') {
    return [];
  }
  return [blank.word.toLowerCase()];
}

/**
 * Builds a dictionary index from an array of sentences.
 * Creates Maps for O(1) lookup by ID, word, and level.
 *
 * @param sentences - Array of sentences to index
 * @returns DictionaryIndex with efficient lookup methods
 */
export function buildDictionaryIndex(sentences: Sentence[]): DictionaryIndex {
  const startTime = performance.now();

  // Create Maps for O(1) lookups
  const byId = new Map<string, string>();
  const byWord = new Map<string, IndexEntry[]>();
  const byLevel = new Map<string, string[]>();

  // Temporary storage for word positions (word -> sentenceId -> positions)
  const wordPositions = new Map<string, Map<string, number[]>>();

  // Process each sentence
  for (const sentence of sentences) {
    const sentenceId = sentence.id;

    // Index by ID: sentenceId -> sentence text
    byId.set(sentenceId, sentence.english);

    // Index by level: level -> sentenceId[]
    const levelList = byLevel.get(sentence.level);
    if (levelList) {
      levelList.push(sentenceId);
    } else {
      byLevel.set(sentence.level, [sentenceId]);
    }

    // Extract words from english text
    const englishWords = splitIntoWords(sentence.english);

    // Extract words from blanks
    const blankWords = sentence.blanks.flatMap(extractBlankWord);

    // Combine english words and blank words for indexing
    for (const word of englishWords) {
      // Find positions of this word in the english text
      const positions = findWordPositions(word, sentence.english);

      // Store position info
      let sentencePositions = wordPositions.get(word);
      if (!sentencePositions) {
        sentencePositions = new Map();
        wordPositions.set(word, sentencePositions);
      }
      sentencePositions.set(sentenceId, positions);
    }

    // Record blank words (they appear in the sentence too)
    for (const word of blankWords) {
      const positions = findWordPositions(word, sentence.english);

      let sentencePositions = wordPositions.get(word);
      if (!sentencePositions) {
        sentencePositions = new Map();
        wordPositions.set(word, sentencePositions);
      }
      sentencePositions.set(sentenceId, positions);
    }
  }

  // Build byWord Map from wordPositions
  for (const [word, sentenceMap] of wordPositions.entries()) {
    const entries: IndexEntry[] = [];

    for (const [sid, positions] of sentenceMap.entries()) {
      entries.push({
        sentenceId: sid,
        wordPositions: positions,
      });
    }

    byWord.set(word, entries);
  }

  const buildTimeMs = performance.now() - startTime;

  // Calculate stats
  const uniqueWords = byWord.size;
  const totalCount = Array.from(byWord.values()).reduce(
    (sum, entries) => sum + entries.length,
    0
  );

  // Build byLevel stats
  const levelStats: Record<string, number> = {};
  for (const [level, ids] of byLevel.entries()) {
    levelStats[level] = ids.length;
  }

  // Create the index object with methods
  const index: DictionaryIndex = {
    byId,
    byWord,
    byLevel,

    getById(id: string): string | undefined {
      return byId.get(id);
    },

    getByWord(word: string): string[] {
      const entries = byWord.get(word.toLowerCase());
      if (!entries) {
        return [];
      }
      return entries.map((entry) => entry.sentenceId);
    },

    getByLevel(level: string): string[] {
      return byLevel.get(level) || [];
    },

    getStats(): IndexStats {
      return {
        totalCount,
        byLevel: levelStats,
        uniqueWords,
        buildTimeMs,
      };
    },

    getIndexedIds(): string[] {
      return Array.from(byId.keys());
    },
  };

  return index;
}

/**
 * Finds all character positions where a word appears in text.
 *
 * @param word - The word to find (lowercase)
 * @param text - The text to search in
 * @returns Array of start positions where the word appears
 */
function findWordPositions(word: string, text: string): number[] {
  const positions: number[] = [];
  const lowerText = text.toLowerCase();
  const lowerWord = word.toLowerCase();

  let searchIndex = 0;
  while (true) {
    const foundIndex = lowerText.indexOf(lowerWord, searchIndex);
    if (foundIndex === -1) {
      break;
    }
    positions.push(foundIndex);
    searchIndex = foundIndex + 1;
  }

  return positions;
}

/**
 * Gets sentence IDs containing the given word using the index.
 * This is a convenience function that delegates to index.getByWord().
 *
 * @param word - The word to search for
 * @param index - The dictionary index to search in
 * @returns Array of sentence IDs containing the word
 */
export function getSentenceIdsByWord(word: string, index: DictionaryIndex): string[] {
  return index.getByWord(word);
}