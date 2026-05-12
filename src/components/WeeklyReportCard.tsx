import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3, Share2, Calendar, Star, Target, Flame, Award } from 'lucide-react';
import { ShareDialog } from './ShareDialog';
import type { WeeklyReport } from '@/data/types';

/**
 * Props for the WeeklyReportCard component.
 */
export interface WeeklyReportCardProps {
  /** Weekly report data with current and previous week stats */
  report: WeeklyReport;
  /** Optional trigger key to force re-mount for animation replay */
  triggerKey?: string;
  /** Optional click handler (for dashboard mode) */
  onClick?: () => void;
  /** Optional callback for dismiss button (modal mode) */
  onDismiss?: () => void;
  /** Whether to use compact dashboard mode (default) or full modal mode */
  compact?: boolean;
}

// Gradient theme for modal mode
const REPORT_THEME = {
  gradient: 'from-indigo-500 to-purple-600',
};

/**
 * Change indicator showing up/down/neutral trend.
 */
function ChangeIndicator({ change, showText = true }: { change: number; showText?: boolean }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center text-green-600 text-xs font-medium ml-1">
        <TrendingUp className="w-3 h-3 mr-0.5" />
        {showText ? `+${change}%` : `+${change}`}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center text-red-500 text-xs font-medium ml-1">
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {showText ? `${change}%` : `${change}`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-slate-400 text-xs font-medium ml-1">
      <Minus className="w-3 h-3 mr-0.5" />
      {showText ? '持平' : '0'}
    </span>
  );
}

/**
 * Stat card for modal mode.
 */
function StatCard({
  label,
  value,
  icon,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}) {
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
        <ChangeIndicator change={trend} />
      )}
    </div>
  );
}

/**
 * Compact Dashboard Card component.
 */
function CompactCard({
  report,
  onClick,
}: {
  report: WeeklyReport;
  onClick?: () => void;
}) {
  const comparison = report.comparison || { xpChange: 0, questionsChange: 0, accuracyChange: 0 };

  // Format week range
  const formatWeekRange = () => {
    const start = new Date(report.weekStart);
    const end = new Date(report.weekEnd);
    const startMonth = start.getMonth() + 1;
    const startDay = start.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();
    return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
  };

  // Calculate bar heights for comparison
  const maxXP = Math.max(report.xpEarned, 100);
  const prevXP = comparison.xpChange > 0
    ? Math.round(report.xpEarned / (1 + comparison.xpChange / 100))
    : report.xpEarned;
  const currentBarHeight = Math.max(4, (report.xpEarned / maxXP) * 40);
  const prevBarHeight = Math.max(4, (prevXP / maxXP) * 40);

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        w-full bg-white rounded-xl border border-slate-200 p-4 text-left
        transition-all duration-200
        ${onClick ? 'hover:shadow-md hover:border-blue-200 cursor-pointer' : 'cursor-default'}
      `}
      data-testid="weekly-report-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-sm font-medium text-slate-700">本周学习报告</h3>
        </div>
        <span className="text-xs text-slate-400">{formatWeekRange()}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 mb-1">获得经验</span>
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-slate-800">{report.xpEarned}</span>
            <span className="text-xs text-slate-400 ml-1">XP</span>
            <ChangeIndicator change={comparison.xpChange} />
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 mb-1">完成题目</span>
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-slate-800">{report.questionsAnswered}</span>
            <span className="text-xs text-slate-400 ml-1">题</span>
            <ChangeIndicator change={comparison.questionsChange} />
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 mb-1">正确率</span>
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-slate-800">{report.accuracy}</span>
            <span className="text-xs text-slate-400 ml-1">%</span>
            <ChangeIndicator change={comparison.accuracyChange} />
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 mb-1">学习天数</span>
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-slate-800">{report.learningDays}</span>
            <span className="text-xs text-slate-400 ml-1">天</span>
          </div>
        </div>
      </div>

      {/* Mini Bar Chart Comparison */}
      <div className="flex items-end justify-center gap-6 h-12 mb-3">
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-400 mb-1">上周</span>
          <div className="w-8 bg-slate-100 rounded-t-sm flex items-end" style={{ height: `${prevBarHeight}px` }}>
            <div className="w-full bg-slate-300 rounded-t-sm" style={{ height: '100%' }} />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-600 font-medium mb-1">本周</span>
          <div className="w-8 flex items-end" style={{ height: `${currentBarHeight}px` }}>
            <div className="w-full bg-blue-500 rounded-t-sm" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          完成 {report.sessionsCompleted} 次练习
        </span>
        <span className="text-xs text-slate-400">
          答对 {report.correctAnswers} 题
        </span>
      </div>
    </button>
  );
}

/**
 * Full Modal Card component (original design).
 */
function ModalCard({
  report,
  triggerKey,
  onDismiss,
}: {
  report: WeeklyReport;
  triggerKey?: string;
  onDismiss?: () => void;
}) {
  const [showDialog, setShowDialog] = useState(false);

  // Format week range
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
    if (report.learningDays >= 7) return '本周学习全覆盖！';
    if (report.learningDays >= 5) return '学习习惯养成中';
    if (report.learningDays >= 3) return '本周学习辛苦了';
    if (report.questionsAnswered >= 20) return '本周收获满满';
    if (report.questionsAnswered > 0) return '本周迈出了第一步';
    return '本周学习小结';
  };

  // Get subtitle
  const getSubtitle = () => {
    if (report.comparison) {
      const { xpChange, questionsChange } = report.comparison;
      if (xpChange > 0 && questionsChange > 0) return '比上周表现更好，继续保持！';
      if (xpChange > 0) return '本周学习效率提升了';
      if (questionsChange > 0) return '本周答题量增加了';
      if (xpChange < 0 && questionsChange < 0) return '比上周略有下滑，下周加油';
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
          <div className={`relative bg-gradient-to-br ${REPORT_THEME.gradient} rounded-2xl shadow-xl overflow-hidden`}>
            {/* Header */}
            <div className="px-5 py-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Calendar size={32} className="text-white" />
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {formatWeekRange()}
                </div>
              </div>

              <h2 className="text-xl font-bold mb-2 drop-shadow-sm">
                {getHeadline()}
              </h2>
              <p className="text-white/90 text-sm leading-relaxed">
                {getSubtitle()}
              </p>
            </div>

            {/* Content */}
            <div className="bg-white px-5 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="获得 XP"
                  value={report.xpEarned}
                  icon={<Star size={20} className="text-amber-500" />}
                  trend={report.comparison?.xpChange}
                  color="amber"
                />
                <StatCard
                  label="答题数"
                  value={report.questionsAnswered}
                  icon={<Target size={20} className="text-blue-500" />}
                  trend={report.comparison?.questionsChange}
                  color="blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
                    <Target size={20} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">{report.accuracy}%</p>
                    <p className="text-xs text-slate-500">正确率</p>
                  </div>
                </div>
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

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-600">学习 {report.learningDays} 天</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-600">完成 {report.sessionsCompleted} 次练习</span>
                </div>
              </div>

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

      <ShareDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        sessionResult={undefined}
        triggerType="weekly-report"
      />
    </>
  );
}

/**
 * Weekly Report Card component.
 * Supports both compact dashboard mode and full modal mode.
 */
export function WeeklyReportCard({
  report,
  triggerKey,
  onClick,
  onDismiss,
  compact = true,
}: WeeklyReportCardProps) {
  if (compact) {
    return <CompactCard report={report} onClick={onClick} />;
  }
  return <ModalCard report={report} triggerKey={triggerKey} onDismiss={onDismiss} />;
}

export default WeeklyReportCard;