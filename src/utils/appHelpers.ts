import type { PracticeMode } from '@/data/types';
import { APP_BRAND, ONBOARDING_DICTIONARIES } from './appConstants';

/**
 * Pure utility functions extracted from App.tsx
 * These functions have no dependencies on React state or hooks.
 */

/**
 * Get the mode hint text based on practice mode.
 */
export function getModeHint(mode: PracticeMode): string {
  switch (mode) {
    case 'fill-in-blanks':
      return '听音频后，在输入框中填入缺失的单词，按 Enter 键快速提交';
    case 'dictation':
      return '首字母听写：听音频后，根据中文提示和首字母提示填写单词';
    case 'multiple-choice':
      return '选择最合适的答案后，点击提交答案按钮';
    case 'sentence-reorder':
      return '点击单词组成正确句子，再次点击已选单词可撤回';
    default:
      return '听音频后，在输入框中填入缺失的单词，按 Enter 键快速提交';
  }
}

/**
 * Format elapsed time from timestamp to human-readable string.
 */
export function formatElapsedTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days === 1) return '昨天';
  return `${days}天前`;
}

// Re-export constants for convenience
export { ONBOARDING_DICTIONARIES, APP_BRAND };