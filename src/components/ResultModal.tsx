import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, RotateCcw, Home, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareDialog } from './ShareDialog';
import type { SessionResult } from '@/hooks/useShareCardData';
import type { UserAnswer } from '@/hooks/usePractice';

interface ResultModalProps {
  score: number;
  totalQuestions: number;
  userAnswers: UserAnswer[];
  onRestart: () => void;
}

export function ResultModal({ score, totalQuestions, userAnswers, onRestart }: ResultModalProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);

  // First-of-day auto-show: only auto-open ShareDialog if this is the first share today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastShareDate = localStorage.getItem('en-learn:last-share-date');
    if (lastShareDate !== today) {
      // First share today - record the date and auto-show after delay
      localStorage.setItem('en-learn:last-share-date', today);
      const timer = setTimeout(() => setShowShareDialog(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  // Build session result for ShareDialog
  const sessionResult: SessionResult = {
    score,
    accuracy: Math.round((correctCount / totalQuestions) * 100),
    streak: 0,
  };

  const getGrade = () => {
    if (accuracy >= 90) return { label: '优秀', color: 'text-green-600', bg: 'bg-green-50' };
    if (accuracy >= 70) return { label: '良好', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (accuracy >= 50) return { label: '及格', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: '继续加油', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const grade = getGrade();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto px-3 sm:px-4 overflow-y-auto max-h-[90vh]"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className={`${grade.bg} px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 text-center`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-amber-500" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">练习完成!</h2>
          <p className={`text-base sm:text-lg font-medium ${grade.color}`}>
            {grade.label}
          </p>
        </div>

        {/* Stats */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-4 bg-slate-50 rounded-xl"
            >
              <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-slate-800">{accuracy}%</p>
              <p className="text-sm text-slate-500">正确率</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center p-4 bg-slate-50 rounded-xl"
            >
              <Zap className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold text-slate-800">{score}</p>
              <p className="text-sm text-slate-500">得分</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center p-4 bg-slate-50 rounded-xl"
            >
              <Home className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-slate-800">{correctCount}/{totalQuestions}</p>
              <p className="text-sm text-slate-500">答对题数</p>
            </motion.div>
          </div>

          {/* Answer Review */}
          <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
            <h3 className="font-medium text-slate-700 mb-3 sm:mb-4">答题回顾</h3>
            {userAnswers.map((answer, idx) => (
              <motion.div
                key={answer.sentenceId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className={`flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg overflow-hidden ${
                  answer.isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                }`}
              >
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  answer.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {answer.isCorrect ? (
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-700">
                    第 {idx + 1} 题
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                    答案: {answer.answers.join(', ')} · {answer.attempts} 次
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={onRestart}
              className="w-full gap-2"
              size="lg"
            >
              <RotateCcw className="w-4 h-4" />
              再来一组
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(true)}
              className="w-full gap-2"
              size="lg"
            >
              <Share2 className="w-4 h-4" />
              分享成绩
            </Button>
          </div>
        </div>

        {/* Share Dialog */}
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          sessionResult={sessionResult}
        />
      </div>
    </motion.div>
  );
}
