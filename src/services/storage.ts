import type { PracticeState } from '@/hooks/usePractice';
import type { Mistake, SessionHistory, XPProfile, DailyChallenge, DailyChallengeState, BadgeProgress, BadgeState, BadgeDefinition, UnlockedBadge, ShareMetrics, PersonalWord, AdaptiveConfig, HintConfig, DailyReviewState, WeeklyReportConfig, InviteMetrics, InviteConfig } from '@/data/types';
import { REVIEW_INTERVALS, DEFAULT_HINT_CONFIG, DEFAULT_WEEKLY_REPORT_CONFIG, DEFAULT_INVITE_METRICS, DEFAULT_INVITE_CONFIG } from '@/data/types';
import { calculateNextReviewInterval, createReviewResult } from './spaced-repetition';

export interface StorageSchemaV1 {
  version: 1;
  dictionaryId: string;
  session: PracticeState;
  timestamp: number;
}

export interface StorageSchemaV2 {
  version: 2;
  dictionaryId: string;
  session: PracticeState;
  timestamp: number;
  mistakes: Mistake[];
}

export type PersistedSession = StorageSchemaV1 | StorageSchemaV2;

const SESSION_KEY = 'en-learn-session';
const MISTAKES_KEY = 'en-learn-mistakes';
const HISTORY_KEY = 'en-learn-history';
const XP_PROFILE_KEY = 'en-learn-xp-profile';
const DAILY_CHALLENGES_KEY = 'en-learn-daily-challenges';
const BADGES_KEY = 'en-learn-badges';
const BADGE_PROGRESS_KEY = 'en-learn-badge-progress';
const SHARE_METRICS_KEY = 'en-learn-share-metrics';
const PERSONAL_WORDS_KEY = 'en-learn-personal-words';
const ADAPTIVE_CONFIG_KEY = 'adaptive_config';
const HINT_CONFIG_KEY = 'hint_config';
const ONBOARDED_KEY = 'en-learn-onboarded';
const DAILY_REVIEW_STATS_KEY = 'en-learn-daily-review-stats';
const WEEKLY_REPORT_CONFIG_KEY = 'en-learn-weekly-report-config';
const INVITE_METRICS_KEY = 'en-learn-invite-metrics';
const INVITE_CONFIG_KEY = 'en-learn-invite-config';
const MAX_HISTORY_ENTRIES = 100;
const INVITE_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const INVITE_CODE_LENGTH = 8;

function isValidV1Session(data: unknown): data is StorageSchemaV1 {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) {
    return false;
  }

  if (typeof obj.dictionaryId !== 'string') {
    return false;
  }

  if (typeof obj.timestamp !== 'number') {
    return false;
  }

  if (typeof obj.session !== 'object' || obj.session === null) {
    return false;
  }

  const session = obj.session as Record<string, unknown>;

  if (typeof session.currentIndex !== 'number') {
    return false;
  }

  if (!Array.isArray(session.userAnswers)) {
    return false;
  }

  if (!Array.isArray(session.currentInputs)) {
    return false;
  }

  if (typeof session.showResult !== 'boolean') {
    return false;
  }

  if (typeof session.isCorrect !== 'boolean') {
    return false;
  }

  if (typeof session.attempts !== 'number') {
    return false;
  }

  if (typeof session.isComplete !== 'boolean') {
    return false;
  }

  if (typeof session.score !== 'number') {
    return false;
  }

  return true;
}

function isValidV2Session(data: unknown): data is StorageSchemaV2 {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== 2) {
    return false;
  }

  if (typeof obj.dictionaryId !== 'string') {
    return false;
  }

  if (typeof obj.timestamp !== 'number') {
    return false;
  }

  if (typeof obj.session !== 'object' || obj.session === null) {
    return false;
  }

  const session = obj.session as Record<string, unknown>;

  if (typeof session.currentIndex !== 'number') {
    return false;
  }

  if (!Array.isArray(session.userAnswers)) {
    return false;
  }

  if (!Array.isArray(session.currentInputs)) {
    return false;
  }

  if (typeof session.showResult !== 'boolean') {
    return false;
  }

  if (typeof session.isCorrect !== 'boolean') {
    return false;
  }

  if (typeof session.attempts !== 'number') {
    return false;
  }

  if (typeof session.isComplete !== 'boolean') {
    return false;
  }

  if (typeof session.score !== 'number') {
    return false;
  }

  if (!Array.isArray(obj.mistakes)) {
    return false;
  }

  return true;
}

function isValidMistake(data: unknown): data is Mistake {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.sentenceId !== 'string') {
    return false;
  }

  if (!Array.isArray(obj.wrongAnswers)) {
    return false;
  }

  if (!Array.isArray(obj.correctAnswers)) {
    return false;
  }

  if (typeof obj.attempts !== 'number') {
    return false;
  }

  if (typeof obj.timestamp !== 'number') {
    return false;
  }

  if (typeof obj.dictionaryId !== 'string') {
    return false;
  }

  if (typeof obj.reviewedCount !== 'number') {
    return false;
  }

  // Optional fields: if present, must be number
  if (obj.nextReviewAt !== undefined && typeof obj.nextReviewAt !== 'number') {
    return false;
  }

  if (obj.lastReviewedAt !== undefined && typeof obj.lastReviewedAt !== 'number') {
    return false;
  }

  // reviewHistory is optional; if present, must be an array of valid ReviewResult
  if (obj.reviewHistory !== undefined) {
    if (!Array.isArray(obj.reviewHistory)) {
      return false;
    }
    for (const review of obj.reviewHistory) {
      if (typeof review !== 'object' || review === null) {
        return false;
      }
      const r = review as Record<string, unknown>;
      if (typeof r.timestamp !== 'number') return false;
      if (typeof r.isCorrect !== 'boolean') return false;
      if (typeof r.interval !== 'number') return false;
      if (typeof r.nextReviewDate !== 'number') return false;
    }
  }

  return true;
}

function isValidXPProfile(data: unknown): data is XPProfile {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.totalXP !== 'number') {
    return false;
  }

  if (typeof obj.currentLevel !== 'number' || obj.currentLevel < 1) {
    return false;
  }

  if (typeof obj.levelProgress !== 'number') {
    return false;
  }

  return true;
}

function isValidDailyChallenge(data: unknown): data is DailyChallenge {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== 'string') {
    return false;
  }

  if (typeof obj.title !== 'string') {
    return false;
  }

  if (typeof obj.description !== 'string') {
    return false;
  }

  if (obj.type !== 'correct' && obj.type !== 'answer' && obj.type !== 'streak') {
    return false;
  }

  if (typeof obj.target !== 'number') {
    return false;
  }

  if (typeof obj.current !== 'number') {
    return false;
  }

  if (typeof obj.completed !== 'boolean') {
    return false;
  }

  if (typeof obj.claimed !== 'boolean') {
    return false;
  }

  if (typeof obj.rewardXP !== 'number') {
    return false;
  }

  return true;
}

function isValidDailyChallengeState(data: unknown): data is DailyChallengeState {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.date !== 'string') {
    return false;
  }

  if (!Array.isArray(obj.challenges)) {
    return false;
  }

  if (!obj.challenges.every(isValidDailyChallenge)) {
    return false;
  }

  return true;
}

function isValidDailyReviewStats(data: unknown): data is DailyReviewState {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.stats !== 'object' || obj.stats === null) {
    return false;
  }

  const stats = obj.stats as Record<string, unknown>;

  if (typeof stats.date !== 'string') {
    return false;
  }

  if (typeof stats.reviewedCount !== 'number') {
    return false;
  }

  if (!Array.isArray(stats.completedReviewIds)) {
    return false;
  }

  // Verify all completedReviewIds are strings
  if (!stats.completedReviewIds.every((id) => typeof id === 'string')) {
    return false;
  }

  return true;
}

function isValidWeeklyReportConfig(data: unknown): data is WeeklyReportConfig {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.enabled !== 'boolean') {
    return false;
  }

  if (obj.lastShownWeekStart !== null && typeof obj.lastShownWeekStart !== 'string') {
    return false;
  }

  if (typeof obj.dismissed !== 'boolean') {
    return false;
  }

  if (obj.dismissedAt !== null && typeof obj.dismissedAt !== 'number') {
    return false;
  }

  return true;
}

function isValidInviteMetrics(data: unknown): data is InviteMetrics {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (obj.inviteCode !== null && typeof obj.inviteCode !== 'string') {
    return false;
  }

  if (typeof obj.invitesSent !== 'number') {
    return false;
  }

  if (typeof obj.invitesAccepted !== 'number') {
    return false;
  }

  if (typeof obj.rewardsEarned !== 'number') {
    return false;
  }

  if (obj.createdAt !== null && typeof obj.createdAt !== 'number') {
    return false;
  }

  if (obj.lastSharedAt !== null && typeof obj.lastSharedAt !== 'number') {
    return false;
  }

  return true;
}

function isValidInviteConfig(data: unknown): data is InviteConfig {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.rewardXPPerInvite !== 'number') {
    return false;
  }

  if (typeof obj.maxInvitesAllowed !== 'number') {
    return false;
  }

  return true;
}

function isValidBadgeProgress(data: unknown): data is BadgeProgress {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.totalAnswered !== 'number') return false;
  if (typeof obj.totalCorrect !== 'number') return false;
  if (typeof obj.totalSessions !== 'number') return false;
  if (typeof obj.maxStreakEver !== 'number') return false;
  if (typeof obj.perfectSessions !== 'number') return false;
  if (typeof obj.totalReviews !== 'number') return false;
  if (typeof obj.totalChallengesCompleted !== 'number') return false;

  return true;
}

function isValidUnlockedBadge(data: unknown): data is UnlockedBadge {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== 'string') return false;
  if (typeof obj.unlockedAt !== 'number') return false;

  return true;
}

function isValidBadgeState(data: unknown): data is BadgeState {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.unlocked)) return false;
  if (!obj.unlocked.every(isValidUnlockedBadge)) return false;
  if (typeof obj.progress !== 'object' || obj.progress === null) return false;
  if (!isValidBadgeProgress(obj.progress)) return false;

  return true;
}

function isValidPersonalWord(data: unknown): data is PersonalWord {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.word !== 'string') {
    return false;
  }

  if (typeof obj.translation !== 'string') {
    return false;
  }

  if (typeof obj.exampleSentence !== 'string') {
    return false;
  }

  if (typeof obj.exampleSentenceCn !== 'string') {
    return false;
  }

  if (typeof obj.marked !== 'boolean') {
    return false;
  }

  if (typeof obj.markedAt !== 'number') {
    return false;
  }

  // sentenceId is optional; if present, must be string
  if (obj.sentenceId !== undefined && typeof obj.sentenceId !== 'string') {
    return false;
  }

  return true;
}

export const DEFAULT_BADGE_PROGRESS: BadgeProgress = {
  totalAnswered: 0,
  totalCorrect: 0,
  totalSessions: 0,
  maxStreakEver: 0,
  perfectSessions: 0,
  totalReviews: 0,
  totalChallengesCompleted: 0,
};

export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  strategy: 'random',
  historyWeight: 0.5,
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'first-steps', title: '初次尝试', description: '完成第一道题', category: 'answer', icon: 'Footprints', conditionType: 'total_answered', conditionValue: 1 },
  { id: 'correct-10', title: '答对 10 题', description: '累计答对 10 道题', category: 'answer', icon: 'CheckCircle2', conditionType: 'total_correct', conditionValue: 10 },
  { id: 'correct-50', title: '答对 50 题', description: '累计答对 50 道题', category: 'answer', icon: 'CheckCircle2', conditionType: 'total_correct', conditionValue: 50 },
  { id: 'correct-100', title: '答对 100 题', description: '累计答对 100 道题', category: 'answer', icon: 'CheckCircle2', conditionType: 'total_correct', conditionValue: 100 },
  { id: 'streak-5', title: '连对 5 题', description: '连续答对 5 道题', category: 'streak', icon: 'Flame', conditionType: 'max_streak', conditionValue: 5 },
  { id: 'streak-10', title: '连对 10 题', description: '连续答对 10 道题', category: 'streak', icon: 'Flame', conditionType: 'max_streak', conditionValue: 10 },
  { id: 'level-3', title: '等级 3', description: '达到等级 3', category: 'level', icon: 'Trophy', conditionType: 'level', conditionValue: 3 },
  { id: 'level-5', title: '等级 5', description: '达到等级 5', category: 'level', icon: 'Trophy', conditionType: 'level', conditionValue: 5 },
  { id: 'session-10', title: '完成 10 次练习', description: '累计完成 10 次练习', category: 'session', icon: 'BookOpen', conditionType: 'total_sessions', conditionValue: 10 },
  { id: 'perfect-session', title: '完美练习', description: '完成一次全对练习', category: 'session', icon: 'Star', conditionType: 'perfect_sessions', conditionValue: 1 },
  { id: 'review-10', title: '复习 10 次', description: '累计复习 10 次', category: 'review', icon: 'RefreshCw', conditionType: 'total_reviews', conditionValue: 10 },
  { id: 'challenge-7', title: '挑战 7 次', description: '累计完成 7 次每日挑战', category: 'challenge', icon: 'Target', conditionType: 'total_challenges', conditionValue: 7 },
];

function isValidHistory(data: unknown): data is SessionHistory {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== 'string') {
    return false;
  }

  if (typeof obj.timestamp !== 'number') {
    return false;
  }

  if (typeof obj.duration !== 'number') {
    return false;
  }

  if (typeof obj.dictionaryId !== 'string') {
    return false;
  }

  if (typeof obj.dictionaryName !== 'string') {
    return false;
  }

  if (typeof obj.score !== 'number') {
    return false;
  }

  if (typeof obj.totalQuestions !== 'number') {
    return false;
  }

  if (typeof obj.correctCount !== 'number') {
    return false;
  }

  if (typeof obj.accuracy !== 'number') {
    return false;
  }

  return true;
}

function loadHistory(): SessionHistory[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (raw === null) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[StorageService] Corrupted history data, clearing');
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.warn('[StorageService] Invalid history schema, clearing');
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }

  const validHistory = parsed.filter(isValidHistory);
  if (validHistory.length !== parsed.length) {
    console.warn('[StorageService] Some history entries were invalid and filtered out');
  }

  return validHistory;
}

function saveHistory(history: SessionHistory[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('[StorageService] Failed to save history:', error);
  }
}

function loadMistakes(): Mistake[] {
  const raw = localStorage.getItem(MISTAKES_KEY);
  if (raw === null) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[StorageService] Corrupted mistakes data, clearing');
    localStorage.removeItem(MISTAKES_KEY);
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.warn('[StorageService] Invalid mistakes schema, clearing');
    localStorage.removeItem(MISTAKES_KEY);
    return [];
  }

  const validMistakes = parsed.filter(isValidMistake);
  if (validMistakes.length !== parsed.length) {
    console.warn('[StorageService] Some mistakes were invalid and filtered out');
  }

  return validMistakes;
}

function saveMistakes(mistakes: Mistake[]): void {
  try {
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
  } catch (error) {
    console.warn('[StorageService] Failed to save mistakes:', error);
  }
}

function loadPersonalWords(): PersonalWord[] {
  const raw = localStorage.getItem(PERSONAL_WORDS_KEY);
  if (raw === null) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[StorageService] Corrupted personal words data, clearing');
    localStorage.removeItem(PERSONAL_WORDS_KEY);
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.warn('[StorageService] Invalid personal words schema, clearing');
    localStorage.removeItem(PERSONAL_WORDS_KEY);
    return [];
  }

  const validWords = parsed.filter(isValidPersonalWord);
  if (validWords.length !== parsed.length) {
    console.warn('[StorageService] Some personal word entries were invalid and filtered out');
  }

  return validWords;
}

function savePersonalWords(words: PersonalWord[]): void {
  try {
    localStorage.setItem(PERSONAL_WORDS_KEY, JSON.stringify(words));
  } catch (error) {
    console.warn('[StorageService] Failed to save personal words:', error);
  }
}

function loadAdaptiveConfig(): AdaptiveConfig | null {
  const raw = localStorage.getItem(ADAPTIVE_CONFIG_KEY);
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[StorageService] Corrupted adaptive config data, clearing');
    localStorage.removeItem(ADAPTIVE_CONFIG_KEY);
    return null;
  }

  if (typeof parsed === 'object' && parsed !== null && 'strategy' in parsed && 'historyWeight' in parsed) {
    const obj = parsed as Record<string, unknown>;
    const validStrategies = ['random', 'history-based', 'mixed'];
    if (typeof obj.strategy === 'string' && validStrategies.includes(obj.strategy) && typeof obj.historyWeight === 'number') {
      return parsed as AdaptiveConfig;
    }
  }

  console.warn('[StorageService] Invalid adaptive config schema, clearing');
  localStorage.removeItem(ADAPTIVE_CONFIG_KEY);
  return null;
}

function saveAdaptiveConfig(config: AdaptiveConfig): void {
  try {
    localStorage.setItem(ADAPTIVE_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('[StorageService] Failed to save adaptive config:', error);
  }
}

function loadHintConfig(): HintConfig | null {
  const raw = localStorage.getItem(HINT_CONFIG_KEY);
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[StorageService] Corrupted hint config data, clearing');
    localStorage.removeItem(HINT_CONFIG_KEY);
    return null;
  }

  if (typeof parsed === 'object' && parsed !== null && 'level' in parsed && 'consecutiveCorrect' in parsed && 'consecutiveWrong' in parsed) {
    const obj = parsed as Record<string, unknown>;
    const validLevels = ['none', 'low', 'medium', 'high'];
    if (typeof obj.level === 'string' && validLevels.includes(obj.level) &&
        typeof obj.consecutiveCorrect === 'number' && typeof obj.consecutiveWrong === 'number') {
      return parsed as HintConfig;
    }
  }

  console.warn('[StorageService] Invalid hint config schema, clearing');
  localStorage.removeItem(HINT_CONFIG_KEY);
  return null;
}

function saveHintConfig(config: HintConfig): void {
  try {
    localStorage.setItem(HINT_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('[StorageService] Failed to save hint config:', error);
  }
}

function loadDailyChallenges(): DailyChallengeState | null {
  const raw = localStorage.getItem(DAILY_CHALLENGES_KEY);
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[StorageService] Corrupted daily challenges data, clearing');
    localStorage.removeItem(DAILY_CHALLENGES_KEY);
    return null;
  }

  if (!isValidDailyChallengeState(parsed)) {
    console.warn('[StorageService] Invalid daily challenges schema, clearing');
    localStorage.removeItem(DAILY_CHALLENGES_KEY);
    return null;
  }

  return parsed;
}

function saveDailyChallenges(state: DailyChallengeState): void {
  try {
    localStorage.setItem(DAILY_CHALLENGES_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[StorageService] Failed to save daily challenges:', error);
  }
}

function loadReviewStats(): DailyReviewState | null {
  const raw = localStorage.getItem(DAILY_REVIEW_STATS_KEY);
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[StorageService] Corrupted daily review stats data, clearing');
    localStorage.removeItem(DAILY_REVIEW_STATS_KEY);
    return null;
  }

  if (!isValidDailyReviewStats(parsed)) {
    console.warn('[StorageService] Invalid daily review stats schema, clearing');
    localStorage.removeItem(DAILY_REVIEW_STATS_KEY);
    return null;
  }

  return parsed;
}

function saveReviewStats(state: DailyReviewState): void {
  try {
    localStorage.setItem(DAILY_REVIEW_STATS_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[StorageService] Failed to save daily review stats:', error);
  }
}

function loadWeeklyReportConfig(): WeeklyReportConfig | null {
  const raw = localStorage.getItem(WEEKLY_REPORT_CONFIG_KEY);
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[StorageService] Corrupted weekly report config data, clearing');
    localStorage.removeItem(WEEKLY_REPORT_CONFIG_KEY);
    return null;
  }

  if (!isValidWeeklyReportConfig(parsed)) {
    console.warn('[StorageService] Invalid weekly report config schema, clearing');
    localStorage.removeItem(WEEKLY_REPORT_CONFIG_KEY);
    return null;
  }

  return parsed;
}

function saveWeeklyReportConfig(config: WeeklyReportConfig): void {
  try {
    localStorage.setItem(WEEKLY_REPORT_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('[StorageService] Failed to save weekly report config:', error);
  }
}

function loadInviteMetrics(): InviteMetrics | null {
  const raw = localStorage.getItem(INVITE_METRICS_KEY);
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[StorageService] Corrupted invite metrics data, clearing');
    localStorage.removeItem(INVITE_METRICS_KEY);
    return null;
  }

  if (!isValidInviteMetrics(parsed)) {
    console.warn('[StorageService] Invalid invite metrics schema, clearing');
    localStorage.removeItem(INVITE_METRICS_KEY);
    return null;
  }

  return parsed;
}

function saveInviteMetrics(metrics: InviteMetrics): void {
  try {
    localStorage.setItem(INVITE_METRICS_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.warn('[StorageService] Failed to save invite metrics:', error);
  }
}

function loadInviteConfig(): InviteConfig | null {
  const raw = localStorage.getItem(INVITE_CONFIG_KEY);
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[StorageService] Corrupted invite config data, clearing');
    localStorage.removeItem(INVITE_CONFIG_KEY);
    return null;
  }

  if (!isValidInviteConfig(parsed)) {
    console.warn('[StorageService] Invalid invite config schema, clearing');
    localStorage.removeItem(INVITE_CONFIG_KEY);
    return null;
  }

  return parsed;
}

function saveInviteConfig(config: InviteConfig): void {
  try {
    localStorage.setItem(INVITE_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('[StorageService] Failed to save invite config:', error);
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    seed = (seed * 16807 + 0) % 2147483647;
    const j = seed % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const StorageService = {
  saveSession(dictionaryId: string, session: PracticeState): void {
    if (session.isComplete) {
      this.clearSession();
      return;
    }

    const payload: StorageSchemaV2 = {
      version: 2,
      dictionaryId,
      session,
      timestamp: Date.now(),
      mistakes: loadMistakes(),
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('[StorageService] Failed to save session:', error);
    }
  },

  loadSession(): StorageSchemaV2 | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === null) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[StorageService] Corrupted session data, clearing');
      this.clearSession();
      return null;
    }

    if (isValidV2Session(parsed)) {
      return parsed;
    }

    // V1 backward compatibility: migrate to V2
    if (isValidV1Session(parsed)) {
      const migrated: StorageSchemaV2 = {
        version: 2,
        dictionaryId: parsed.dictionaryId,
        session: parsed.session,
        timestamp: parsed.timestamp,
        mistakes: loadMistakes(),
      };
      return migrated;
    }

    console.warn('[StorageService] Invalid session schema, clearing');
    this.clearSession();
    return null;
  },

  /**
   * Clears only the current session state. User progress data (XP profile, badges,
   * badge progress, history, mistakes, and daily challenges) is stored in separate
   * localStorage keys and is preserved. This allows users to restart practice
   * while keeping their accumulated progress.
   */
  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  hasOnboardingComplete(): boolean {
    return localStorage.getItem(ONBOARDED_KEY) !== null;
  },

  setOnboardingComplete(): void {
    localStorage.setItem(ONBOARDED_KEY, 'true');
  },

  hasActiveSession(): boolean {
    const session = this.loadSession();
    if (session === null) {
      return false;
    }
    return !session.session.isComplete;
  },

  getStoredDictionaryId(): string | null {
    const session = this.loadSession();
    if (session === null) {
      return null;
    }
    return session.dictionaryId;
  },

  addMistake(mistake: Mistake): void {
    const mistakes = loadMistakes();
    const existingIndex = mistakes.findIndex((m) => m.sentenceId === mistake.sentenceId);

    if (existingIndex >= 0) {
      // Update existing mistake
      mistakes[existingIndex] = {
        ...mistake,
        reviewedCount: mistakes[existingIndex].reviewedCount,
      };
    } else {
      mistakes.push(mistake);
    }

    saveMistakes(mistakes);
  },

  getMistakes(): Mistake[] {
    return loadMistakes();
  },

  removeMistake(sentenceId: string): void {
    const mistakes = loadMistakes().filter((m) => m.sentenceId !== sentenceId);
    saveMistakes(mistakes);
  },

  clearMistakes(): void {
    localStorage.removeItem(MISTAKES_KEY);
  },

  getMistakeCount(): number {
    return loadMistakes().length;
  },

  incrementReviewedCount(sentenceId: string): void {
    const mistakes = loadMistakes();
    const index = mistakes.findIndex((m) => m.sentenceId === sentenceId);
    if (index >= 0) {
      mistakes[index] = {
        ...mistakes[index],
        reviewedCount: mistakes[index].reviewedCount + 1,
      };
      saveMistakes(mistakes);
    }
  },

  addHistory(entry: SessionHistory): void {
    const history = loadHistory();
    history.unshift(entry);
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.length = MAX_HISTORY_ENTRIES;
    }
    saveHistory(history);
  },

  getHistory(): SessionHistory[] {
    return loadHistory();
  },

  clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  },

  getHistoryCount(): number {
    return loadHistory().length;
  },

  getXPProfile(): XPProfile {
    const raw = localStorage.getItem(XP_PROFILE_KEY);
    if (raw === null) {
      return { totalXP: 0, currentLevel: 1, levelProgress: 0 };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[StorageService] Corrupted XP profile data, resetting');
      localStorage.removeItem(XP_PROFILE_KEY);
      return { totalXP: 0, currentLevel: 1, levelProgress: 0 };
    }

    if (isValidXPProfile(parsed)) {
      return parsed;
    }

    console.warn('[StorageService] Invalid XP profile schema, resetting');
    localStorage.removeItem(XP_PROFILE_KEY);
    return { totalXP: 0, currentLevel: 1, levelProgress: 0 };
  },

  updateXPProfile(profile: XPProfile): void {
    try {
      localStorage.setItem(XP_PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.warn('[StorageService] Failed to save XP profile:', error);
    }
  },

  addXP(amount: number): XPProfile {
    const profile = this.getXPProfile();
    const newTotalXP = profile.totalXP + amount;

    // Find current level based on thresholds
    const thresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3300, 4000];
    let currentLevel = 1;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (newTotalXP >= thresholds[i]) {
        currentLevel = i + 1;
        break;
      }
    }

    // Calculate progress percentage
    const maxLevel = thresholds.length;
    let levelProgress: number;
    if (currentLevel >= maxLevel) {
      levelProgress = 100;
    } else {
      const prevThreshold = thresholds[currentLevel - 1];
      const nextThreshold = thresholds[currentLevel];
      const progressInLevel = newTotalXP - prevThreshold;
      const levelRange = nextThreshold - prevThreshold;
      levelProgress = Math.round((progressInLevel / levelRange) * 100);
      levelProgress = Math.max(0, Math.min(100, levelProgress));
    }

    const updated: XPProfile = {
      totalXP: newTotalXP,
      currentLevel,
      levelProgress,
    };

    this.updateXPProfile(updated);
    return updated;
  },

  getDailyChallenges(): DailyChallengeState | null {
    return loadDailyChallenges();
  },

  saveDailyChallenges(state: DailyChallengeState): void {
    saveDailyChallenges(state);
  },

  getReviewStats(): DailyReviewState {
    const today = new Date().toISOString().split('T')[0];
    const existing = loadReviewStats();

    // If stats exist for today, return them
    if (existing && existing.stats.date === today) {
      return existing;
    }

    // Create new empty stats for today
    const newState: DailyReviewState = {
      stats: {
        date: today,
        reviewedCount: 0,
        completedReviewIds: [],
      },
    };
    saveReviewStats(newState);
    return newState;
  },

  updateReviewStats(sentenceId: string): DailyReviewState {
    const today = new Date().toISOString().split('T')[0];
    const current = this.getReviewStats();

    // If date changed, reset stats for new day
    if (current.stats.date !== today) {
      const newState: DailyReviewState = {
        stats: {
          date: today,
          reviewedCount: 1,
          completedReviewIds: [sentenceId],
        },
      };
      saveReviewStats(newState);
      return newState;
    }

    // Check if already reviewed
    if (current.stats.completedReviewIds.includes(sentenceId)) {
      return current;
    }

    // Add new reviewed item
    const updated: DailyReviewState = {
      stats: {
        date: current.stats.date,
        reviewedCount: current.stats.reviewedCount + 1,
        completedReviewIds: [...current.stats.completedReviewIds, sentenceId],
      },
    };
    saveReviewStats(updated);
    return updated;
  },

  generateDailyChallenges(date: string): DailyChallengeState {
    const pool: Omit<DailyChallenge, 'current' | 'completed' | 'claimed'>[] = [
      { id: 'correct-5', title: '答对 5 题', description: '在练习中答对 5 道题', type: 'correct', target: 5, rewardXP: 20 },
      { id: 'correct-10', title: '答对 10 题', description: '在练习中答对 10 道题', type: 'correct', target: 10, rewardXP: 40 },
      { id: 'answer-10', title: '答题 10 道', description: '完成 10 道练习题', type: 'answer', target: 10, rewardXP: 15 },
      { id: 'answer-20', title: '答题 20 道', description: '完成 20 道练习题', type: 'answer', target: 20, rewardXP: 30 },
      { id: 'streak-3', title: '连对 3 题', description: '连续答对 3 道题', type: 'streak', target: 3, rewardXP: 25 },
      { id: 'streak-5', title: '连对 5 题', description: '连续答对 5 道题', type: 'streak', target: 5, rewardXP: 50 },
    ];

    const seed = hashString(date);
    const shuffled = seededShuffle(pool, seed);
    const selected = shuffled.slice(0, 3);

    const challenges: DailyChallenge[] = selected.map((c) => ({
      ...c,
      current: 0,
      completed: false,
      claimed: false,
    }));

    const state: DailyChallengeState = { date, challenges };
    saveDailyChallenges(state);
    return state;
  },

  getReviewQueue(): Mistake[] {
    const now = Date.now();
    const mistakes = loadMistakes();
    return mistakes
      .filter((m) => m.nextReviewAt === undefined || m.nextReviewAt <= now)
      .sort((a, b) => {
        // Sort by nextReviewAt ascending; undefined (new) items come first
        const aTime = a.nextReviewAt ?? 0;
        const bTime = b.nextReviewAt ?? 0;
        return aTime - bTime;
      });
  },

  getReviewQueueCount(): number {
    return this.getReviewQueue().length;
  },

  scheduleNextReview(sentenceId: string, isCorrect: boolean): void {
    const mistakes = loadMistakes();
    const index = mistakes.findIndex((m) => m.sentenceId === sentenceId);
    if (index < 0) return;

    const mistake = mistakes[index];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let reviewedCount = mistake.reviewedCount;
    let daysInterval: number;

    if (isCorrect) {
      reviewedCount = reviewedCount + 1;
      daysInterval = REVIEW_INTERVALS[Math.min(reviewedCount - 1, REVIEW_INTERVALS.length - 1)];
    } else {
      // Wrong answer: reset interval to 1 day, keep reviewedCount
      daysInterval = REVIEW_INTERVALS[0];
    }

    mistakes[index] = {
      ...mistake,
      reviewedCount,
      nextReviewAt: now + daysInterval * oneDayMs,
      lastReviewedAt: now,
    };

    saveMistakes(mistakes);
  },

  /**
   * Updates a mistake's review result with history tracking.
   * This method is the canonical way to record review outcomes for spaced repetition.
   *
   * @param sentenceId - The sentence ID to update
   * @param isCorrect - Whether the user answered correctly
   * @returns The updated Mistake or undefined if not found
   */
  updateMistakeReviewResult(sentenceId: string, isCorrect: boolean): Mistake | undefined {
    const mistakes = loadMistakes();
    const index = mistakes.findIndex((m) => m.sentenceId === sentenceId);
    if (index < 0) return undefined;

    const mistake = mistakes[index];
    const previousInterval = REVIEW_INTERVALS[
      Math.min(mistake.reviewedCount, REVIEW_INTERVALS.length - 1)
    ];

    // Calculate new interval using SM-2 variant
    const newInterval = calculateNextReviewInterval(previousInterval, isCorrect);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Create review result entry
    const reviewResult = createReviewResult(isCorrect, previousInterval);

    // Update reviewedCount
    const newReviewedCount = isCorrect ? mistake.reviewedCount + 1 : mistake.reviewedCount;

    // Build updated mistake with review history
    const existingHistory = mistake.reviewHistory ?? [];
    const updatedMistake: Mistake = {
      ...mistake,
      reviewedCount: newReviewedCount,
      nextReviewAt: now + newInterval * oneDayMs,
      lastReviewedAt: now,
      reviewHistory: [...existingHistory, reviewResult],
    };

    mistakes[index] = updatedMistake;
    saveMistakes(mistakes);
    return updatedMistake;
  },

  getBadgeProgress(): BadgeProgress {
    const raw = localStorage.getItem(BADGE_PROGRESS_KEY);
    if (raw === null) {
      return { ...DEFAULT_BADGE_PROGRESS };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[StorageService] Corrupted badge progress data, resetting');
      localStorage.removeItem(BADGE_PROGRESS_KEY);
      return { ...DEFAULT_BADGE_PROGRESS };
    }

    if (isValidBadgeProgress(parsed)) {
      return parsed;
    }

    console.warn('[StorageService] Invalid badge progress schema, resetting');
    localStorage.removeItem(BADGE_PROGRESS_KEY);
    return { ...DEFAULT_BADGE_PROGRESS };
  },

  saveBadgeProgress(progress: BadgeProgress): void {
    try {
      localStorage.setItem(BADGE_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn('[StorageService] Failed to save badge progress:', error);
    }
  },

  updateBadgeProgress(updater: (prev: BadgeProgress) => Partial<BadgeProgress>): BadgeProgress {
    const current = this.getBadgeProgress();
    const updates = updater(current);
    const updated: BadgeProgress = { ...current, ...updates };
    this.saveBadgeProgress(updated);
    return updated;
  },

  getBadges(): BadgeState {
    const raw = localStorage.getItem(BADGES_KEY);
    if (raw === null) {
      return { unlocked: [], progress: { ...DEFAULT_BADGE_PROGRESS } };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[StorageService] Corrupted badges data, resetting');
      localStorage.removeItem(BADGES_KEY);
      return { unlocked: [], progress: { ...DEFAULT_BADGE_PROGRESS } };
    }

    if (isValidBadgeState(parsed)) {
      return parsed;
    }

    console.warn('[StorageService] Invalid badges schema, resetting');
    localStorage.removeItem(BADGES_KEY);
    return { unlocked: [], progress: { ...DEFAULT_BADGE_PROGRESS } };
  },

  saveBadges(state: BadgeState): void {
    try {
      localStorage.setItem(BADGES_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('[StorageService] Failed to save badges:', error);
    }
  },

  // Share Metrics CRUD
  getShareMetrics(): ShareMetrics {
    const raw = localStorage.getItem(SHARE_METRICS_KEY);
    if (raw === null) {
      return {
        totalShareCount: 0,
        formatCounts: { text: 0, image: 0 },
        typeCounts: {},
        lastShareAt: null,
        firstShareAt: null,
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[StorageService] Corrupted share metrics data, resetting');
      localStorage.removeItem(SHARE_METRICS_KEY);
      return {
        totalShareCount: 0,
        formatCounts: { text: 0, image: 0 },
        typeCounts: {},
        lastShareAt: null,
        firstShareAt: null,
      };
    }

    if (typeof parsed === 'object' && parsed !== null && 'totalShareCount' in parsed) {
      return parsed as ShareMetrics;
    }

    console.warn('[StorageService] Invalid share metrics schema, resetting');
    localStorage.removeItem(SHARE_METRICS_KEY);
    return {
      totalShareCount: 0,
      formatCounts: { text: 0, image: 0 },
      typeCounts: {},
      lastShareAt: null,
      firstShareAt: null,
    };
  },

  initShareMetrics(): void {
    // Initialize with empty metrics if not exists
    if (localStorage.getItem(SHARE_METRICS_KEY) === null) {
      const emptyMetrics: ShareMetrics = {
        totalShareCount: 0,
        formatCounts: { text: 0, image: 0 },
        typeCounts: {},
        lastShareAt: null,
        firstShareAt: null,
      };
      localStorage.setItem(SHARE_METRICS_KEY, JSON.stringify(emptyMetrics));
    }
  },

  updateShareMetrics(updater: (prev: ShareMetrics) => Partial<ShareMetrics>): ShareMetrics {
    const current = this.getShareMetrics();
    const updates = updater(current);
    const updated: ShareMetrics = { ...current, ...updates };
    try {
      localStorage.setItem(SHARE_METRICS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('[StorageService] Failed to save share metrics:', error);
    }
    return updated;
  },

  // Personal Words CRUD
  addPersonalWord(word: PersonalWord): void {
    const words = loadPersonalWords();
    const existingIndex = words.findIndex((w) => w.word === word.word);
    if (existingIndex >= 0) {
      // Update existing word
      words[existingIndex] = word;
    } else {
      words.push(word);
    }
    savePersonalWords(words);
  },

  getPersonalWords(): PersonalWord[] {
    return loadPersonalWords();
  },

  removePersonalWord(word: string): void {
    const words = loadPersonalWords().filter((w) => w.word !== word);
    savePersonalWords(words);
  },

  getPersonalWordCount(): number {
    return loadPersonalWords().length;
  },

  getAdaptiveConfig(): AdaptiveConfig {
    const config = loadAdaptiveConfig();
    return config ?? { ...DEFAULT_ADAPTIVE_CONFIG };
  },

  setAdaptiveConfig(config: AdaptiveConfig): void {
    saveAdaptiveConfig(config);
  },

  getHintConfig(): HintConfig {
    const config = loadHintConfig();
    return config ?? { ...DEFAULT_HINT_CONFIG };
  },

  setHintConfig(config: HintConfig): void {
    saveHintConfig(config);
  },

  getWeeklyReportConfig(): WeeklyReportConfig {
    const config = loadWeeklyReportConfig();
    return config ?? { ...DEFAULT_WEEKLY_REPORT_CONFIG };
  },

  saveWeeklyReportConfig(config: WeeklyReportConfig): void {
    saveWeeklyReportConfig(config);
  },

  dismissWeeklyReport(): void {
    const config = this.getWeeklyReportConfig();
    config.dismissed = true;
    config.dismissedAt = Date.now();
    this.saveWeeklyReportConfig(config);
  },

  markWeeklyReportShown(weekStart: string): void {
    const config = this.getWeeklyReportConfig();
    config.lastShownWeekStart = weekStart;
    config.dismissed = false;
    config.dismissedAt = null;
    this.saveWeeklyReportConfig(config);
  },

  // Invite Metrics CRUD
  getInviteMetrics(): InviteMetrics {
    const metrics = loadInviteMetrics();
    return metrics ?? { ...DEFAULT_INVITE_METRICS };
  },

  updateInviteMetrics(updater: (prev: InviteMetrics) => Partial<InviteMetrics>): InviteMetrics {
    const current = this.getInviteMetrics();
    const updates = updater(current);
    const updated: InviteMetrics = { ...current, ...updates };
    saveInviteMetrics(updated);
    return updated;
  },

  generateInviteCode(): string {
    let code = '';
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const randomValues = new Uint32Array(INVITE_CODE_LENGTH);
      crypto.getRandomValues(randomValues);
      for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        code += INVITE_CODE_CHARS[randomValues[i] % INVITE_CODE_CHARS.length];
      }
    } else {
      // Fallback to Math.random
      for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
      }
    }
    return code;
  },

  initInviteMetrics(): InviteMetrics {
    const existing = loadInviteMetrics();
    if (existing && existing.inviteCode) {
      return existing;
    }
    const newCode = this.generateInviteCode();
    const metrics: InviteMetrics = {
      ...DEFAULT_INVITE_METRICS,
      inviteCode: newCode,
      createdAt: Date.now(),
    };
    saveInviteMetrics(metrics);
    return metrics;
  },

  getInviteConfig(): InviteConfig {
    const config = loadInviteConfig();
    return config ?? { ...DEFAULT_INVITE_CONFIG };
  },

  setInviteConfig(config: InviteConfig): void {
    saveInviteConfig(config);
  },

  exportAllData(): ExportData {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        session: this.loadSession(),
        mistakes: loadMistakes(),
        history: loadHistory(),
        xpProfile: this.getXPProfile(),
        dailyChallenges: loadDailyChallenges(),
        badgeProgress: this.getBadgeProgress(),
        badges: this.getBadges(),
        personalWords: loadPersonalWords(),
      },
    };
  },

  importAllData(data: unknown): { success: boolean; message: string; importedCounts: { session: number; mistakes: number; history: number; xpProfile: number; dailyChallenges: number; badgeProgress: number; badges: number; personalWords: number } } {
    if (!isValidExportData(data)) {
      return {
        success: false,
        message: '导入失败：数据格式无效。请确认文件是由本应用导出的备份文件。',
        importedCounts: { session: 0, mistakes: 0, history: 0, xpProfile: 0, dailyChallenges: 0, badgeProgress: 0, badges: 0, personalWords: 0 },
      };
    }

    const { session, mistakes, history, xpProfile, dailyChallenges, badgeProgress, badges, personalWords } = data.data;
    const importedCounts = { session: 0, mistakes: 0, history: 0, xpProfile: 0, dailyChallenges: 0, badgeProgress: 0, badges: 0, personalWords: 0 };
    const personalWordsToImport = personalWords ?? [];

    try {
      if (session !== null) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        importedCounts.session = 1;
      } else {
        localStorage.removeItem(SESSION_KEY);
      }

      if (mistakes.length > 0) {
        localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
        importedCounts.mistakes = mistakes.length;
      } else {
        localStorage.removeItem(MISTAKES_KEY);
      }

      if (history.length > 0) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        importedCounts.history = history.length;
      } else {
        localStorage.removeItem(HISTORY_KEY);
      }

      if (xpProfile) {
        localStorage.setItem(XP_PROFILE_KEY, JSON.stringify(xpProfile));
        importedCounts.xpProfile = 1;
      } else {
        localStorage.removeItem(XP_PROFILE_KEY);
      }

      if (dailyChallenges) {
        localStorage.setItem(DAILY_CHALLENGES_KEY, JSON.stringify(dailyChallenges));
        importedCounts.dailyChallenges = 1;
      } else {
        localStorage.removeItem(DAILY_CHALLENGES_KEY);
      }

      if (badgeProgress) {
        localStorage.setItem(BADGE_PROGRESS_KEY, JSON.stringify(badgeProgress));
        importedCounts.badgeProgress = 1;
      } else {
        localStorage.removeItem(BADGE_PROGRESS_KEY);
      }

      if (badges) {
        localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
        importedCounts.badges = 1;
      } else {
        localStorage.removeItem(BADGES_KEY);
      }

      if (personalWordsToImport.length > 0) {
        localStorage.setItem(PERSONAL_WORDS_KEY, JSON.stringify(personalWordsToImport));
        importedCounts.personalWords = personalWordsToImport.length;
      } else {
        localStorage.removeItem(PERSONAL_WORDS_KEY);
      }

      const parts: string[] = [];
      if (importedCounts.session > 0) parts.push('1 个会话');
      if (importedCounts.mistakes > 0) parts.push(`${importedCounts.mistakes} 条错题`);
      if (importedCounts.history > 0) parts.push(`${importedCounts.history} 条历史记录`);
      if (importedCounts.xpProfile > 0) parts.push('1 个 XP 档案');
      if (importedCounts.dailyChallenges > 0) parts.push('1 个每日挑战');
      if (importedCounts.badgeProgress > 0) parts.push('1 个徽章进度');
      if (importedCounts.badges > 0) parts.push('1 个徽章状态');
      if (importedCounts.personalWords > 0) parts.push(`${importedCounts.personalWords} 个生词`);

      const message = parts.length > 0
        ? `导入成功：共导入 ${parts.join('、')}。`
        : '导入成功：备份文件中不含任何数据，已清空现有数据。';

      return { success: true, message, importedCounts };
    } catch (error) {
      return {
        success: false,
        message: `导入失败：写入存储时出错（${error instanceof Error ? error.message : String(error)}）`,
        importedCounts: { session: 0, mistakes: 0, history: 0, xpProfile: 0, dailyChallenges: 0, badgeProgress: 0, badges: 0, personalWords: 0 },
      };
    }
  },
} as const;

export interface ExportData {
  version: 1;
  exportedAt: string;
  data: {
    session: StorageSchemaV2 | null;
    mistakes: Mistake[];
    history: SessionHistory[];
    xpProfile?: XPProfile;
    dailyChallenges?: DailyChallengeState | null;
    badgeProgress?: BadgeProgress;
    badges?: BadgeState;
    personalWords?: PersonalWord[];
  };
}

function isValidExportData(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) {
    return false;
  }

  if (typeof obj.exportedAt !== 'string') {
    return false;
  }

  if (typeof obj.data !== 'object' || obj.data === null) {
    return false;
  }

  const dataObj = obj.data as Record<string, unknown>;

  // session can be null or a valid V2 session
  if (dataObj.session !== null && !isValidV2Session(dataObj.session)) {
    return false;
  }

  if (!Array.isArray(dataObj.mistakes)) {
    return false;
  }

  if (!dataObj.mistakes.every(isValidMistake)) {
    return false;
  }

  if (!Array.isArray(dataObj.history)) {
    return false;
  }

  if (!dataObj.history.every(isValidHistory)) {
    return false;
  }

  // xpProfile is optional; if present, must be valid
  if (dataObj.xpProfile !== undefined && !isValidXPProfile(dataObj.xpProfile)) {
    return false;
  }

  // dailyChallenges is optional; if present, must be valid
  if (dataObj.dailyChallenges !== undefined && !isValidDailyChallengeState(dataObj.dailyChallenges)) {
    return false;
  }

  // badgeProgress is optional; if present, must be valid
  if (dataObj.badgeProgress !== undefined && !isValidBadgeProgress(dataObj.badgeProgress)) {
    return false;
  }

  // badges is optional; if present, must be valid
  if (dataObj.badges !== undefined && !isValidBadgeState(dataObj.badges)) {
    return false;
  }

  // personalWords is optional; if present, must be an array of valid PersonalWord
  if (dataObj.personalWords !== undefined) {
    if (!Array.isArray(dataObj.personalWords)) {
      return false;
    }
    const personalWords = dataObj.personalWords as unknown[];
    if (!personalWords.every(isValidPersonalWord)) {
      return false;
    }
  }

  return true;
}

export const storage = StorageService;
