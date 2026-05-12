import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AUTO_DISMISS_MS = 8_000; // 8 seconds

interface RecallReminderToastProps {
  status: 'idle' | 'due-soon' | 'due-now' | 'streak-at-risk';
  dueCount: number;
  onDismiss: () => void;
  onStartReview: () => void;
}

function getToastContent(
  status: RecallReminderToastProps['status'],
  dueCount: number
): { emoji: string; message: string } | null {
  switch (status) {
    case 'due-soon':
      return {
        emoji: '📚',
        message: `您有 ${dueCount} 道复习题待完成`,
      };
    case 'due-now':
      return {
        emoji: '⏰',
        message: `复习时间到！${dueCount} 道错题等待复习`,
      };
    case 'streak-at-risk':
      return {
        emoji: '🔥',
        message: '连续学习 streak 即将中断！今天复习即可延续',
      };
    default:
      return null;
  }
}

/**
 * Recall Reminder Toast component.
 * Shows a non-blocking toast notification when the user has items due
 * for review or when their streak is at risk. Auto-dismisses after 8 seconds.
 */
export function RecallReminderToast({
  status,
  dueCount,
  onDismiss,
  onStartReview,
}: RecallReminderToastProps) {
  const content = getToastContent(status, dueCount);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (status === 'idle') return;

    const timer = setTimeout(() => {
      onDismiss();
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [status, onDismiss]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartReview();
  };

  return (
    <AnimatePresence>
      {status !== 'idle' && content && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          onClick={onDismiss}
          data-testid="recall-reminder-toast"
        >
          <div
            className="bg-white rounded-xl shadow-lg p-4 cursor-pointer"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <span
                className="text-2xl"
                role="img"
                aria-label={
                  status === 'due-soon' ? '书本' :
                  status === 'due-now' ? '时钟' : '火焰'
                }
              >
                {content.emoji}
              </span>
              <p className="flex-1 text-sm text-slate-700">{content.message}</p>
              <button
                onClick={handleButtonClick}
                className="flex items-center justify-center min-w-[80px] min-h-[36px] px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-medium transition-colors touch-manipulation"
                aria-label="开始复习"
              >
                开始复习
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
