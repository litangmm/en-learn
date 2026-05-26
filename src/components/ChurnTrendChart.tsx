import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Data point for the trend chart.
 */
export interface TrendDataPoint {
  /** Date string in YYYY-MM-DD format */
  date: string;
  /** Number of triggers on this date */
  count: number;
}

/**
 * Props for the ChurnTrendChart component.
 */
export interface ChurnTrendChartProps {
  /** Trend data to display (last 30 days). If not provided, generates empty state. */
  data?: TrendDataPoint[];
  /** Height of the chart. Defaults to 180. */
  height?: number;
  /** Animation delay in seconds. Defaults to 0. */
  delay?: number;
}

/**
 * SVG line chart showing intervention trigger trends over last 30 days.
 * Features area fill, hover tooltips, and responsive scaling.
 */
export function ChurnTrendChart({
  data = [],
  height = 180,
  delay = 0,
}: ChurnTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Chart dimensions
  const width = 320;
  const paddingX = 40;
  const paddingY = 24;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Check if there's any data
  const hasData = data.some(d => d.count > 0);

  // Calculate max value for scaling (min 5 for nice axis)
  const maxCount = useMemo(() => {
    if (!hasData) return 5;
    return Math.max(5, ...data.map(d => d.count));
  }, [data, hasData]);

  // Generate line path with smooth bezier curves
  const linePath = useMemo(() => {
    if (!hasData) return '';

    const points = data.map((d, i) => {
      const x = paddingX + (i / (data.length - 1)) * chartWidth;
      const y = paddingY + chartHeight - (d.count / maxCount) * chartHeight;
      return { x, y };
    });

    // Create smooth curve
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` Q ${cpX} ${prev.y} ${cpX} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
    }

    return path;
  }, [data, hasData, maxCount, chartWidth, chartHeight]);

  // Generate area fill path
  const areaPath = useMemo(() => {
    if (!hasData || !linePath) return '';

    const firstX = paddingX;
    const lastX = paddingX + chartWidth;
    const baseline = paddingY + chartHeight;

    return `${linePath} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`;
  }, [hasData, linePath, chartWidth, chartHeight]);

  // Generate X-axis labels (every 7 days)
  const xLabels = useMemo(() => {
    if (!hasData) return [];

    const labels: { x: number; label: string; date: string }[] = [];
    const step = 7;

    for (let i = 0; i < data.length; i += step) {
      const x = paddingX + (i / (data.length - 1)) * chartWidth;
      const date = new Date(data[i].date);
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      labels.push({ x, label, date: data[i].date });
    }

    // Always include last day
    const lastX = paddingX + chartWidth;
    const lastDate = new Date(data[data.length - 1].date);
    labels.push({
      x: lastX,
      label: `${lastDate.getMonth() + 1}/${lastDate.getDate()}`,
      date: data[data.length - 1].date,
    });

    return labels;
  }, [data, hasData, chartWidth]);

  // Generate Y-axis labels (4 ticks)
  const yLabels = useMemo(() => {
    const count = 4;
    return Array.from({ length: count }, (_, i) => {
      const value = Math.round((maxCount / (count - 1)) * i);
      const y = paddingY + chartHeight - (value / maxCount) * chartHeight;
      return { y, value };
    });
  }, [maxCount, chartHeight]);

  // Get tooltip position for a given index
  const getTooltipPos = (index: number) => {
    const x = paddingX + (index / (data.length - 1)) * chartWidth;
    const value = data[index].count;
    const y = paddingY + chartHeight - (value / maxCount) * chartHeight;
    return { x, y };
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (!hasData) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center"
        style={{ width, height }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
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
          {/* Empty state icon */}
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm fill-slate-400"
          >
            暂无干预数据
          </text>
        </svg>
        <p className="text-sm text-slate-400 mt-2">最近30天无干预触发</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative"
      style={{ width, height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
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
              className="text-[10px] fill-slate-400"
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
            y={height - 4}
            textAnchor="middle"
            className="text-[10px] fill-slate-500"
          >
            {label.label}
          </text>
        ))}

        {/* Area fill */}
        {areaPath && (
          <motion.path
            d={areaPath}
            fill="url(#trendGradient)"
            opacity="0.3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: delay + 0.3, duration: 0.4 }}
          />
        )}

        {/* Line */}
        {linePath && (
          <motion.path
            d={linePath}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.8 }}
          />
        )}

        {/* Data points */}
        {data.map((d, i) => {
          const x = paddingX + (i / (data.length - 1)) * chartWidth;
          const y = paddingY + chartHeight - (d.count / maxCount) * chartHeight;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={`point-${i}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <motion.circle
                cx={x}
                cy={y}
                r={isHovered ? 5 : 3}
                fill={isHovered ? '#ea580c' : '#f97316'}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.1 + i * 0.02, duration: 0.2 }}
              />
            </g>
          );
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <motion.div
          className="absolute bg-slate-800 text-white px-2 py-1 rounded text-xs pointer-events-none z-10"
          style={{
            left: getTooltipPos(hoveredIndex).x,
            top: getTooltipPos(hoveredIndex).y - 36,
            transform: 'translateX(-50%)',
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="font-medium">
            {data[hoveredIndex].count} 次干预
          </div>
          <div className="text-slate-300 text-[10px]">
            {formatDate(data[hoveredIndex].date)}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default ChurnTrendChart;