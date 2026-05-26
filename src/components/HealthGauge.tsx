import type { HealthScoreLevel } from '@/data/types';

/**
 * Props for the HealthGauge component.
 */
export interface HealthGaugeProps {
  /** Health score value (0-100) */
  score: number;
  /** Health level category */
  level: HealthScoreLevel;
  /** Color for the gauge */
  color: string;
  /** Size of the gauge in pixels. Defaults to 180. */
  size?: number;
}

/**
 * Health score circular gauge component.
 * Displays a circular progress indicator showing the user's learning health score.
 *
 * @example
 * ```tsx
 * <HealthGauge
 *   score={85}
 *   level="high"
 *   color="#22c55e"
 *   size={180}
 * />
 * ```
 */
export function HealthGauge({
  score,
  level,
  color,
  size = 180,
}: HealthGaugeProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const levelLabels: Record<HealthScoreLevel, string> = {
    critical: '需要关注',
    low: '待提升',
    medium: '良好',
    high: '优秀',
  };

  return (
    <div className="relative inline-flex items-center justify-center" data-testid="health-gauge">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-slate-500 mt-1">{levelLabels[level]}</span>
      </div>
    </div>
  );
}

export default HealthGauge;