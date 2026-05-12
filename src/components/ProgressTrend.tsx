import { useState, useMemo } from 'react';
import { getDailyXP } from '@/hooks/useProgressStats';
import { type DailyTrend } from '@/data/types';

/**
 * Metric type for the trend chart.
 */
export type TrendMetric = 'questions' | 'xp';

/**
 * Props for the ProgressTrend component.
 */
export interface ProgressTrendProps {
  /** Custom data to display. If not provided, uses getDailyXP() from storage. */
  data?: DailyTrend[];
  /** Number of days to display. Defaults to 7. */
  days?: number;
  /** Height of the chart. Defaults to 160. */
  height?: number;
  /** Callback when a day is clicked. */
  onDayClick?: (_date: string) => void;
}

/**
 * SVG Line chart component for displaying daily learning trends.
 * Shows 7 days of XP or questions data with interactive tooltips.
 */
export function ProgressTrend({
  data,
  days = 7,
  height = 160,
  onDayClick,
}: ProgressTrendProps) {
  // Get data from storage if not provided
  const dailyData = data ?? getDailyXP(days);

  // Check if there's any data
  const hasData = dailyData.some(d => d.xp > 0 || d.questions > 0);

  // Metric toggle state
  const [metric, setMetric] = useState<TrendMetric>('xp');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Chart dimensions
  const width = 320;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    if (metric === 'xp') {
      return Math.max(1, ...dailyData.map(d => d.xp));
    }
    return Math.max(1, ...dailyData.map(d => d.questions));
  }, [dailyData, metric]);

  // Generate line path
  const linePath = useMemo(() => {
    if (!hasData) return '';

    const points = dailyData.map((d, i) => {
      const x = paddingX + (i / (dailyData.length - 1)) * chartWidth;
      const value = metric === 'xp' ? d.xp : d.questions;
      const y = paddingY + chartHeight - (value / maxValue) * chartHeight;
      return { x, y };
    });

    // Create smooth curve using quadratic bezier
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` Q ${cpX} ${prev.y} ${cpX} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
    }

    return path;
  }, [dailyData, hasData, metric, maxValue, chartWidth, chartHeight]);

  // Generate area fill path
  const areaPath = useMemo(() => {
    if (!hasData || !linePath) return '';

    const firstX = paddingX;
    const lastX = paddingX + chartWidth;
    const baseline = paddingY + chartHeight;

    return `${linePath} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`;
  }, [hasData, linePath, chartWidth, chartHeight]);

  // Generate X-axis labels
  const xLabels = dailyData.map((d, i) => {
    const x = paddingX + (i / (dailyData.length - 1)) * chartWidth;
    return { x, label: d.dayName.slice(1), date: d.date };
  });

  // Generate Y-axis labels
  const yLabels = useMemo(() => {
    const count = 4;
    return Array.from({ length: count }, (_, i) => {
      const value = Math.round((maxValue / (count - 1)) * i);
      const y = paddingY + chartHeight - (value / maxValue) * chartHeight;
      return { y, value };
    });
  }, [maxValue, chartHeight]);

  // Get value for a specific day
  const getValue = (d: DailyTrend) => metric === 'xp' ? d.xp : d.questions;

  // Get tooltip position
  const getTooltipPos = (index: number) => {
    const x = paddingX + (index / (dailyData.length - 1)) * chartWidth;
    const value = getValue(dailyData[index]);
    const y = paddingY + chartHeight - (value / maxValue) * chartHeight;
    return { x, y };
  };

  if (!hasData) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ width, height }}
      >
        <svg width={width} height={height} className="text-slate-300">
          {/* Draw empty grid */}
          {yLabels.map((label, i) => (
            <line
              key={`grid-${i}`}
              x1={paddingX}
              y1={label.y}
              x2={width - paddingX}
              y2={label.y}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.3"
            />
          ))}
        </svg>
        <p className="text-sm text-slate-400 mt-2">坚持学习解锁趋势图</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {/* Metric toggle */}
      <div className="absolute top-0 right-0 flex gap-1 bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => setMetric('xp')}
          className={`px-2 py-1 text-xs rounded ${
            metric === 'xp'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          XP
        </button>
        <button
          onClick={() => setMetric('questions')}
          className={`px-2 py-1 text-xs rounded ${
            metric === 'questions'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          题数
        </button>
      </div>

      <svg
        width={width}
        height={height}
        className="overflow-visible"
      >
        {/* Y-axis grid lines */}
        {yLabels.map((label, i) => (
          <g key={`y-grid-${i}`}>
            <line
              x1={paddingX}
              y1={label.y}
              x2={width - paddingX}
              y2={label.y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={paddingX - 8}
              y={label.y}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-slate-400"
            >
              {label.value}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <text
            key={`x-label-${i}`}
            x={label.x}
            y={height - 8}
            textAnchor="middle"
            className="text-xs fill-slate-500"
          >
            {label.label}
          </text>
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#trendGradient)"
          opacity="0.3"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {dailyData.map((d, i) => {
          const value = getValue(d);
          const x = paddingX + (i / (dailyData.length - 1)) * chartWidth;
          const y = paddingY + chartHeight - (value / maxValue) * chartHeight;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={`point-${i}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onDayClick?.(d.date)}
              className="cursor-pointer"
            >
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? '#1d4ed8' : '#3b82f6'}
                className="transition-all duration-150"
              />
            </g>
          );
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute bg-slate-800 text-white px-2 py-1 rounded text-xs pointer-events-none z-10"
          style={{
            left: getTooltipPos(hoveredIndex).x,
            top: getTooltipPos(hoveredIndex).y - 40,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-medium">
            {metric === 'xp' ? `${getValue(dailyData[hoveredIndex])} XP` : `${getValue(dailyData[hoveredIndex])} 题`}
          </div>
          <div className="text-slate-300 text-[10px]">
            {dailyData[hoveredIndex].date}
          </div>
        </div>
      )}
    </div>
  );
}
