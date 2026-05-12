import { Clock, Target, TrendingUp } from 'lucide-react';
import type { TimePeriodMetrics } from '@/hooks/useTimeOfDayAnalysis';

interface TimeSlotQualityCardProps {
  metrics: TimePeriodMetrics;
  isBest?: boolean;
  isWorst?: boolean;
}

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
 * Formats hour (0-23) to Chinese time string
 */
function formatHour(hour: number): string {
  if (hour === 0) return '0点';
  if (hour === 12) return '12点';
  if (hour < 12) return `${hour}点`;
  return `${hour}点`;
}

/**
 * Card displaying learning quality metrics for a single time period
 */
export function TimeSlotQualityCard({
  metrics,
  isBest = false,
  isWorst = false,
}: TimeSlotQualityCardProps) {
  const bgClass = isBest
    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
    : isWorst
      ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200'
      : 'bg-white border-slate-200';

  const accentColor = isBest
    ? 'text-emerald-600'
    : isWorst
      ? 'text-amber-600'
      : 'text-slate-600';

  return (
    <div
      className={`rounded-xl border p-4 transition-all hover:shadow-md ${bgClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{metrics.emoji}</span>
          <div>
            <h3 className={`font-semibold ${accentColor}`}>{metrics.periodName}</h3>
            <p className="text-xs text-slate-500">
              {formatHour(metrics.peakHour ?? 0)} 左右最活跃
            </p>
          </div>
        </div>
        {isBest && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">
            最佳
          </span>
        )}
        {isWorst && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500 text-white">
            待提升
          </span>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Accuracy */}
        <div className="text-center p-2 rounded-lg bg-white/50">
          <Target className={`w-4 h-4 mx-auto mb-1 ${accentColor}`} />
          <p className="text-lg font-bold text-slate-800">{metrics.averageAccuracy}%</p>
          <p className="text-xs text-slate-500">正确率</p>
        </div>

        {/* Sessions */}
        <div className="text-center p-2 rounded-lg bg-white/50">
          <TrendingUp className={`w-4 h-4 mx-auto mb-1 ${accentColor}`} />
          <p className="text-lg font-bold text-slate-800">{metrics.sessionCount}</p>
          <p className="text-xs text-slate-500">练习次数</p>
        </div>

        {/* Duration */}
        <div className="text-center p-2 rounded-lg bg-white/50">
          <Clock className={`w-4 h-4 mx-auto mb-1 ${accentColor}`} />
          <p className="text-lg font-bold text-slate-800 truncate">
            {formatDuration(metrics.totalDuration)}
          </p>
          <p className="text-xs text-slate-500">总时长</p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between text-xs text-slate-500">
        <span>完成 {metrics.totalQuestions} 题</span>
        <span>正确 {metrics.correctAnswers} 题</span>
      </div>
    </div>
  );
}

export default TimeSlotQualityCard;
