import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronLeft, CheckCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DailyChallenge } from '@/data/types';

interface DailyChallengePanelProps {
  challenges: DailyChallenge[];
  onClaim: (id: string) => void;
  onBack: () => void;
}

function formatTodayDate(): string {
  const now = new Date();
  return `${now.getMonth() + 1}月${now.getDate()}日`;
}

function getProgressPercentage(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function DailyChallengePanel({
  challenges,
  onClaim,
  onBack,
}: DailyChallengePanelProps) {
  const todayDate = formatTodayDate();

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-800">每日挑战</h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            {todayDate}
          </Badge>
        </div>
      </div>

      {/* Empty State */}
      {challenges.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Gift className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-lg font-medium text-slate-600 mb-2">暂无挑战</h2>
          <p className="text-sm text-slate-400">今日挑战已全部完成或暂无可用挑战</p>
        </motion.div>
      )}

      {/* Challenge Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {challenges.map((challenge, idx) => {
            const percentage = getProgressPercentage(challenge.current, challenge.target);

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-slate-500">{challenge.description}</p>
                  </div>
                  <div className="ml-3 shrink-0">
                    {challenge.completed && challenge.claimed && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <CheckCircle className="w-3 h-3" />
                        已领取
                      </Badge>
                    )}
                    {challenge.completed && !challenge.claimed && (
                      <Button
                        size="sm"
                        onClick={() => onClaim(challenge.id)}
                        className="gap-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        领取 {challenge.rewardXP} XP
                      </Button>
                    )}
                    {!challenge.completed && (
                      <span className="text-xs text-slate-400">
                        {challenge.current}/{challenge.target}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      challenge.completed ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
