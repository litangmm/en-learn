import { useState } from 'react';
import { type ModeAccuracy, type PracticeMode } from '@/data/types';

/**
 * Props for the AbilityRadar component.
 */
export interface AbilityRadarProps {
  /** Array of mode accuracy data (4 modes). If not provided, fetches from storage. */
  data?: ModeAccuracy[];
  /** Size of the radar chart in pixels. Defaults to responsive based on viewport. */
  size?: number;
  /** Whether to show mode labels. Defaults to true. */
  showLabels?: boolean;
  /** Callback when a mode is selected/deselected by clicking a data point. */
  onModeSelect?: (_mode: PracticeMode | null) => void;
}

/** Mode labels in Chinese */
const MODE_LABELS: Record<PracticeMode, string> = {
  'fill-in-blanks': '填空',
  'multiple-choice': '选择',
  'sentence-reorder': '排序',
  'dictation': '听写',
};

/** Default mode accuracy values */
const DEFAULT_MODE_DATA: ModeAccuracy[] = [
  { mode: 'fill-in-blanks', accuracy: 0, totalQuestions: 0, correctCount: 0 },
  { mode: 'multiple-choice', accuracy: 0, totalQuestions: 0, correctCount: 0 },
  { mode: 'sentence-reorder', accuracy: 0, totalQuestions: 0, correctCount: 0 },
  { mode: 'dictation', accuracy: 0, totalQuestions: 0, correctCount: 0 },
];

/** SVG text anchor values */
type TextAnchor = 'start' | 'middle' | 'end';

/**
 * SVG Radar chart component for displaying ability accuracy across 4 practice modes.
 * Shows 4 axes: Fill-in-blanks, Multiple-choice, Sentence-reorder, Dictation.
 * Each axis represents a mode's accuracy (0-100%).
 */
export function AbilityRadar({
  data,
  size = 240,
  showLabels = true,
  onModeSelect,
}: AbilityRadarProps) {
  // Use provided data or default empty data (storage fetch is handled by parent)
  const modeData = data ?? DEFAULT_MODE_DATA;

  // Check if there's any data
  const hasData = modeData.some(m => m.totalQuestions > 0);

  // Track currently highlighted (selected) mode
  const [highlightedMode, setHighlightedMode] = useState<PracticeMode | null>(null);

  // Calculate dimensions
  const center = size / 2;
  const maxRadius = size / 2 - (showLabels ? 40 : 20);

  // For 4 modes, use diamond shape (0°, 90°, 180°, 270° = top, right, bottom, left)
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

  // Generate grid rings (20%, 40%, 60%, 80%, 100%)
  const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0].map(scale => {
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

  // Format accuracy for label
  const formatAccuracy = (accuracy: number) => `${accuracy}%`;

  if (!hasData) {
    return (
      <div
        data-testid="ability-radar"
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
              strokeDasharray="4,4"
              opacity="0.3"
            />
          ))}
          {/* Draw empty ring */}
          <polygon
            points={axisPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.3"
          />
        </svg>
        <p className="text-sm text-slate-400 mt-2">暂无数据</p>
      </div>
    );
  }

  return (
    <div
      data-testid="ability-radar"
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
          const mode = modeData[i].mode;
          const isHighlighted = highlightedMode === mode;

          return (
            <g
              key={`point-${i}`}
              onClick={() => {
                // Toggle selection: clicking same mode deselects, clicking different mode selects
                const newMode = isHighlighted ? null : mode;
                setHighlightedMode(newMode);
                onModeSelect?.(newMode);
              }}
              className="cursor-pointer"
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={isHighlighted ? 8 : 5}
                fill={isHighlighted ? '#1d4ed8' : '#3b82f6'}
                stroke={isHighlighted ? '#ffffff' : 'transparent'}
                strokeWidth="2"
                className="transition-all duration-150"
              />
            </g>
          );
        })}

        {/* Mode labels */}
        {showLabels && modeData.map((mode, i) => {
          const angle = fourAngles[i];
          const labelRadius = maxRadius + 25;
          const labelPoint = getPoint(angle, labelRadius);
          const label = MODE_LABELS[mode.mode];
          const accuracy = mode.accuracy;

          // Adjust text alignment based on position
          let textAnchor: TextAnchor = 'middle';

          if (angle === 0) {
            textAnchor = 'start';
          } else if (angle === 180) {
            textAnchor = 'end';
          }

          return (
            <g key={`label-${i}`}>
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-xs fill-slate-600 font-medium"
              >
                {label}
              </text>
              <text
                x={labelPoint.x}
                y={labelPoint.y + 14}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-xs fill-slate-400"
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