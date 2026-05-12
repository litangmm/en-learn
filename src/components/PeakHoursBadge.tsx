import { Sparkles } from 'lucide-react';
import type { TimeOfDayAnalysis } from '@/hooks/useTimeOfDayAnalysis';

interface PeakHoursBadgeProps {
  analysis: TimeOfDayAnalysis;
}

/**
 * Badge component showing user's peak learning hours
 */
export function PeakHoursBadge({ analysis }: PeakHoursBadgeProps) {
  if (!analysis.hasEnoughData) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
        <Sparkles className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-500">数据积累中...</span>
      </div>
    );
  }

  if (!analysis.bestPeriod) {
    return null;
  }

  const { bestPeriod } = analysis;
  const periodEmoji = bestPeriod.emoji || '⏰';

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-full border border-emerald-200">
      <span className="text-lg">{periodEmoji}</span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-emerald-700">
          最佳时段: {bestPeriod.periodName}
        </span>
        <span className="text-xs text-emerald-600">
          正确率 {bestPeriod.averageAccuracy}%
        </span>
      </div>
      <Sparkles className="w-4 h-4 text-emerald-500 ml-auto" />
    </div>
  );
}

export default PeakHoursBadge;
