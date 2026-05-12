import { Clock, Lightbulb, CalendarClock } from 'lucide-react';
import { useTimeOfDayAnalysis } from '@/hooks/useTimeOfDayAnalysis';
import { TimeSlotQualityCard } from './TimeSlotQualityCard';
import { PeakHoursBadge } from './PeakHoursBadge';

/**
 * Formats duration in seconds to human readable string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分` : `${hours}小时`;
}

/**
 * Learning Time Insights Report Component
 *
 * Displays comprehensive time-of-day learning analysis including:
 * - Peak hours badge
 * - Time slot quality cards
 * - Recommendation based on patterns
 */
export function LearningTimeInsights() {
  const analysis = useTimeOfDayAnalysis();

  if (analysis.periodMetrics.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
        <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">学习时段分析</h3>
        <p className="text-sm text-slate-500">
          完成更多练习后，我们将为你分析最佳学习时段
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Peak Hours Badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" />
          学习时段分析
        </h3>
        <PeakHoursBadge analysis={analysis} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">累计练习</p>
          <p className="text-xl font-bold text-slate-800">
            {analysis.totalSessions} 次
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">累计时长</p>
          <p className="text-xl font-bold text-slate-800">
            {formatDuration(analysis.totalDuration)}
          </p>
        </div>
      </div>

      {/* Time Slot Cards */}
      {analysis.periodMetrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {analysis.periodMetrics.map((metrics) => (
            <TimeSlotQualityCard
              key={metrics.periodId}
              metrics={metrics}
              isBest={analysis.bestPeriod?.periodId === metrics.periodId}
              isWorst={analysis.worstPeriod?.periodId === metrics.periodId}
            />
          ))}
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">学习建议</p>
            <p className="text-sm text-blue-600">{analysis.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningTimeInsights;
