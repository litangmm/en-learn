import { useMemo } from 'react';
import { Clock, Calendar, CheckCircle2, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { useReviewStreak } from '@/hooks/useReviewStreak';
import { storage } from '@/services/storage';

/**
 * Props for DailyReviewPlan component.
 */
export interface DailyReviewPlanProps {
  /** Callback to open the review view */
  onOpenReview: () => void;
  /** Whether the user is currently in review mode */
  isReviewMode?: boolean;
}

/**
 * Daily Review Plan component.
 * Displays today's review plan including:
 * - Number of items due for review
 * - Estimated time to complete
 * - Current streak information
 * - Quick start review button
 */
export function DailyReviewPlan({ onOpenReview, isReviewMode = false }: DailyReviewPlanProps) {
  const { dueCount } = useSpacedRepetition();
  const { data: streakData } = useReviewStreak();
  const { currentStreak, longestStreak } = streakData;

  // Get today's review stats
  const todayStats = useMemo(() => storage.getReviewStats(), []);

  // Calculate estimated time (2 minutes per item)
  const estimatedMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(dueCount * 2));
  }, [dueCount]);

  // Check if any reviews are available
  const hasReviewsAvailable = dueCount > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-blue-500" />
          每日复习计划
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Due count section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasReviewsAvailable ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {hasReviewsAvailable ? (
                <Clock className="w-5 h-5 text-blue-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {hasReviewsAvailable ? (
                  <>
                    <span className="text-blue-600 font-bold">{dueCount}</span> 个复习任务待完成
                  </>
                ) : (
                  <span className="text-green-600 font-medium">今日复习已完成</span>
                )}
              </p>
              {hasReviewsAvailable && (
                <p className="text-xs text-slate-500">
                  预计用时约 {estimatedMinutes} 分钟
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Streak section */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-slate-600">
              当前连续 <span className="font-semibold text-orange-600">{currentStreak}</span> 天
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-slate-600">
              历史最长 <span className="font-semibold text-purple-600">{longestStreak}</span> 天
            </span>
          </div>
        </div>

        {/* Today's progress */}
        {todayStats.stats.reviewedCount > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (todayStats.stats.reviewedCount / Math.max(1, dueCount + todayStats.stats.reviewedCount)) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-slate-500">
              {todayStats.stats.reviewedCount} 项已复习
            </span>
          </div>
        )}

        {/* Review button */}
        <Button
          onClick={onOpenReview}
          className={`w-full gap-2 ${
            hasReviewsAvailable
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          disabled={!hasReviewsAvailable}
        >
          {hasReviewsAvailable ? (
            <>
              <Zap className="w-4 h-4" />
              开始复习 ({dueCount})
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              暂无待复习内容
            </>
          )}
        </Button>

        {/* Review mode indicator */}
        {isReviewMode && (
          <div className="flex items-center justify-center gap-2 py-2 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm text-blue-600 font-medium">复习模式进行中</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DailyReviewPlan;