import type { PracticeState } from '@/hooks/usePractice';
import type { Mistake, SessionHistory } from '@/data/types';

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
const MAX_HISTORY_ENTRIES = 100;

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

  return true;
}

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

  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
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
    const intervals = [1, 3, 7, 14]; // days
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let reviewedCount = mistake.reviewedCount;
    let daysInterval: number;

    if (isCorrect) {
      reviewedCount = reviewedCount + 1;
      daysInterval = intervals[Math.min(reviewedCount - 1, intervals.length - 1)];
    } else {
      // Wrong answer: reset interval to 1 day, keep reviewedCount
      daysInterval = intervals[0];
    }

    mistakes[index] = {
      ...mistake,
      reviewedCount,
      nextReviewAt: now + daysInterval * oneDayMs,
      lastReviewedAt: now,
    };

    saveMistakes(mistakes);
  },

  exportAllData(): ExportData {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        session: this.loadSession(),
        mistakes: loadMistakes(),
        history: loadHistory(),
      },
    };
  },

  importAllData(data: unknown): { success: boolean; message: string; importedCounts: { session: number; mistakes: number; history: number } } {
    if (!isValidExportData(data)) {
      return {
        success: false,
        message: '导入失败：数据格式无效。请确认文件是由本应用导出的备份文件。',
        importedCounts: { session: 0, mistakes: 0, history: 0 },
      };
    }

    const { session, mistakes, history } = data.data;
    const importedCounts = { session: 0, mistakes: 0, history: 0 };

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

      const parts: string[] = [];
      if (importedCounts.session > 0) parts.push('1 个会话');
      if (importedCounts.mistakes > 0) parts.push(`${importedCounts.mistakes} 条错题`);
      if (importedCounts.history > 0) parts.push(`${importedCounts.history} 条历史记录`);

      const message = parts.length > 0
        ? `导入成功：共导入 ${parts.join('、')}。`
        : '导入成功：备份文件中不含任何数据，已清空现有数据。';

      return { success: true, message, importedCounts };
    } catch (error) {
      return {
        success: false,
        message: `导入失败：写入存储时出错（${error instanceof Error ? error.message : String(error)}）`,
        importedCounts: { session: 0, mistakes: 0, history: 0 },
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

  return true;
}

export const storage = StorageService;
