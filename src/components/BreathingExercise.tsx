import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BreathingExerciseProps {
  durationSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale';

const PHASE_DURATION = {
  inhale: 4,
  hold: 4,
  exhale: 4,
};

const PHASE_TEXT = {
  inhale: '吸气',
  hold: '屏住',
  exhale: '呼气',
};

const PHASE_COLOR = {
  inhale: 'from-blue-400 to-blue-500',
  hold: 'from-blue-500 to-blue-600',
  exhale: 'from-blue-600 to-blue-700',
};

/**
 * BreathingExercise provides a guided breathing animation.
 * Uses 4-4-4 box breathing technique.
 */
export function BreathingExercise({
  durationSeconds,
  onComplete,
  onSkip,
}: BreathingExerciseProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [phaseProgress, setPhaseProgress] = useState(0);

  // Main timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onComplete]);

  // Phase timer
  useEffect(() => {
    const phaseDuration = PHASE_DURATION[phase];
    setPhaseProgress(0);

    const timer = setInterval(() => {
      setPhaseProgress(prev => {
        if (prev >= phaseDuration - 1) {
          // Move to next phase
          setPhase(currentPhase => {
            if (currentPhase === 'inhale') return 'hold';
            if (currentPhase === 'hold') return 'exhale';
            return 'inhale';
          });
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const circleScale = phase === 'inhale'
    ? 1 + (phaseProgress / PHASE_DURATION.inhale) * 0.5
    : phase === 'hold'
      ? 1.5
      : 1.5 - (phaseProgress / PHASE_DURATION.exhale) * 0.5;

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      {/* Timer */}
      <div className="text-center">
        <p className="text-sm text-slate-500 mb-1">剩余时间</p>
        <p className="text-2xl font-bold text-slate-700">{formatTime(timeRemaining)}</p>
      </div>

      {/* Breathing Circle */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full bg-blue-100 opacity-50" />

        {/* Animated circle */}
        <motion.div
          className={`absolute inset-8 rounded-full bg-gradient-to-br ${PHASE_COLOR[phase]}`}
          animate={{ scale: circleScale }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {/* Phase text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 text-center"
          >
            <p className="text-3xl font-bold text-white mb-1">
              {PHASE_TEXT[phase]}
            </p>
            <p className="text-white/80 text-sm">
              {phase === 'inhale' ? '深吸一口气' : phase === 'hold' ? '保持住' : '缓缓呼出'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="92"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-blue-200"
          />
          <circle
            cx="96"
            cy="96"
            r="92"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={2 * Math.PI * 92}
            strokeDashoffset={2 * Math.PI * 92 * (1 - timeRemaining / durationSeconds)}
            className="text-blue-500 transition-all duration-1000"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Instructions */}
      <p className="text-center text-sm text-slate-500">
        跟随圆形的变化节奏进行呼吸
      </p>

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

export default BreathingExercise;
