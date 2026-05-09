import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakFeedbackProps {
  streak: number;
  visible?: boolean;
}

export function StreakFeedback({ streak, visible = true }: StreakFeedbackProps) {
  if (!visible || streak < 2) return null;

  const isHot = streak >= 5 && streak < 10;
  const isUnstoppable = streak >= 10;

  const baseClasses = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold';

  const colorClasses = isUnstoppable
    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
    : isHot
      ? 'bg-red-50 text-red-600 border border-red-200'
      : 'bg-amber-50 text-amber-600 border border-amber-200';

  const pulseClasses = streak >= 5 ? 'animate-pulse' : '';

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`${baseClasses} ${colorClasses} ${pulseClasses}`}
      data-testid="streak-feedback"
    >
      <Flame className="w-3.5 h-3.5" />
      <span>{streak}</span>
      <span className="text-xs font-normal opacity-80">连击</span>
    </motion.div>
  );
}
