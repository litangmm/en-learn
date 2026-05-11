import { motion } from 'framer-motion';
import { Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusSessionSummaryProps {
  stats: {
    duration: number; // seconds
    questionsCompleted: number;
  };
  onClose: () => void;
}

export function FocusSessionSummary({ stats, onClose }: FocusSessionSummaryProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">专注练习完成</h2>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span className="text-slate-600">专注时长</span>
            </div>
            <span className="font-semibold">{formatDuration(stats.duration)}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-amber-500" />
              <span className="text-slate-600">完成题目</span>
            </div>
            <span className="font-semibold">{stats.questionsCompleted} 题</span>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          继续练习
        </Button>
      </div>
    </motion.div>
  );
}