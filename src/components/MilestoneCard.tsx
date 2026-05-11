import { type ReactNode } from 'react';

export interface MilestoneCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number; // 0-100 percentage
  onClick?: () => void;
}

export function MilestoneCard({
  icon,
  title,
  value,
  subtitle,
  progress,
  onClick,
}: MilestoneCardProps) {
  const isClickable = !!onClick;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        relative bg-white rounded-xl p-4 text-left transition-all duration-200
        border border-slate-100 shadow-sm
        ${isClickable
          ? 'hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 cursor-pointer active:translate-y-0'
          : 'cursor-default'
        }
      `}
      data-testid="milestone-card"
    >
      {/* Icon */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-medium text-slate-600 truncate">{title}</h3>
          {/* Value */}
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Progress bar (optional) */}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}