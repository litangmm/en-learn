import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { Goal, GoalType } from '@/data/types';

export interface GoalCompletionToastProps {
  /** The goal that just completed (or null to hide) */
  completedGoal: Goal | null;
  /** Trigger key to force re-mount and animation replay */
  triggerKey?: string | number;
  /** Auto-dismiss delay in ms (default 3000) */
  autoDismissMs?: number;
  onDismiss: () => void;
}

/** Get emoji and icon for goal type */
function getGoalContent(type: GoalType): { emoji: string; label: string } {
  switch (type) {
    case 'questions':
      return { emoji: '🎯', label: '答题目标' };
    case 'xp':
      return { emoji: '⭐', label: 'XP 目标' };
    case 'streak':
      return { emoji: '🔥', label: '连续目标' };
  }
}

/**
 * Goal Completion Toast.
 * Shows a brief celebration toast when a learning goal is achieved.
 * Auto-dismisses after the specified duration.
 */
export function GoalCompletionToast({
  completedGoal,
  triggerKey,
  autoDismissMs = 3000,
  onDismiss,
}: GoalCompletionToastProps) {
  useEffect(() => {
    if (!completedGoal) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [completedGoal, autoDismissMs, onDismiss]);

  const content = completedGoal ? getGoalContent(completedGoal.type) : null;

  return (
    <AnimatePresence>
      {completedGoal && content && (
        <motion.div
          key={`goal-toast-${completedGoal.id}-${triggerKey ?? 'init'}`}
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none"
          data-testid="goal-completion-toast"
        >
          <div className="relative bg-white rounded-2xl shadow-xl border border-green-200 p-4 overflow-hidden pointer-events-auto">
            {/* Green gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />

            <div className="flex items-center gap-3 pt-1">
              {/* Celebration icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-slate-800 leading-tight">
                  🎉 {content.emoji} {content.label}达成！
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {completedGoal.title} · 已完成 {completedGoal.target}
                  {completedGoal.type === 'xp' && ' XP'}
                  {completedGoal.type === 'questions' && ' 题'}
                  {completedGoal.type === 'streak' && ' 天'}
                </p>
              </div>

              {/* Dismiss button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="关闭"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
