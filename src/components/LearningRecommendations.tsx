import { motion } from 'framer-motion';
import { Crown, Lightbulb, TrendingUp, Target } from 'lucide-react';
import type { ModeRecommendation, ModeAccuracy } from '@/data/types';
import { MODE_LABELS } from '@/hooks/useProgressStats';

interface LearningRecommendationsProps {
  recommendations: ModeRecommendation[];
  modeAccuracy?: ModeAccuracy[];
}

/**
 * Single recommendation card for a practice mode.
 */
function RecommendationCard({
  recommendation,
  index,
  accuracy,
  totalQuestions,
}: {
  recommendation: ModeRecommendation;
  index: number;
  accuracy: number;
  totalQuestions: number;
}) {
  const modeLabel = MODE_LABELS[recommendation.mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`rounded-xl p-4 ${
        recommendation.preferred
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300'
          : 'bg-white border border-slate-200'
      }`}
    >
      {/* Header with priority badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          {recommendation.preferred ? (
            <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <Crown className="w-3 h-3" />
              <span>推荐</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-medium">
              <span className="font-semibold">#{index + 1}</span>
              <span>优先级</span>
            </div>
          )}
        </div>

        {/* Mode name badge */}
        <span
          className={`text-sm font-medium px-2 py-1 rounded-md ${
            recommendation.preferred
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {modeLabel}
        </span>
      </div>

      {/* Recommendation reason */}
      <p
        className={`text-sm mb-4 ${
          recommendation.preferred ? 'text-blue-800' : 'text-slate-600'
        }`}
      >
        {recommendation.reason}
      </p>

      {/* Performance data */}
      <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Target
            className={`w-4 h-4 ${
              recommendation.preferred ? 'text-blue-500' : 'text-slate-400'
            }`}
          />
          <span className="text-sm font-medium text-slate-700">
            {totalQuestions > 0 ? `${accuracy}%` : '暂无数据'}
          </span>
          <span className="text-xs text-slate-500">正确率</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp
            className={`w-4 h-4 ${
              recommendation.preferred ? 'text-blue-500' : 'text-slate-400'
            }`}
          />
          <span className="text-sm font-medium text-slate-700">
            {totalQuestions}
          </span>
          <span className="text-xs text-slate-500">题</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Component that displays ModeRecommendation cards with entrance animations.
 * Each card shows: priority badge, mode name (Chinese), recommendation reason,
 * and performance data. The preferred card is highlighted.
 */
export function LearningRecommendations({
  recommendations,
  modeAccuracy = [],
}: LearningRecommendationsProps) {
  // Create a map for quick lookup of mode performance data
  const accuracyMap = new Map(
    modeAccuracy.map((m) => [m.mode, { accuracy: m.accuracy, totalQuestions: m.totalQuestions }])
  );

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
        <Lightbulb className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">
          开始练习后，这里会显示你的学习建议
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-medium text-slate-700">智能建议</h2>
      </div>

      {/* Recommendation cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.map((recommendation, index) => {
          const perf = accuracyMap.get(recommendation.mode) ?? {
            accuracy: 0,
            totalQuestions: 0,
          };
          return (
            <RecommendationCard
              key={recommendation.mode}
              recommendation={recommendation}
              index={index}
              accuracy={perf.accuracy}
              totalQuestions={perf.totalQuestions}
            />
          );
        })}
      </div>
    </div>
  );
}