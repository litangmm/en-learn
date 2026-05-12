import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface StretchReminderProps {
  durationSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

const STRETCH_TIPS = [
  { emoji: '🧘', title: '伸展手臂', description: '将双臂举过头顶，充分伸展' },
  { emoji: '👀', title: '放松眼睛', description: '闭上眼睛，轻轻转动眼球' },
  { emoji: '💪', title: '耸肩放松', description: '耸起肩膀，保持3秒，然后放松' },
  { emoji: '🧍', title: '站立伸展', description: '双手叉腰，轻轻向后弯腰' },
  { emoji: '🤲', title: '手腕放松', description: '轻轻转动手腕，释放紧张' },
];

function getRandomTip(): typeof STRETCH_TIPS[0] {
  return STRETCH_TIPS[Math.floor(Math.random() * STRETCH_TIPS.length)];
}

/**
 * StretchReminder provides simple stretch exercise suggestions.
 */
export function StretchReminder({
  durationSeconds,
  onComplete,
  onSkip,
}: StretchReminderProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [currentTip, setCurrentTip] = useState(getRandomTip());
  const [progress, setProgress] = useState(0);

  // Main timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
      setProgress(prev => Math.min(prev + 1, 100));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onComplete]);

  // Change tip every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(getRandomTip());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const secs = seconds % 60;
    return `${secs}秒`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      {/* Timer */}
      <div className="text-center">
        <p className="text-sm text-slate-500 mb-1">休息时间</p>
        <p className="text-2xl font-bold text-slate-700">{formatTime(timeRemaining)}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Current stretch tip */}
      <motion.div
        key={currentTip.title}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm"
      >
        <span className="text-5xl mb-4 block">{currentTip.emoji}</span>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          {currentTip.title}
        </h3>
        <p className="text-sm text-slate-500">
          {currentTip.description}
        </p>
      </motion.div>

      {/* Breathing reminder */}
      <div className="flex items-center gap-2 text-emerald-600">
        <Heart className="w-4 h-4 animate-pulse" />
        <p className="text-sm">保持放松，自然呼吸</p>
      </div>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        跳过 →
      </button>
    </div>
  );
}

export default StretchReminder;
