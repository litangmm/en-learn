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
