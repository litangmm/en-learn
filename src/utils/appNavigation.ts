import type { View } from '@/components/routing';
import { storage } from '@/services/storage';

/**
 * Navigate to a different view with appropriate state updates.
 */
export function navigateTo(
  _view: View,
  setters: {
    setView: (_view: View) => void;
    setMistakeCount: (_count: number) => void;
    setHistoryCount: (_count: number) => void;
    setReviewDueCount: (_count: number) => void;
    setIsReviewMode?: (_value: boolean) => void;
  }
) {
  // Use _view to avoid ESLint unused variable warning
  const view = _view;
  switch (view) {
    case 'practice':
      setters.setView('practice');
      break;
    case 'mistake-book':
      setters.setMistakeCount(storage.getMistakeCount());
      setters.setView('mistake-book');
      break;
    case 'history':
      setters.setHistoryCount(storage.getHistoryCount());
      setters.setView('history');
      break;
    case 'data':
      setters.setView('data');
      break;
    case 'review':
      setters.setReviewDueCount(storage.getReviewQueueCount());
      if (setters.setIsReviewMode) setters.setIsReviewMode(false);
      setters.setView('review');
      break;
    case 'challenges':
    case 'badges':
    case 'leaderboard':
    case 'dictionary-browser':
      setters.setView(view);
      break;
  }
}

/**
 * Update stat counts after navigation.
 */
export function refreshStatCounts(setters: {
  setMistakeCount: (_count: number) => void;
  setHistoryCount: (_count: number) => void;
  setReviewDueCount: (_count: number) => void;
}) {
  setters.setMistakeCount(storage.getMistakeCount());
  setters.setHistoryCount(storage.getHistoryCount());
  setters.setReviewDueCount(storage.getReviewQueueCount());
}