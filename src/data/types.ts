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

/**
 * Single review result for tracking practice history.
 */
export interface ReviewResult {
  /** Timestamp of the review (milliseconds) */
  timestamp: number;
  /** Whether the user answered correctly */
  isCorrect: boolean;
  /** The interval in days before this review */
  interval: number;
  /** Next scheduled review date (milliseconds) */
  nextReviewDate: number;
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
  /** History of all review results for spaced repetition tracking */
  reviewHistory?: ReviewResult[];
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

/**
 * Daily review statistics for tracking user review activity.
 * Used by the daily review plan and reminder system.
 */
export interface DailyReviewStats {
  /** The date string in YYYY-MM-DD format */
  date: string;
  /** Number of items reviewed today */
  reviewedCount: number;
  /** Array of sentence IDs that were reviewed today */
  completedReviewIds: string[];
}

/**
 * State wrapper for daily review statistics.
 * Contains the current day's review stats.
 */
export interface DailyReviewState {
  /** Current daily review statistics */
  stats: DailyReviewStats;
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

/**
 * Types of weakness that can be detected.
 * - 'high-error': User has high error rate on this sentence
 * - 'low-accuracy': User's accuracy on this sentence is below threshold
 * - 'review-neglected': User has not reviewed this sentence for a long time
 * - 'mode-weak': User is weak in a specific practice mode for this sentence
 */
export type WeaknessType = 'high-error' | 'low-accuracy' | 'review-neglected' | 'mode-weak';

/**
 * Definition of weakness detection parameters.
 */
export interface WeaknessDefinition {
  /** The type of weakness */
  weakType: WeaknessType;
  /** Accuracy threshold for low-accuracy detection (e.g., 0.6 = 60%) */
  accuracyThreshold: number;
  /** Sentence count threshold for high-error detection */
  sentenceCountThreshold: number;
  /** Days threshold for review-neglected detection */
  reviewNeglectedDays: number;
}

/**
 * Default weakness detection parameters.
 */
export const DEFAULT_WEAKNESS_DEFINITION: WeaknessDefinition = {
  weakType: 'high-error',
  accuracyThreshold: 0.6, // Below 60% accuracy is considered weak
  sentenceCountThreshold: 3, // At least 3 wrong answers to be considered high-error
  reviewNeglectedDays: 7, // Not reviewed in 7+ days
};

/**
 * Represents a detected weakness for a sentence.
 */
export interface Weakness {
  /** The sentence ID with weakness */
  sentenceId: string;
  /** Type of weakness */
  weakType: WeaknessType;
  /** Dictionary this sentence belongs to */
  dictionaryId: string;
  /** Calculated accuracy rate (0-1) */
  accuracy: number;
  /** Total wrong answer count */
  wrongCount: number;
  /** Total correct answer count */
  correctCount: number;
  /** Total review count */
  reviewCount: number;
  /** Days since last review (null if never reviewed) */
  daysSinceLastReview: number | null;
  /** The practice mode this weakness is associated with (for mode-weak) */
  mode?: PracticeMode;
  /** Timestamp when detected */
  detectedAt: number;
}

/**
 * Aggregated weakness statistics.
 */
export interface WeaknessStats {
  /** Total number of weak sentences */
  totalWeakCount: number;
  /** Weaknesses grouped by dictionary ID */
  byDictionary: Record<string, number>;
  /** Weaknesses grouped by weakness type */
  byType: Record<WeaknessType, number>;
  /** Overall strength score (0-100), higher is better */
  overallStrength: number;
}

/**
 * Review streak data for tracking consecutive days of practice.
 * Used by the daily review plan and reminder system (epic-028).
 */
export interface ReviewStreakData {
  /** Current consecutive days of practice */
  currentStreak: number;
  /** Best streak ever achieved */
  longestStreak: number;
  /** Last review date in YYYY-MM-DD format, null if never */
  lastReviewDate: string | null;
  /** Total days with at least one review */
  totalReviewDays: number;
  /** True if streak can continue (practiced today or yesterday) */
  isStreakActive: boolean;
}

/**
 * Types of achievement moments that can be triggered.
 */
export type AchievementMomentType =
  | 'badge-unlock'   // Badge unlocked achievement
  | 'level-up'       // Level upgrade achievement
  | 'streak-milestone' // Streak milestone (7, 14, 30, 100 days)
  | 'xp-milestone'   // XP milestone (100, 500, 1000, 2000, etc.)
  | 'perfect-session'; // Perfect session (100% accuracy, all questions correct)

/**
 * Achievement moment data for display cards.
 * Each moment represents a notable learning achievement.
 */
export interface AchievementMoment {
  /** Unique trigger ID for deduplication */
  id: string;
  /** The type of achievement */
  type: AchievementMomentType;
  /** Headline text (bold, emotional) */
  title: string;
  /** Supporting text or data-driven stats */
  subtitle?: string;
  /** Badge ID for badge-unlock type */
  badgeId?: string;
  /** Badge title for badge-unlock type */
  badgeTitle?: string;
  /** Badge icon name for badge-unlock type */
  badgeIcon?: string;
  /** Current level for level-up type */
  level?: number;
  /** Current streak for streak-milestone type */
  streak?: number;
  /** XP value for xp-milestone type */
  xp?: number;
  /** Total correct answers for xp-milestone type */
  totalCorrect?: number;
  /** Accuracy percentage for perfect-session type */
  accuracy?: number;
  /** Timestamp when this moment was created */
  createdAt: number;
}

/**
 * Weekly report data structure containing stats for a specific week.
 */
export interface WeeklyReport {
  /** Week start date in YYYY-MM-DD format */
  weekStart: string;
  /** Week end date in YYYY-MM-DD format */
  weekEnd: string;
  /** Total XP earned this week */
  xpEarned: number;
  /** Total questions answered this week */
  questionsAnswered: number;
  /** Total correct answers this week */
  correctAnswers: number;
  /** Best streak achieved this week */
  bestStreak: number;
  /** Number of learning days this week */
  learningDays: number;
  /** Total sessions completed this week */
  sessionsCompleted: number;
  /** Accuracy percentage (0-100) */
  accuracy: number;
  /** Comparison with previous week */
  comparison?: {
    xpChange: number; // percentage change
    questionsChange: number;
    accuracyChange: number;
  };
  /** Timestamp when this report was generated */
  generatedAt: number;
}

/**
 * Configuration for weekly report behavior.
 */
export interface WeeklyReportConfig {
  /** Whether weekly report is enabled */
  enabled: boolean;
  /** Last week start date that was shown (to avoid showing the same week twice) */
  lastShownWeekStart: string | null;
  /** Whether user has dismissed the current report */
  dismissed: boolean;
  /** Last dismissal timestamp */
  dismissedAt: number | null;
}

/**
 * Default weekly report config.
 */
export const DEFAULT_WEEKLY_REPORT_CONFIG: WeeklyReportConfig = {
  enabled: true,
  lastShownWeekStart: null,
  dismissed: false,
  dismissedAt: null,
};

/**
 * Invite metrics for tracking invite code usage and rewards.
 * Used by the invite friends feature (epic-029).
 */
export interface InviteMetrics {
  /** The user's invite code (8-character alphanumeric, uppercase) */
  inviteCode: string | null;
  /** Number of invite codes shared/sent */
  invitesSent: number;
  /** Number of invites that were accepted by friends */
  invitesAccepted: number;
  /** Total XP rewards earned from accepted invites */
  rewardsEarned: number;
  /** Timestamp when the invite code was first created */
  createdAt: number | null;
  /** Timestamp of the most recent share */
  lastSharedAt: number | null;
}

/**
 * Default invite metrics values.
 */
export const DEFAULT_INVITE_METRICS: InviteMetrics = {
  inviteCode: null,
  invitesSent: 0,
  invitesAccepted: 0,
  rewardsEarned: 0,
  createdAt: null,
  lastSharedAt: null,
};

/**
 * Configuration for invite code generation settings.
 */
export interface InviteConfig {
  /** XP reward amount per accepted invite */
  rewardXPPerInvite: number;
  /** Maximum number of invites a user can send (0 = unlimited) */
  maxInvitesAllowed: number;
}

/**
 * Default invite config values.
 */
export const DEFAULT_INVITE_CONFIG: InviteConfig = {
  rewardXPPerInvite: 50,
  maxInvitesAllowed: 0,
};

// ============================================================================
// Goal System Types (epic-037)
// ============================================================================

/**
 * Types of learning goals users can set.
 * - 'questions': Complete a target number of practice questions
 * - 'xp': Earn a target amount of XP
 * - 'streak': Maintain a consecutive practice streak
 */
export type GoalType = 'questions' | 'xp' | 'streak';

/**
 * Period for goal tracking.
 * - 'daily': Goal resets every day at midnight
 * - 'weekly': Goal resets every Monday
 */
export type GoalPeriod = 'daily' | 'weekly';

/**
 * User-defined learning goal.
 */
export interface Goal {
  /** Unique identifier for this goal instance */
  id: string;
  /** Type of goal (questions / xp / streak) */
  type: GoalType;
  /** Goal period (daily / weekly) */
  period: GoalPeriod;
  /** Display title for this goal */
  title: string;
  /** Target value to achieve */
  target: number;
  /** Current progress toward the target */
  current: number;
  /** Whether the goal has been completed */
  completed: boolean;
  /** Timestamp when this goal was created */
  createdAt: number;
  /** Timestamp when this goal was last updated */
  updatedAt: number;
}

/**
 * State wrapper for user goals.
 * Contains all user goals and tracking metadata.
 */
export interface GoalState {
  /** List of user-defined goals */
  goals: Goal[];
  /** Last update timestamp (milliseconds) */
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Goal Preset Configurations
// ---------------------------------------------------------------------------

/** Preset values for daily question goals */
export const DAILY_QUESTION_PRESETS = [5, 10, 15] as const;

/** Preset values for daily XP goals */
export const DAILY_XP_PRESETS = [50, 100, 150] as const;

/** Preset values for daily streak goals */
export const DAILY_STREAK_PRESETS = [3, 5, 7] as const;

/** Preset values for weekly question goals */
export const WEEKLY_QUESTION_PRESETS = [30, 50, 100] as const;

/** Preset values for weekly XP goals */
export const WEEKLY_XP_PRESETS = [300, 500, 800] as const;

// ============================================================================
// Milestone System Types (epic-037)
// ============================================================================

/**
 * Definition of a learning milestone.
 * Milestones are based on cumulative learning days (totalReviewDays).
 */
export interface MilestoneDefinition {
  /** Unique identifier for this milestone */
  id: string;
  /** Chinese title */
  title: string;
  /** English title */
  titleEn: string;
  /** Emoji icon for display */
  icon: string;
  /** XP reward when this milestone is unlocked */
  xpReward: number;
  /** Required learning days to unlock */
  requiredDays: number;
}

/**
 * Constant milestone definitions based on cumulative learning days.
 */
export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: '7-days',
    title: '初露锋芒',
    titleEn: 'First Week',
    icon: '☀️',
    xpReward: 20,
    requiredDays: 7,
  },
  {
    id: '14-days',
    title: '坚持不懈',
    titleEn: 'Two Weeks',
    icon: '🌟',
    xpReward: 50,
    requiredDays: 14,
  },
  {
    id: '30-days',
    title: '月度学习者',
    titleEn: 'One Month',
    icon: '🌙',
    xpReward: 100,
    requiredDays: 30,
  },
  {
    id: '60-days',
    title: '双月成就',
    titleEn: 'Two Months',
    icon: '⭐',
    xpReward: 200,
    requiredDays: 60,
  },
  {
    id: '90-days',
    title: '季度达人',
    titleEn: 'Three Months',
    icon: '🌈',
    xpReward: 300,
    requiredDays: 90,
  },
  {
    id: '180-days',
    title: '半年坚持',
    titleEn: 'Half Year',
    icon: '🎯',
    xpReward: 500,
    requiredDays: 180,
  },
  {
    id: '365-days',
    title: '年度学习者',
    titleEn: 'One Year',
    icon: '🏆',
    xpReward: 1000,
    requiredDays: 365,
  },
];

/**
 * An unlocked milestone entry.
 */
export interface Milestone {
  /** Milestone definition ID */
  id: string;
  /** Timestamp when this milestone was unlocked (milliseconds) */
  unlockedAt: number;
}

/**
 * State wrapper for milestone tracking.
 */
export interface MilestoneState {
  /** List of unlocked milestones */
  unlockedMilestones: Milestone[];
  /** Last update timestamp (milliseconds) */
  updatedAt: number;
}

// ============================================================================
// Personal Dictionary Types (epic-055 iter-001)
// ============================================================================

/**
 * Special dictionary ID for personal word library practice.
 * Used to distinguish personal dictionary mode from regular dictionary modes.
 */
export const PERSONAL_DICTIONARY_ID = 'personal';

/**
 * Check if a dictionary ID represents the personal dictionary.
 */
export function isPersonalDictionary(dictionaryId: string): boolean {
  return dictionaryId === PERSONAL_DICTIONARY_ID;
}

/**
 * Personal dictionary state for tracking practice sessions.
 * Stores the list of active personal word IDs being practiced.
 */
export interface PersonalDictionary {
  /** Array of personal word IDs for current practice session */
  activeSentenceIds: string[];
  /** Last practice timestamp */
  lastPracticedAt: number | null;
}

// ============================================================================
// Dictionary Index Types (epic-043)
// ============================================================================

/**
 * Represents a single indexed dictionary entry.
 * Contains the sentence ID and positions of the indexed word within that sentence.
 */
export interface IndexEntry {
  /** The sentence ID this entry refers to */
  sentenceId: string;
  /** Character positions where the word appears in the sentence (start index of each occurrence) */
  wordPositions: number[];
}

/**
 * Statistics about the dictionary index.
 */
export interface IndexStats {
  /** Total number of indexed entries */
  totalCount: number;
  /** Distribution of entries by level (level -> count) */
  byLevel: Record<string, number>;
  /** Number of unique words indexed */
  uniqueWords: number;
  /** Time taken to build the index (milliseconds) */
  buildTimeMs: number;
}

/**
 * Dictionary index for O(1) lookup of dictionary sentences.
 * Provides multiple access patterns: by ID, by word, and by level.
 */
export interface DictionaryIndex {
  /** Map of sentence ID -> sentence text for O(1) lookup by ID */
  byId: Map<string, string>;
  /** Map of lowercase word -> array of sentence IDs containing that word */
  byWord: Map<string, IndexEntry[]>;
  /** Map of level -> array of sentence IDs at that level */
  byLevel: Map<string, string[]>;
  /**
   * Get sentence text by ID.
   * @param id - The sentence ID
   * @returns The sentence text, or undefined if not found
   */
  getById(id: string): string | undefined;
  /**
   * Get sentence IDs containing the given word (case-insensitive).
   * @param word - The word to search for
   * @returns Array of sentence IDs containing the word
   */
  getByWord(word: string): string[];
  /**
   * Get all sentence IDs at a given level.
   * @param level - The level to filter by
   * @returns Array of sentence IDs at that level
   */
  getByLevel(level: string): string[];
  /**
   * Get index statistics.
   * @returns IndexStats object with index metrics
   */
  getStats(): IndexStats;
  /**
   * Get all indexed sentence IDs.
   * @returns Array of all sentence IDs in the index
   */
  getIndexedIds(): string[];
}

// ============================================================================
// PersonalWord Index Types (epic-043 iter-004)
// ============================================================================

/**
 * A single indexed entry for a personal word.
 * Contains the word itself and its associated personal word data.
 */
export interface PersonalWordIndexEntry {
  /** The personal word data */
  personalWord: PersonalWord;
  /** Words extracted from the example sentence (lowercase, deduplicated) */
  exampleSentenceWords: string[];
}

/**
 * Personal word index for O(1) lookup of personal words by word or prefix.
 * Indexes both the word itself and words from example sentences.
 */
export interface PersonalWordIndex {
  /** Map of lowercase word -> PersonalWordIndexEntry */
  byWord: Map<string, PersonalWordIndexEntry>;
  /** Get all personal words as Sentence format (for practice mode) */
  getAllAsSentences(): Sentence[];
  /**
   * Check if a word exists in the index.
   * @param word - The word to check (case-insensitive)
   * @returns true if the word exists
   */
  hasWord(word: string): boolean;
  /**
   * Get a personal word entry by exact word match.
   * @param word - The word to search (case-insensitive)
   * @returns The entry if found, undefined otherwise
   */
  getByWord(word: string): PersonalWordIndexEntry | undefined;
  /**
   * Get personal word entries by prefix match.
   * @param prefix - The prefix to search (case-insensitive)
   * @returns Array of entries matching the prefix
   */
  getByPrefix(prefix: string): PersonalWordIndexEntry[];
}
