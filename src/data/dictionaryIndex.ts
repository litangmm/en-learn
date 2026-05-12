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
 * Escapes special regex characters in a string.
 *
 * @param str - The string to escape
 * @returns The escaped string safe for use in regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if a token contains any English letters (a-zA-Z).
 *
 * @param token - The token to check
 * @returns True if the token contains English letters
 */
function isEnglishToken(token: string): boolean {
  return /[a-zA-Z]/.test(token);
}

/**
 * Searches for sentences matching a query using the dictionary index for O(1) word lookups.
 *
 * Algorithm:
 * 1. Empty query → return all sentences (preserve level/marked filter)
 * 2. Non-empty query → split by whitespace into tokens
 * 3. For each English token → strip non-alphanumeric chars, use getByWord() to get candidate IDs
 *    (handles cases like "morning." where user adds trailing punctuation)
 * 4. For non-English tokens → include all sentences in candidates (scan all for Chinese)
 * 5. Apply AND logic across tokens (sentence must match ALL tokens)
 * 6. Filter candidate IDs against actual sentences for exact match
 *
 * @param query - The search query string (will be trimmed and split by whitespace)
 * @param sentences - Array of all sentences to search within
 * @param getByWord - Function to get sentence IDs containing a word (from index)
 * @returns Array of Sentence objects matching ALL tokens in the query
 */
export function searchByQuery(
  query: string,
  sentences: Sentence[],
  getByWord: (word: string) => string[]
): Sentence[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return sentences;
  }

  const tokens = trimmed.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) {
    return sentences;
  }

  // Separate English tokens (use index) from non-English tokens (scan all)
  const englishTokens = tokens.filter(isEnglishToken);

  // Use index for English tokens: get candidate sentence IDs
  // Strip non-alphanumeric chars so "morning." → "morning" for index lookup
  // Collect all non-empty candidate sets, then intersect them
  const candidateIdSets: Set<string>[] = [];
  for (const token of englishTokens) {
    const lowerToken = token.toLowerCase();
    // Strip non-alphanumeric chars for index lookup (handles "morning.", "stop!" etc.)
    const indexWord = lowerToken.replace(/[^a-z0-9]/g, '');
    const ids = getByWord(indexWord);
    if (ids.length > 0) {
      candidateIdSets.push(new Set(ids));
    }
  }

  // Determine the candidate set:
  // - If we have index matches for English tokens: intersect them
  // - If ALL English tokens had no index match: use all sentences (fallback to scan)
  // - If MIX (some have matches, some don't): use intersection of matches (AND logic)
  let candidateSet: Set<string>;
  if (candidateIdSets.length === 0) {
    // No English tokens had any index matches → fall back to scanning all
    candidateSet = new Set(sentences.map(s => s.id));
  } else if (candidateIdSets.length === englishTokens.length) {
    // All English tokens had index matches → intersect
    candidateSet = candidateIdSets[0];
    for (let i = 1; i < candidateIdSets.length; i++) {
      candidateSet = new Set(
        [...candidateSet].filter(id => candidateIdSets[i].has(id))
      );
      if (candidateSet.size === 0) {
        return []; // Early exit: no sentence matches all tokens
      }
    }
  } else {
    // Some English tokens had no matches → AND logic means no results
    return [];
  }

  // Now filter candidates with exact text matching
  // AND logic: sentence must contain ALL tokens
  return sentences.filter(sentence => {
    // Skip if not in candidate set
    if (!candidateSet.has(sentence.id)) {
      return false;
    }

    // Check all tokens
    const word = sentence.blanks[0]?.word?.toLowerCase() || '';
    const english = sentence.english.toLowerCase();
    const chinese = sentence.chinese.toLowerCase();

    for (const token of tokens) {
      const lowerToken = token.toLowerCase();
      // Escape special regex characters in token
      const escaped = escapeRegex(lowerToken);
      const tokenRegex = new RegExp(escaped, 'i');

      const matchesWord = tokenRegex.test(word);
      const matchesEnglish = tokenRegex.test(english);
      const matchesChinese = tokenRegex.test(chinese);

      // Token must match at least one field
      if (!matchesWord && !matchesEnglish && !matchesChinese) {
        return false;
      }
    }

    return true;
  });
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