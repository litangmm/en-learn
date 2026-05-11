/**
 * App-level constants extracted from App.tsx.
 */

/**
 * Onboarding dictionary options for the welcome dialog.
 */
export const ONBOARDING_DICTIONARIES = [
  { id: 'cet4', name: 'CET-4', desc: '大学英语四级' },
  { id: 'cet6', name: 'CET-6', desc: '大学英语六级' },
  { id: 'ielts', name: 'IELTS', desc: '雅思词汇' },
  { id: 'toefl', name: 'TOEFL', desc: '托福词汇' },
] as const;

/**
 * Brand configuration.
 */
export const APP_BRAND = {
  name: '听力词汇练习',
  subtitle: '听句子，填单词',
} as const;