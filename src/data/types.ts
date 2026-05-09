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
