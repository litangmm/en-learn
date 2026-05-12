export interface XPBarProps {
  level: number;
  progress: number;
  compact?: boolean;
  onClick?: () => void;
  /** Optional daily questions goal progress: { current, target } */
  goalProgress?: { current: number; target: number } | null;
}

export function XPBar({ level, progress, compact = false, onClick, goalProgress }: XPBarProps) {
  const isClickable = !!onClick;

  // Calculate goal completion percentage
  const goalPercent = goalProgress && goalProgress.target > 0
    ? Math.min(Math.round((goalProgress.current / goalProgress.target) * 100), 100)
    : null;
  const goalCompleted = goalPercent !== null && goalPercent >= 100;

  if (compact) {
    const Container = isClickable ? 'button' : 'div';
    return (
      <Container
        onClick={onClick}
        className={`
          flex items-center gap-2
          ${isClickable ? 'hover:opacity-80 active:opacity-70 cursor-pointer' : ''}
        `}
        data-testid="xp-bar-compact"
      >
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
          Lv.{level}
        </span>
        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
        {/* Daily questions goal mini bar */}
        {goalPercent !== null && goalProgress && (
          <div
            className={`w-8 h-1 rounded-full overflow-hidden ${goalCompleted ? 'bg-green-400' : 'bg-slate-200'}`}
            title={`答题目标: ${goalProgress.current}/${goalProgress.target}`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${goalCompleted ? 'bg-green-500' : 'bg-amber-400'}`}
              style={{ width: `${goalPercent}%` }}
            />
          </div>
        )}
      </Container>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          等级 {level}
        </span>
        <span className="text-xs text-slate-500">
          {progress}%
        </span>
      </div>
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
      {/* Daily questions goal section */}
      {goalPercent !== null && goalProgress && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">答题目标</span>
            <span className={`text-xs ${goalCompleted ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
              {goalProgress.current}/{goalProgress.target}
              {goalCompleted && ' ✓'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${goalCompleted ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${goalPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
