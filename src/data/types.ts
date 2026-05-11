export interface Blank {
  word: string;
  hint?: string;
}

export interface Sentence {
  id: string;
  english: string;
  chinese: string;
  blanks: Blank[];
  level: string;
}

/**
 * Checks if a sentence is a definition sentence.
 * Definition sentences are dictionary-style definitions where the target word
 * appears wrapped in quotes (single or double) in the English text.
 * Example: "a person who leads" or 'someone who is brave'
 */
export function isDefinitionSentence(sentence: Sentence): boolean {
  // Definition sentences have exactly one blank
  if (sentence.blanks.length !== 1) {
    return false;
  }

  const targetWord = sentence.blanks[0].word.toLowerCase();
  const englishText = sentence.english;

  // Check if the english text contains any quoted text that includes the target word
  // Match both single quotes 'word' and double quotes "word"
  const quotedPattern = /['"][^'"]+['"]/g;
  const matches = englishText.match(quotedPattern) || [];

  for (const match of matches) {
    // Remove quotes and convert to lowercase for comparison
    const quotedWord = match.slice(1, -1).toLowerCase();
    if (quotedWord === targetWord || quotedWord.includes(targetWord)) {
      return true;
    }
  }

  return false;
}

export interface Dictionary {
  id: string;
  name: string;
  description: string;
  sentenceCount: number;
}

export interface Mistake {
  sentenceId: string;
  wrongAnswers: string[];
  correctAnswers: string[];
  attempts: number;
  timestamp: number;
  dictionaryId: string;
  reviewedCount: number;
  nextReviewAt?: number;
  lastReviewedAt?: number;
}

export const REVIEW_INTERVALS = [1, 3, 7, 14] as const;

export interface SentenceToken {
  id: string;
  text: string;
}

export interface SessionHistory {
  id: string;
  timestamp: number;
  duration: number;
  dictionaryId: string;
  dictionaryName: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
}

export interface XPProfile {
  totalXP: number;
  currentLevel: number;
  levelProgress: number;
}

export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3300, 4000] as const;

export type PracticeMode = 'fill-in-blanks' | 'dictation' | 'multiple-choice' | 'sentence-reorder';

export type ChallengeType = 'correct' | 'answer' | 'streak';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  rewardXP: number;
}

export interface DailyChallengeState {
  date: string;
  challenges: DailyChallenge[];
}

export type BadgeCategory = 'answer' | 'streak' | 'level' | 'session' | 'review' | 'challenge' | 'special';

export type BadgeConditionType =
  | 'total_answered'
  | 'total_correct'
  | 'max_streak'
  | 'level'
  | 'total_sessions'
  | 'perfect_sessions'
  | 'total_reviews'
  | 'total_challenges';

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  conditionType: BadgeConditionType;
  conditionValue: number;
}

export interface UnlockedBadge {
  id: string;
  unlockedAt: number;
}

export interface BadgeProgress {
  totalAnswered: number;
  totalCorrect: number;
  totalSessions: number;
  maxStreakEver: number;
  perfectSessions: number;
  totalReviews: number;
  totalChallengesCompleted: number;
}

export interface BadgeState {
  unlocked: UnlockedBadge[];
  progress: BadgeProgress;
}

export type LeaderboardCategory = 'score' | 'accuracy' | 'speed';

export type LeaderboardTimeFilter = 'today' | 'week' | 'all';

export interface LeaderboardEntry {
  rank: number;
  sessionId: string;
  dictionaryName: string;
  score: number;
  accuracy: number;
  speed: number; // points per minute, rounded to 1 decimal
  timestamp: number;
}

// Multiple-choice option type for practice mode
export interface ChoiceOption {
  id: string;
  text: string;
}

/**
 * Share format types for tracking share operations.
 */
export type ShareFormat = 'text' | 'image';

/**
 * Share metrics for tracking share effect data.
 * Used to analyze which share formats and triggers are most effective.
 */
export interface ShareMetrics {
  /** Total number of successful shares */
  totalShareCount: number;
  /** Share counts grouped by format type */
  formatCounts: Record<ShareFormat, number>;
  /** Share counts grouped by trigger type */
  typeCounts: Record<string, number>;
  /** Timestamp of the most recent share */
  lastShareAt: number | null;
  /** Timestamp of the first share ever */
  firstShareAt: number | null;
}

/**
 * Data model for the share card UI.
 * Aggregates data from XP system, session results, badges, and leaderboard.
 */
export interface ShareCardData {
  /** XP profile data */
  xp: {
    totalXP: number;
    currentLevel: number;
    levelProgress: number;
  };
  /** Session result statistics */
  session: {
    score: number;
    accuracy: number;
    streak: number;
  };
  /** Top 3 unlocked badges with their icons (most recent first) */
  badges: Array<{
    id: string;
    icon: string;
  }>;
  /** Leaderboard rank position */
  rank: number;
  /** App branding identifier */
  appName: string;
}

/**
 * Personal word stored by the user in their personal dictionary.
 * Used for the dictionary browser feature and persists across sessions.
 */
export interface PersonalWord {
  /** The English word */
  word: string;
  /** Chinese translation */
  translation: string;
  /** English example sentence */
  exampleSentence: string;
  /** Chinese translation of example */
  exampleSentenceCn: string;
  /** Whether user marked it as a new word */
  marked: boolean;
  /** Timestamp when marked */
  markedAt: number;
  /** Sentence ID for matching with dictionary entries (optional, for future use) */
  sentenceId?: string;
}

/**
 * Strategy for choosing wrong answer distractors in multiple-choice practice.
 * - 'random': Choose distractors randomly
 * - 'history-based': Choose distractors based on user's mistake history
 * - 'mixed': Blend random and history-based selection
 */
export type AdaptiveDistractorStrategy = 'random' | 'history-based' | 'mixed';

/**
 * Configuration for adaptive distractor selection.
 */
export interface AdaptiveConfig {
  /** Strategy for choosing wrong answer options */
  strategy: AdaptiveDistractorStrategy;
  /** Weight for history-based selection (0-1), used in 'mixed' mode */
  historyWeight: number;
}

/**
 * Hint level for controlling how often hints are shown to the user.
 * - 'none': Never show hints (except manual trigger)
 * - 'low': Show hints with 20% probability
 * - 'medium': Show hints with 50% probability (default)
 * - 'high': Always show hints
 */
export type HintLevel = 'none' | 'low' | 'medium' | 'high';

/**
 * Configuration for hint level behavior.
 */
export interface HintConfig {
  /** Current hint level */
  level: HintLevel;
  /** Number of consecutive correct answers (triggers level increase) */
  consecutiveCorrect: number;
  /** Number of consecutive wrong answers (triggers level decrease) */
  consecutiveWrong: number;
}

/**
 * Default hint config values.
 */
export const DEFAULT_HINT_CONFIG: HintConfig = {
  level: 'medium',
  consecutiveCorrect: 0,
  consecutiveWrong: 0,
};

/**
 * Thresholds for automatic hint level adjustment.
 */
export const HINT_ADJUSTMENT_THRESHOLDS = {
  /** Number of consecutive correct answers to increase to 'high' */
  correctToHigh: 5,
  /** Number of consecutive wrong answers to decrease to 'none' */
  wrongToNone: 3,
} as const;

/**
 * Probabilities for showing hints at each level.
 */
export const HINT_PROBABILITIES: Record<HintLevel, number> = {
  none: 0,
  low: 0.2,
  medium: 0.5,
  high: 1,
} as const;

/**
 * Mode accuracy data for radar chart display.
 */
export interface ModeAccuracy {
  mode: PracticeMode;
  accuracy: number;
  totalQuestions: number;
  correctCount: number;
}

/**
 * Daily trend data for progress chart display.
 */
export interface DailyTrend {
  date: string;
  dayName: string;
  xp: number;
  questions: number;
  accuracy: number;
}
