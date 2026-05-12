import { CheckCircle2, Target, Zap, Star } from 'lucide-react';
import type { Goal, GoalType } from '@/data/types';

export interface GoalProgressCardProps {
  goal: Goal;
  /** Display mode: compact = inline bar, full = standalone card */
  mode?: 'compact' | 'full';
  /** Custom color theme for the progress bar */
  colorTheme?: 'blue' | 'green' | 'amber' | 'purple';
  /** Click handler for the card */
  onClick?: () => void;
}

/** Get icon for goal type */
function getGoalIcon(type: GoalType) {
  switch (type) {
    case 'questions':
      return <Target className="w-4 h-4" />;
    case 'xp':
      return <Star className="w-4 h-4" />;
    case 'streak':
      return <Zap className="w-4 h-4" />;
  }
}

/** Get color classes for progress bar */
function getColorClasses(theme: GoalProgressCardProps['colorTheme'], completed: boolean) {
  if (completed) {
    return {
      bar: 'bg-green-500',
      badge: 'bg-green-100 text-green-700 border-green-200',
      icon: 'text-green-500',
      bg: 'bg-green-50',
    };
  }
  switch (theme) {
    case 'green':
      return { bar: 'bg-green-500', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'text-green-500', bg: 'bg-white' };
    case 'amber':
      return { bar: 'bg-amber-500', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'text-amber-500', bg: 'bg-white' };
    case 'purple':
      return { bar: 'bg-purple-500', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'text-purple-500', bg: 'bg-white' };
    default:
      return { bar: 'bg-blue-500', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'text-blue-500', bg: 'bg-white' };
  }
}

/** Default theme per goal type */
function getDefaultTheme(type: GoalType): GoalProgressCardProps['colorTheme'] {
  switch (type) {
    case 'questions':
      return 'blue';
    case 'xp':
      return 'amber';
    case 'streak':
      return 'purple';
  }
}

function getProgressPercentage(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * GoalProgressCard displays a single goal's progress.
 * - compact mode: inline progress bar with label
 * - full mode: standalone card with icon, label, progress bar, and completion badge
 */
export function GoalProgressCard({
  goal,
  mode = 'compact',
  colorTheme,
  onClick,
}: GoalProgressCardProps) {
  const theme = colorTheme ?? getDefaultTheme(goal.type);
  const colors = getColorClasses(theme, goal.completed);
  const percentage = getProgressPercentage(goal.current, goal.target);
  const isClickable = !!onClick;

  if (mode === 'compact') {
    return (
      <div
        className={`
          flex items-center gap-2 py-1
          ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}
        `}
        onClick={onClick}
        data-testid="goal-progress-card-compact"
      >
        <div className={`flex-shrink-0 ${colors.icon}`}>
          {getGoalIcon(goal.type)}
        </div>
        <span className="text-xs font-medium text-slate-600 min-w-[60px]">
          {goal.title}
        </span>
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 min-w-[36px] text-right">
          {goal.current}/{goal.target}
        </span>
        {goal.completed && (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        )}
      </div>
    );
  }

  // full mode
  return (
    <div
      className={`
        relative rounded-xl p-4 border transition-all duration-200
        ${colors.bg}
        ${goal.completed ? 'border-green-200' : 'border-slate-200'}
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
      `}
      onClick={onClick}
      data-testid="goal-progress-card-full"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${goal.completed ? 'bg-green-100' : 'bg-slate-100'}`}>
          <span className={colors.icon}>
            {goal.completed ? <CheckCircle2 className="w-5 h-5" /> : getGoalIcon(goal.type)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Title and completion badge */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-slate-700 truncate">{goal.title}</h3>
            {goal.completed && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${colors.badge}`}>
                已完成
              </span>
            )}
          </div>

          {/* Progress stats */}
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-slate-800">{goal.current}</span>
            <span className="text-sm text-slate-400">/ {goal.target}</span>
            {goal.type === 'xp' && <span className="text-sm text-slate-400">XP</span>}
            {goal.type === 'questions' && <span className="text-sm text-slate-400">题</span>}
            {goal.type === 'streak' && <span className="text-sm text-slate-400">天</span>}
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.bar} rounded-full transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Percentage */}
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-400">{percentage}%</span>
            {goal.period === 'daily' && (
              <span className="text-xs text-slate-400">今日</span>
            )}
            {goal.period === 'weekly' && (
              <span className="text-xs text-slate-400">本周</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
