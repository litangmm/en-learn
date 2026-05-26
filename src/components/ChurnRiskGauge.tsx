import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ChurnRiskLevel } from '@/data/types';

/**
 * Risk level configuration with display properties.
 */
const RISK_CONFIG: Record<ChurnRiskLevel, {
  label: string;
  description: string;
  color: string;
  startAngle: number;
  endAngle: number;
}> = {
  low: {
    label: '低风险',
    description: '学习状态稳定',
    color: '#22c55e', // green-500
    startAngle: -135,
    endAngle: -45,
  },
  medium: {
    label: '中风险',
    description: '需关注学习状态',
    color: '#eab308', // yellow-500
    startAngle: -45,
    endAngle: 0,
  },
  high: {
    label: '高风险',
    description: '流失风险上升',
    color: '#f97316', // orange-500
    startAngle: 0,
    endAngle: 45,
  },
  critical: {
    label: '严重',
    description: '立即需要干预',
    color: '#ef4444', // red-500
    startAngle: 45,
    endAngle: 135,
  },
};

/**
 * All risk levels in order from low to critical.
 */
const RISK_LEVELS: ChurnRiskLevel[] = ['low', 'medium', 'high', 'critical'];

/**
 * Generate SVG arc path for a given start and end angle (in degrees).
 */
function createArc(
  cx: number,
  cy: number,
  startAngle: number,
  endAngle: number,
  r: number
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const startRad = toRad(startAngle);
  const endRad = toRad(endAngle);

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/**
 * Props for the ChurnRiskGauge component.
 */
export interface ChurnRiskGaugeProps {
  /** Current risk level to display */
  riskLevel: ChurnRiskLevel;
  /** Optional custom size (width/height). Defaults to 240. */
  size?: number;
  /** Animation delay in seconds. Defaults to 0. */
  delay?: number;
}

/**
 * SVG arc gauge component showing user churn risk level.
 * Displays four segments (critical/high/medium/low) with an animated needle.
 */
export function ChurnRiskGauge({
  riskLevel,
  size = 240,
  delay = 0,
}: ChurnRiskGaugeProps) {
  // Chart center and radius
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.4;

  // Needle rotation for current risk level
  const needleRotation = useMemo(() => {
    // Map risk level to angle: low=-135, medium=-90, high=-45, critical=0
    const levelIndex = RISK_LEVELS.indexOf(riskLevel);
    return -135 + (levelIndex * 45);
  }, [riskLevel]);

  // Generate arc for each segment
  const segments = useMemo(() => {
    return RISK_LEVELS.map((level) => {
      const config = RISK_CONFIG[level];
      const arcRadius = level === riskLevel ? radius - 2 : radius;
      return {
        level,
        path: createArc(cx, cy, config.startAngle, config.endAngle, arcRadius),
        color: config.color,
        isActive: level === riskLevel,
      };
    });
  }, [riskLevel, radius, cx, cy]);

  // Needle dimensions
  const needleLength = radius - 16;
  const needleBaseWidth = 6;

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <svg
        width={size}
        height={size * 0.7}
        viewBox={`0 0 ${size} ${size * 0.7}`}
        className="overflow-visible"
      >
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius + 8}
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {/* Arc segments */}
        {segments.map((seg) => (
          <g key={seg.level}>
            {/* Segment arc */}
            <motion.path
              d={seg.path}
              fill="none"
              stroke={seg.color}
              strokeWidth={seg.isActive ? 12 : 8}
              strokeLinecap="round"
              opacity={seg.isActive ? 1 : 0.4}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: delay + 0.2, duration: 0.6 }}
            />
            {/* Active segment glow effect */}
            {seg.isActive && (
              <motion.path
                d={seg.path}
                fill="none"
                stroke={seg.color}
                strokeWidth={16}
                strokeLinecap="round"
                opacity={0.2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: delay + 0.3, duration: 0.5 }}
              />
            )}
          </g>
        ))}

        {/* Needle */}
        <motion.g
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
          animate={{ rotate: needleRotation }}
          transition={{ delay: delay + 0.4, type: 'spring', stiffness: 100 }}
        >
          {/* Needle body */}
          <polygon
            points={`
              ${cx},${cy - needleLength}
              ${cx - needleBaseWidth / 2},${cy}
              ${cx + needleBaseWidth / 2},${cy}
            `}
            fill={RISK_CONFIG[riskLevel].color}
          />
          {/* Needle center circle */}
          <circle cx={cx} cy={cy} r={8} fill={RISK_CONFIG[riskLevel].color} />
          <circle cx={cx} cy={cy} r={4} fill="#fff" />
        </motion.g>

        {/* Labels at segment boundaries */}
        <text
          x={cx - radius - 20}
          y={cy + 10}
          textAnchor="middle"
          className="text-[10px] fill-slate-500"
        >
          低
        </text>
        <text
          x={cx - 10}
          y={cy - radius - 10}
          textAnchor="middle"
          className="text-[10px] fill-slate-500"
        >
          中
        </text>
        <text
          x={cx + radius + 20}
          y={cy + 10}
          textAnchor="middle"
          className="text-[10px] fill-slate-500"
        >
          高
        </text>
        <text
          x={cx}
          y={cy + radius + 20}
          textAnchor="middle"
          className="text-[10px] fill-slate-500"
        >
          严重
        </text>
      </svg>

      {/* Risk label and description */}
      <div className="text-center -mt-2">
        <p
          className="text-lg font-bold"
          style={{ color: RISK_CONFIG[riskLevel].color }}
        >
          {RISK_CONFIG[riskLevel].label}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {RISK_CONFIG[riskLevel].description}
        </p>
      </div>
    </motion.div>
  );
}

export default ChurnRiskGauge;