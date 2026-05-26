import type { ModeAccuracy } from '@/data/types';

/**
 * Props for the AbilityRadarMini component.
 */
export interface AbilityRadarMiniProps {
  /** Array of mode accuracy data (4 modes). */
  data?: ModeAccuracy[];
  /** Size of the radar chart in pixels. Defaults to 140px. */
  size?: number;
}

/** Default mode accuracy values */
const DEFAULT_MODE_DATA: ModeAccuracy[] = [
  { mode: 'fill-in-blanks', accuracy: 0, totalQuestions: 0, correctCount: 0 },
  { mode: 'multiple-choice', accuracy: 0, totalQuestions: 0, correctCount: 0 },
  { mode: 'sentence-reorder', accuracy: 0, totalQuestions: 0, correctCount: 0 },
  { mode: 'dictation', accuracy: 0, totalQuestions: 0, correctCount: 0 },
];

/**
 * SVG Radar chart component for displaying ability accuracy across 4 practice modes.
 * Compact version with smaller default size (140px vs AbilityRadar's 240px).
 * Shows 4 axes: Fill-in-blanks, Multiple-choice, Sentence-reorder, Dictation.
 * Each axis represents a mode's accuracy (0-100%).
 */
export function AbilityRadarMini({
  data,
  size = 140,
}: AbilityRadarMiniProps) {
  // Use provided data or default empty data
  const modeData = data ?? DEFAULT_MODE_DATA;

  // Check if there's any data
  const hasData = modeData.some(m => m.totalQuestions > 0);

  // Calculate dimensions
  const center = size / 2;
  const maxRadius = size / 2 - 12;

  // For 4 modes, use diamond shape (0, 90, 180, 270 degrees)
  const fourAngles = [-90, 0, 90, 180];

  // Convert angle to radians
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  // Calculate point position
  const getPoint = (angle: number, radius: number) => {
    const rad = toRadians(angle);
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  // Generate axis endpoints for the 4 modes
  const axisPoints = fourAngles.map(angle => getPoint(angle, maxRadius));

  // Generate grid rings (50%, 100%)
  const gridRings = [0.5, 1.0].map(scale => {
    return fourAngles.map(angle => {
      return getPoint(angle, maxRadius * scale);
    });
  });

  // Generate data polygon points
  const dataPolygon = hasData
    ? modeData.map((mode, i) => {
        const angle = fourAngles[i];
        const accuracy = mode.accuracy / 100;
        const radius = maxRadius * accuracy;
        return getPoint(angle, radius);
      })
    : [];

  // Format accuracy for display
  const formatAccuracy = (accuracy: number) => `${accuracy}%`;

  if (!hasData) {
    return (
      <div
        data-testid="ability-radar-mini"
        className="flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="text-slate-300">
          {/* Draw empty diamond shape */}
          {axisPoints.map((point, i) => (
            <line
              key={`empty-axis-${i}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.3"
            />
          ))}
          {/* Draw empty ring */}
          <polygon
            points={axisPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.3"
          />
        </svg>
        <p className="text-xs text-slate-400 mt-1">暂无数据</p>
      </div>
    );
  }

  return (
    <div
      data-testid="ability-radar-mini"
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Grid rings */}
        {gridRings.map((ring, ringIndex) => (
          <polygon
            key={`ring-${ringIndex}`}
            points={ring.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {axisPoints.map((point, i) => (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={dataPolygon.map(p => `${p.x},${p.y}`).join(' ')}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPolygon.map((point, i) => {
          const modeAccuracy = modeData[i];
          const accuracy = modeAccuracy.accuracy;

          return (
            <g key={`point-${i}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="1"
              />
              {/* Tooltip-like accuracy label */}
              <text
                x={point.x}
                y={point.y - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[8px] fill-slate-600 font-medium"
              >
                {formatAccuracy(accuracy)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}