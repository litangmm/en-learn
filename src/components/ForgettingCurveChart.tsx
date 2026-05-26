import type { ForgettingCurveData, ForgettingCurvePoint } from '@/hooks/useForgettingCurve';

/**
 * Props for the ForgettingCurveChart component.
 */
export interface ForgettingCurveChartProps {
  /** Forgetting curve data to display */
  data: ForgettingCurveData;
  /** Width of the chart in pixels. Defaults to 300px. */
  width?: number;
  /** Height of the chart in pixels. Defaults to 180px. */
  height?: number;
  /** Whether to show axis labels. Defaults to true. */
  showLabels?: boolean;
}

/**
 * Ebbinghaus forgetting curve SVG chart component.
 * Displays the classic Ebbinghaus retention curve with:
 * - X-axis: Days since review
 * - Y-axis: Memory retention rate (0-100%)
 * - The forgetting curve line showing retention decay over time
 * - Optional historical data points
 * - Current retention marker
 */
export function ForgettingCurveChart({
  data,
  width = 300,
  height = 180,
  showLabels = true,
}: ForgettingCurveChartProps) {
  // Chart dimensions and padding
  const padding = { top: 20, right: 20, bottom: showLabels ? 40 : 20, left: showLabels ? 40 : 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (days: number) => {
    const maxDays = 30; // Cap at 30 days for display
    return padding.left + (Math.min(days, maxDays) / maxDays) * chartWidth;
  };

  const yScale = (retention: number) => {
    return padding.top + ((100 - retention) / 100) * chartHeight;
  };

  // Generate the theoretical Ebbinghaus curve points
  const generateCurvePoints = (maxDays: number = 30): { x: number; y: number; days: number; retention: number }[] => {
    const points: { x: number; y: number; days: number; retention: number }[] = [];
    for (let d = 0; d <= maxDays; d++) {
      const retention = Math.round(100 * Math.exp(-d / 1.25)); // Ebbinghaus formula
      points.push({
        x: xScale(d),
        y: yScale(retention),
        days: d,
        retention,
      });
    }
    return points;
  };

  const theoreticalCurve = generateCurvePoints(30);

  // Generate path for the curve
  const curvePath = theoreticalCurve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Historical data points from review history
  const historicalPoints = data.dataPoints.map((point: ForgettingCurvePoint) => ({
    x: xScale(point.daysSinceReview),
    y: yScale(point.retentionRate),
    retention: point.retentionRate,
    days: point.daysSinceReview,
  }));

  // Current retention marker position
  const currentRetention = data.memoryRetentionScore;
  const currentDays = Math.min(30, Math.max(0, data.daysUntilReview >= 0 ? 30 - data.daysUntilReview : 30));
  const currentX = xScale(currentDays);
  const currentY = yScale(currentRetention);

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  // X-axis labels
  const xLabels = [0, 7, 14, 21, 30];

  // Format retention for display
  const formatRetention = (value: number) => `${value}%`;

  // Format days for display
  const formatDays = (days: number) => `${days}d`;

  return (
    <div data-testid="forgetting-curve-chart" className="w-full">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Background grid */}
        {yLabels.map((label) => (
          <line
            key={`grid-${label}`}
            x1={padding.left}
            y1={yScale(label)}
            x2={width - padding.right}
            y2={yScale(label)}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        ))}

        {/* Y-axis labels */}
        {showLabels && yLabels.map((label) => (
          <text
            key={`y-label-${label}`}
            x={padding.left - 8}
            y={yScale(label)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-[10px] fill-slate-400"
          >
            {formatRetention(label)}
          </text>
        ))}

        {/* X-axis labels */}
        {showLabels && xLabels.map((days) => (
          <text
            key={`x-label-${days}`}
            x={xScale(days)}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            className="text-[10px] fill-slate-400"
          >
            {formatDays(days)}
          </text>
        ))}

        {/* X-axis title */}
        {showLabels && (
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-[10px] fill-slate-400"
          >
            距上次复习天数
          </text>
        )}

        {/* Y-axis title */}
        {showLabels && (
          <text
            x={12}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(-90, 12, ${height / 2})`}
            className="text-[10px] fill-slate-400"
          >
            记忆保留率
          </text>
        )}

        {/* Theoretical Ebbinghaus curve (faded background) */}
        <path
          d={curvePath}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.5"
        />

        {/* Current retention indicator */}
        <circle
          cx={currentX}
          cy={currentY}
          r={6}
          fill={currentRetention >= 60 ? '#22c55e' : currentRetention >= 30 ? '#f59e0b' : '#ef4444'}
          stroke="#ffffff"
          strokeWidth="2"
        />

        {/* Current retention label */}
        <text
          x={currentX}
          y={currentY - 12}
          textAnchor="middle"
          className="text-[10px] fill-slate-600 font-medium"
        >
          {formatRetention(currentRetention)}
        </text>

        {/* Historical data points (if any) */}
        {historicalPoints.map((point, i) => (
          <circle
            key={`hist-point-${i}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />
        ))}

        {/* Review intervals markers */}
        {[1, 3, 7, 14].map((days) => (
          <g key={`interval-${days}`}>
            <line
              x1={xScale(days)}
              y1={padding.top}
              x2={xScale(days)}
              y2={height - padding.bottom}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.3"
            />
            {showLabels && (
              <text
                x={xScale(days)}
                y={height - padding.bottom + 4}
                textAnchor="middle"
                className="text-[9px] fill-slate-300"
              >
                {days}d
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-slate-400" style={{ opacity: 0.5 }} />
          <span>艾宾浩斯曲线</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-current" style={{ color: currentRetention >= 60 ? '#22c55e' : currentRetention >= 30 ? '#f59e0b' : '#ef4444' }} />
          <span>当前保留</span>
        </div>
        {historicalPoints.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" style={{ opacity: 0.7 }} />
            <span>复习记录</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mini version of the forgetting curve chart for compact displays.
 */
export function ForgettingCurveChartMini({
  data,
  width = 120,
  height = 80,
}: {
  data: ForgettingCurveData;
  width?: number;
  height?: number;
}) {
  // Simplified chart without labels
  return (
    <ForgettingCurveChart
      data={data}
      width={width}
      height={height}
      showLabels={false}
    />
  );
}

export default ForgettingCurveChart;