import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Wind, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecoveryOption, RecoveryStage } from '@/hooks/useFatigueRecovery';
import { BreathingExercise } from './BreathingExercise';
import { StretchReminder } from './StretchReminder';

interface RestReminderModalProps {
  isOpen: boolean;
  stage: RecoveryStage;
  recommendedOption: RecoveryOption;
  fatigueSignalsText: string;
  currentOption: RecoveryOption | null;
  onSelectOption: (option: RecoveryOption) => void;
  onSkip: () => void;
  onComplete: () => void;
}

/**
 * Modal that appears when fatigue is detected.
 * Offers recovery options: deep breathing, stretch, or continue.
 */
export function RestReminderModal({
  isOpen,
  stage,
  recommendedOption,
  fatigueSignalsText,
  currentOption,
  onSelectOption,
  onSkip,
  onComplete,
}: RestReminderModalProps) {
  if (!isOpen) return null;

  // Render exercise content
  if (stage === 'in_progress' && currentOption) {
    const duration = currentOption === 'deep_breathing' ? 60 : 30;
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          >
            {currentOption === 'deep_breathing' ? (
              <BreathingExercise
                durationSeconds={duration}
                onComplete={onComplete}
                onSkip={onSkip}
              />
            ) : (
              <StretchReminder
                durationSeconds={duration}
                onComplete={onComplete}
                onSkip={onSkip}
              />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Render completion screen
  if (stage === 'completed') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              休息完成！
            </h2>
            <p className="text-slate-500 mb-6">
              感觉好多了吧？继续加油学习！
            </p>
            <Button onClick={onComplete} className="w-full">
              继续学习
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Render suggestion screen
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              休息一下
            </h2>
            <p className="text-slate-500 text-sm">
              {fatigueSignalsText}
            </p>
          </div>

          {/* Recovery Options */}
          <div className="space-y-3">
            {/* Deep Breathing */}
            <button
              onClick={() => onSelectOption('deep_breathing')}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                recommendedOption === 'deep_breathing'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Wind className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-700">深呼吸练习</p>
                <p className="text-xs text-slate-500">1分钟 4-4-4 呼吸法</p>
              </div>
              {recommendedOption === 'deep_breathing' && (
                <span className="text-xs text-blue-500 font-medium">推荐</span>
              )}
            </button>

            {/* Stretch */}
            <button
              onClick={() => onSelectOption('stretch')}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                recommendedOption === 'stretch'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Coffee className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-slate-700">伸展放松</p>
                <p className="text-xs text-slate-500">30秒 简单伸展动作</p>
              </div>
              {recommendedOption === 'stretch' && (
                <span className="text-xs text-emerald-500 font-medium">推荐</span>
              )}
            </button>

            {/* Continue */}
            <button
              onClick={() => onSelectOption('continue')}
              className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all text-center"
            >
              <p className="font-medium text-slate-700">稍后再说</p>
              <p className="text-xs text-slate-500">继续当前练习</p>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RestReminderModal;
