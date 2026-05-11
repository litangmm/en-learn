import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Target,
  Flame,
  Calendar,
  Award,
  Share2,
} from 'lucide-react';
import { ShareDialog } from './ShareDialog';
import type { WeeklyReport } from '@/data/types';

// Gradient theme for weekly report
const REPORT_THEME = {
  gradient: 'from-indigo-500 to-purple-600',
  accentColor: 'indigo',
};

// Icon components
function TrendIcon({ change }: { change: number }) {
  if (change > 0) {
    return <TrendingUp className="text-emerald-500" size={16} />;
  } else if (change < 0) {
    return <TrendingDown className="text-red-500" size={16} />;
  }
  return <Minus className="text-slate-400" size={16} />;
}

function formatChange(change: number): string {
  if (change > 0) return `+${change}%`;
  if (change < 0) return `${change}%`;
  return '持平';
}

function getChangeColor(change: number): string {
  if (change > 0) return 'text-emerald-600';
  if (change < 0) return 'text-red-600';
  return 'text-slate-500';
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}

function StatCard({ label, value, icon, trend, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-${color}-100`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 ${getChangeColor(trend)}`}>
          <TrendIcon change={trend} />
          <span className="text-sm font-medium">{formatChange(trend)}</span>
        </div>
      )}
    </div>
  );
}

interface WeeklyReportCardProps {
  /** The weekly report data to display */
  report: WeeklyReport;
  /** Optional trigger key to force re-mount for animation replay */
  triggerKey?: string;
  /** Callback when user dismisses the card */
  onDismiss?: () => void;
}

/**
 * Weekly Report Card component.
 * Displays learning progress for the past week with comparisons to the previous week.
 * Uses a template design similar to AchievementMomentCard with gradient theme.
 */
export function WeeklyReportCard({
  report,
  triggerKey,
  onDismiss,
}: WeeklyReportCardProps) {
  const [showDialog, setShowDialog] = useState(false);

  // Format week range for display
  const formatWeekRange = () => {
    const start = new Date(report.weekStart);
    const end = new Date(report.weekEnd);
    const startMonth = start.getMonth() + 1;
    const startDay = start.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();
    return `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`;
  };

  // Get headline based on activity
  const getHeadline = () => {
    if (report.learningDays >= 7) {
      return '本周学习全覆盖！';
    } else if (report.learningDays >= 5) {
      return '学习习惯养成中';
    } else if (report.learningDays >= 3) {
      return '本周学习辛苦了';
    } else if (report.questionsAnswered >= 20) {
      return '本周收获满满';
    } else if (report.questionsAnswered > 0) {
      return '本周迈出了第一步';
    }
    return '本周学习小结';
  };

  // Get subtitle based on comparison
  const getSubtitle = () => {
    if (report.comparison) {
      const { xpChange, questionsChange } = report.comparison;
      if (xpChange > 0 && questionsChange > 0) {
        return '比上周表现更好，继续保持！';
      } else if (xpChange > 0) {
        return '本周学习效率提升了';
      } else if (questionsChange > 0) {
        return '本周答题量增加了';
      } else if (xpChange < 0 && questionsChange < 0) {
        return '比上周略有下滑，下周加油';
      }
    }
    return '坚持学习，积少成多';
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          key={triggerKey ?? report.weekStart}
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-md mx-auto"
          data-testid="weekly-report-card"
        >
          <div
            className={`relative bg-gradient-to-br ${REPORT_THEME.gradient} rounded-2xl shadow-xl overflow-hidden`}
          >
            {/* Header with gradient background */}
            <div className="px-5 py-6 text-white">
              <div className="flex items-center justify-between mb-4">
                {/* Icon */}
                <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Calendar size={32} className="text-white" />
                </div>
                {/* Week range badge */}
                <div className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {formatWeekRange()}
                </div>
              </div>

              {/* Headline */}
              <h2 className="text-xl font-bold mb-2 drop-shadow-sm">
                {getHeadline()}
              </h2>

              {/* Subtitle */}
              <p className="text-white/90 text-sm leading-relaxed">
                {getSubtitle()}
              </p>
            </div>

            {/* Content area with stats */}
            <div className="bg-white px-5 py-5 space-y-3">
              {/* Main stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* XP Earned */}
                <StatCard
                  label="获得 XP"
                  value={report.xpEarned}
                  icon={<Star size={20} className="text-amber-500" />}
                  trend={report.comparison?.xpChange}
                  color="amber"
                />

                {/* Questions Answered */}
                <StatCard
                  label="答题数"
                  value={report.questionsAnswered}
                  icon={<Target size={20} className="text-blue-500" />}
                  trend={report.comparison?.questionsChange}
                  color="blue"
                />
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-2 gap-3">
                {/* Accuracy */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
                    <Target size={20} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">{report.accuracy}%</p>
                    <p className="text-xs text-slate-500">正确率</p>
                  </div>
                </div>

                {/* Best Streak / Correct */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
                    <Flame size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">{report.correctAnswers}</p>
                    <p className="text-xs text-slate-500">答对题数</p>
                  </div>
                </div>
              </div>

              {/* Learning days and sessions */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-600">
                    学习 {report.learningDays} 天
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-600">
                    完成 {report.sessionsCompleted} 次练习
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDialog(true)}
                  className="flex-1 flex items-center justify-center gap-2 p-3 min-h-[48px] bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 active:from-slate-900 active:to-slate-950 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg active:shadow-md touch-manipulation"
                  aria-label="分享周报"
                  data-testid="weekly-report-share-button"
                >
                  <Share2 size={20} />
                  <span>分享周报</span>
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="px-4 min-h-[48px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-medium rounded-xl transition-all duration-200"
                  aria-label="关闭"
                  data-testid="weekly-report-dismiss-button"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Share dialog */}
      <ShareDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        sessionResult={undefined}
        triggerType="weekly-report"
      />
    </>
  );
}

export default WeeklyReportCard;