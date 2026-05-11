import { motion } from 'framer-motion';
import { Scale, Clock, TrendingUp, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import type { WeightExplanation as WeightExplanationType } from '@/hooks/useQuestionWeighting';

/**
 * Props for the WeightExplanation component.
 */
export interface WeightExplanationProps {
  /** Weight explanation data from useQuestionWeighting hook */
  explanation: WeightExplanationType;
  /** Maximum weight value for scaling bar (default: 5.0) */
  maxWeight?: number;
}

/**
 * Configuration for spaced repetition state visual indicators.
 */
const STATE_CONFIG: Record<
  WeightExplanationType['spacedRepetitionState'],
  { label: string; color: string; bgColor: string; icon: typeof Clock }
> = {
  new: {
    label: '新词',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: HelpCircle,
  },
  due: {
    label: '待复习',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: Clock,
  },
  overdue: {
    label: '已逾期',
    color: 'text-green-700',
    bgColor: 'bg-green-200',
    icon: AlertCircle,
  },
  'not-due': {
    label: '未到期',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    icon: CheckCircle,
  },
};

/**
 * WeightExplanation component displays the weight breakdown algorithm logic.
 *
 * Shows:
 * - Total weight with visual bar indicator
 * - Breakdown of each weight component (base, mistake, error rate, SR modifier)
 * - Spaced repetition state with color coding
 * - New word penalty indicator
 * - Chinese explanation text
 */
export function WeightExplanation({
  explanation,
  maxWeight = 5.0,
}: WeightExplanationProps) {
  const {
    sentenceId,
    totalWeight,
    baseWeight,
    mistakeWeight,
    errorRateWeight,
    spacedRepetitionModifier,
    isNewWord,
    newWordPenalty,
    spacedRepetitionState,
    explanation: explanationText,
  } = explanation;

  // Calculate bar width percentage
  const weightBarPercent = Math.min((totalWeight / maxWeight) * 100, 100);

  // Get SR state configuration
  const srStateConfig = STATE_CONFIG[spacedRepetitionState] ?? STATE_CONFIG['new'];
  const StateIcon = srStateConfig.icon;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">权重分析</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {sentenceId.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Weight Bar Display */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">总权重</span>
          <span className="text-lg font-bold text-blue-600">
            {totalWeight.toFixed(2)}
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${weightBarPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-400">0</span>
          <span className="text-xs text-slate-400">MAX {maxWeight}</span>
        </div>
      </div>

      {/* Weight Breakdown Components */}
      <div className="px-4 py-3 space-y-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          权重分解
        </span>

        {/* Base Weight */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">基础权重</span>
          <span className="text-sm font-mono text-slate-700">
            +{baseWeight.toFixed(1)}
          </span>
        </div>

        {/* Mistake Weight */}
        {mistakeWeight > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">错题记录</span>
            <span className="text-sm font-mono text-slate-700">
              +{mistakeWeight.toFixed(1)}
            </span>
          </div>
        )}

        {/* Error Rate Weight */}
        {errorRateWeight > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">错误率权重</span>
            <span className="text-sm font-mono text-slate-700">
              +{errorRateWeight.toFixed(2)}
            </span>
          </div>
        )}

        {/* Spaced Repetition Modifier */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">复习状态</span>
          <span className="text-sm font-mono text-slate-700">
            ×{spacedRepetitionModifier.toFixed(2)}
          </span>
        </div>

        {/* New Word Indicator */}
        {isNewWord && (
          <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">
                新词降权
              </span>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              曝光率降低至 {(newWordPenalty * 100).toFixed(0) }%，
              确保不会过于频繁出现。
            </p>
          </div>
        )}
      </div>

      {/* Spaced Repetition State Indicator */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${srStateConfig.bgColor}`}>
            <StateIcon className={`w-3.5 h-3.5 ${srStateConfig.color}`} />
          </div>
          <div className="flex-1">
            <span className="text-xs text-slate-500">复习状态</span>
            <p className={`text-sm font-medium ${srStateConfig.color}`}>
              {srStateConfig.label}
            </p>
          </div>
          {spacedRepetitionState !== 'new' && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {spacedRepetitionState === 'overdue'
                  ? '逾期强化'
                  : spacedRepetitionState === 'due'
                  ? '待复习'
                  : '记忆稳定'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Explanation Text */}
      <div className="px-4 py-3 border-t border-slate-100 bg-blue-50">
        <p className="text-xs text-blue-700 leading-relaxed">
          {explanationText}
        </p>
      </div>
    </div>
  );
}

export default WeightExplanation;