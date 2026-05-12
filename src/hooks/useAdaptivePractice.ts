import type { Sentence, ChoiceOption, AdaptiveConfig } from '@/data/types';
import { isDefinitionSentence } from '@/data/types';
import { storage } from '@/services/storage';
import { personalWordToSentence } from '@/data/personalWordIndex';

/**
 * Hook providing adaptive distractor selection for multiple-choice practice.
 *
 * The key insight: if a user picked wrong sentence "A" multiple times when the
 * correct answer was sentence "B", then "A" is a good distractor for "B".
 */
export function useAdaptivePractice() {
  /**
   * Get smart distractors based on the adaptive config strategy.
   *
   * @param sentenceId - The ID of the current sentence (to look up mistake history)
   * @param correctAnswerId - The ID of the correct answer
   * @param allSentences - All available sentences to choose from
   * @returns Array of 4 ChoiceOptions (1 correct + 3 distractors)
   */
  function getSmartDistractors(
    sentenceId: string,
    correctAnswerId: string,
    allSentences: Sentence[]
  ): ChoiceOption[] {
    if (allSentences.length < 4) {
      return [];
    }

    // Load config and mistakes
    const config: AdaptiveConfig = storage.getAdaptiveConfig();
    const mistakes = storage.getMistakes();

    const strategy = config.strategy;

    // Strategy: random - return shuffled random distractors
    if (strategy === 'random' || mistakes.length === 0) {
      return getRandomDistractors(correctAnswerId, allSentences);
    }

    // Strategy: history-based or mixed
    if (strategy === 'history-based' || strategy === 'mixed') {
      return getHistoryBasedDistractors(sentenceId, correctAnswerId, allSentences, mistakes);
    }

    // Fallback: random
    return getRandomDistractors(correctAnswerId, allSentences);
  }

  return {
    getSmartDistractors,
    config: storage.getAdaptiveConfig(),
  };
}

/**
 * Get random distractors (baseline strategy).
 * Uses personal word sentences as additional distractor pool.
 */
function getRandomDistractors(correctAnswerId: string, allSentences: Sentence[]): ChoiceOption[] {
  const correctSentence = allSentences.find((s) => s.id === correctAnswerId);
  if (!correctSentence) {
    return [];
  }

  // Get personal word sentences as additional distractor pool
  const personalWords = storage.getPersonalWords();
  const personalWordSentences: Sentence[] = personalWords
    .filter((pw) => pw.word)
    .slice(0, 20) // Limit to 20 for performance
    .map((pw, i) => personalWordToSentence(pw, `pw-distractor-${i}`));

  // Combine dictionary sentences and personal word sentences
  const combinedPool = [...allSentences, ...personalWordSentences];

  // Get all non-correct candidates and filter out too-similar ones
  const rawDistractors = combinedPool.filter((s) => s.id !== correctAnswerId);
  const filteredDistractors = filterSimilarDistractors(correctSentence, rawDistractors);

  // Prefer filtered (if we have enough), otherwise fall back to raw
  const pool = filteredDistractors.length >= 3 ? filteredDistractors : rawDistractors;
  const finalPool = pool.length >= 3 ? pool : rawDistractors;

  return [correctSentence, ...finalPool]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
    .map((s) => sentenceToChoiceOption(s));
}

/**
 * Get distractors based on user's mistake history.
 *
 * Logic:
 * 1. Find mistakes where user selected wrong answers containing the current sentence ID
 * 2. Those wrong sentences become distractor candidates
 * 3. Sort by frequency of being confused with
 * 4. Take top N distractors (N = min(3, candidates.length))
 * 5. Fill remaining with random from allSentences
 */
function getHistoryBasedDistractors(
  sentenceId: string,
  correctAnswerId: string,
  allSentences: Sentence[],
  mistakes: ReturnType<typeof storage.getMistakes>
): ChoiceOption[] {
  // Find mistakes where this sentence was the correct answer
  // and user selected wrong answers
  const relevantMistakes = mistakes.filter(
    (m) => m.sentenceId === sentenceId && m.wrongAnswers.length > 0
  );

  // Count frequency of each wrong answer being selected
  const candidateFrequency = new Map<string, number>();
  for (const mistake of relevantMistakes) {
    for (const wrongAnswerId of mistake.wrongAnswers) {
      // Only consider wrong answers that are valid sentences in our pool
      const exists = allSentences.some((s) => s.id === wrongAnswerId && s.id !== correctAnswerId);
      if (exists) {
        candidateFrequency.set(wrongAnswerId, (candidateFrequency.get(wrongAnswerId) || 0) + 1);
      }
    }
  }

  // Sort candidates by frequency (most confused first)
  const sortedCandidates = Array.from(candidateFrequency.entries())
    .sort((a, b) => b[1] - a[1]) // descending by frequency
    .map(([id]) => id);

  // Determine how many history-based distractors to use
  const historyCount = sortedCandidates.length;

  // Take top N history-based distractors
  const historyDistractors = sortedCandidates
    .slice(0, Math.min(3, historyCount))
    .map((id) => allSentences.find((s) => s.id === id)!)
    .filter((s) => s !== undefined);

  // Fill remaining slots with random distractors
  const remainingCount = 3 - historyDistractors.length;
  const usedIds = new Set([correctAnswerId, ...historyDistractors.map((s) => s.id)]);
  const randomDistractors = allSentences
    .filter((s) => !usedIds.has(s.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, remainingCount);

  const correctSentence = allSentences.find((s) => s.id === correctAnswerId);
  if (!correctSentence) {
    return [];
  }

  // Combine and shuffle
  return [correctSentence, ...historyDistractors, ...randomDistractors]
    .sort(() => Math.random() - 0.5)
    .map((s) => sentenceToChoiceOption(s));
}

/**
 * Convert a Sentence to a ChoiceOption.
 * Uses Chinese translation for definition sentences, full English for others.
 */
function sentenceToChoiceOption(sentence: Sentence): ChoiceOption {
  return {
    id: sentence.id,
    text: isDefinitionSentence(sentence) ? sentence.chinese : sentence.english,
  };
}

/**
 * Check if two sentences are too similar to be useful as distractor + correct pair.
 * For definition sentences: rejects if Chinese text is identical.
 * For normal sentences: rejects if English word overlap > 60%.
 */
function isTooSimilar(a: Sentence, b: Sentence): boolean {
  const aIsDef = isDefinitionSentence(a);
  const bIsDef = isDefinitionSentence(b);

  // Same type: direct comparison
  if (aIsDef === bIsDef) {
    if (aIsDef) {
      // Both definition: reject if Chinese is identical
      return a.chinese.trim() === b.chinese.trim();
    } else {
      // Both normal: check word overlap
      const aWords = new Set(a.english.toLowerCase().match(/\b[a-z]+\b/g) || []);
      const bWords = new Set(b.english.toLowerCase().match(/\b[a-z]+\b/g) || []);
      if (aWords.size === 0 || bWords.size === 0) return false;
      const intersection = [...aWords].filter(w => bWords.has(w)).length;
      const overlap = intersection / Math.max(aWords.size, bWords.size);
      return overlap > 0.6;
    }
  }

  // Mixed: reject if English words heavily overlap
  const aWords = new Set(a.english.toLowerCase().match(/\b[a-z]+\b/g) || []);
  const bWords = new Set(b.english.toLowerCase().match(/\b[a-z]+\b/g) || []);
  if (aWords.size === 0 || bWords.size === 0) return false;
  const intersection = [...aWords].filter(w => bWords.has(w)).length;
  const overlap = intersection / Math.max(aWords.size, bWords.size);
  return overlap > 0.6;
}

/**
 * Filter distractors to ensure they are meaningfully different from the correct answer.
 */
function filterSimilarDistractors(
  correct: Sentence,
  candidates: Sentence[]
): Sentence[] {
  return candidates.filter((s) => !isTooSimilar(correct, s));
}
