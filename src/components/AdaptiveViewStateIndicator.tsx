import { Brain, Zap, Coffee, Target } from 'lucide-react';
import { useAdaptiveViewContext } from '@/hooks/useAdaptiveViewContext';
import type { FlowState } from '@/hooks/useFlowState';
import type { AdaptiveViewState } from '@/hooks/useAdaptiveViewContext';

// ---------------------------------------------------------------------------
// Flow State Configuration
// ---------------------------------------------------------------------------

interface FlowStateConfig {
  label: string;
  icon: typeof Brain;
  bgColor: string;
  textColor: string;
  borderColor: string;
  emoji: string;
}

const FLOW_STATE_CONFIGS: Record<FlowState, FlowStateConfig> = {
  focused: {
    label: '专注',
    icon: Zap,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    emoji: '⚡',
  },
  normal: {
    label: '正常',
    icon: Brain,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    emoji: '🧠',
  },
  fatigued: {
    label: '疲惫',
    icon: Coffee,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    emoji: '😴',
  },
};

// ---------------------------------------------------------------------------
// View Display Names
// ---------------------------------------------------------------------------

const VIEW_LABELS: Record<string, string> = {
  practice: '练习',
  learning: '学习',
  review: '复习',
  modes: '模式',
  challenge: '挑战',
  leaderboard: '排行榜',
  progress: '进度',
  achievement: '成就',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface AdaptiveViewStateIndicatorProps {
  /** Optional: Override the state from context */
  overrideState?: Partial<AdaptiveViewState>;
  /** Optional: Hide the priority badge */
  hidePriority?: boolean;
  /** Optional: Hide the recommended views */
  hideRecommendedViews?: boolean;
  /** Optional: Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Indicator component showing current adaptive view state.
 *
 * Displays:
 * - Flow state badge (focused/normal/fatigued) with appropriate color coding
 * - Recommended views or "practice" as default
 * - Priority adjustment indicator
 *
 * @example Basic usage
 * ```tsx
 * <AdaptiveViewStateIndicator />
 * ```
 *
 * @example With overrides
 * ```tsx
 * <AdaptiveViewStateIndicator
 *   overrideState={{ flowState: 'focused' }}
 *   compact
 * />
 * ```
 */
export function AdaptiveViewStateIndicator({
  overrideState,
  hidePriority = false,
  hideRecommendedViews = false,
  compact = false,
}: AdaptiveViewStateIndicatorProps) {
  const context = useAdaptiveViewContext();

  // Merge override state with context (override takes precedence)
  const state: AdaptiveViewState = {
    ...context,
    ...overrideState,
  };

  const { flowState, recommendedViews, priorityAdjustment } = state;
  const config = FLOW_STATE_CONFIGS[flowState];
  const Icon = config.icon;

  // Default to 'practice' if no recommended views
  const displayViews = recommendedViews.length > 0 ? recommendedViews : ['practice'];

  // Format priority adjustment for display
  const priorityDisplay =
    priorityAdjustment > 1
      ? `+${((priorityAdjustment - 1) * 100).toFixed(0)}%`
      : priorityAdjustment < 1
        ? `${((priorityAdjustment - 1) * 100).toFixed(0)}%`
        : '0%';

  const isPriorityBoosted = priorityAdjustment > 1;
  const isPriorityReduced = priorityAdjustment < 1;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 ${config.bgColor} rounded-full border ${config.borderColor}`}
        title={`${config.label}状态 · 推荐: ${displayViews.map((v) => VIEW_LABELS[v] || v).join(', ')}`}
      >
        <span className="text-sm">{config.emoji}</span>
        <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Flow State Badge */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 ${config.bgColor} rounded-full border ${config.borderColor}`}
      >
        <Icon className={`w-4 h-4 ${config.textColor}`} />
        <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
      </div>

      {/* Recommended Views Badge */}
      {!hideRecommendedViews && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
          <Target className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">推荐:</span>
            <span className="text-sm font-medium text-slate-700">
              {displayViews.map((v) => VIEW_LABELS[v] || v).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Priority Indicator */}
      {!hidePriority && (
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isPriorityBoosted
              ? 'bg-green-50 text-green-700 border border-green-200'
              : isPriorityReduced
                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
          title={`难度调整: ${priorityDisplay}`}
        >
          <span className={isPriorityBoosted ? 'text-green-600' : isPriorityReduced ? 'text-orange-600' : 'text-slate-500'}>
            {isPriorityBoosted ? '↑' : isPriorityReduced ? '↓' : '→'}
          </span>
          <span>{priorityDisplay}</span>
        </div>
      )}
    </div>
  );
}

export default AdaptiveViewStateIndicator;