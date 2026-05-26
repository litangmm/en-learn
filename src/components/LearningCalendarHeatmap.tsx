import { useMemo, useState } from 'react';
import { HISTORY_KEY } from '@/services/storage';
import type { SessionHistory } from '@/data/types';

/**
 * Activity level for calendar cells.
 * Based on number of sessions or questions per day.
 */
export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Single day data for the calendar heatmap.
 */
export interface HeatmapDay {
  date: string;
  /** Day of month (1-31) */
  dayOfMonth: number;
  /** Day of week (0=Sunday, 6=Saturday) */
  dayOfWeek: number;
  /** Number of sessions on this day */
  sessionCount: number;
  /** Total questions answered on this day */
  questionCount: number;
  /** Total XP earned on this day */
  xpEarned: number;
  /** Activity level (0-4) */
  level: ActivityLevel;
}

/**
 * Props for the LearningCalendarHeatmap component.
 */
export interface LearningCalendarHeatmapProps {
  /** Number of weeks to display (default 12) */
  weeks?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Day labels for the week (in Chinese).
 */
const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * Activity level colors (GitHub contribution style).
 * 0 = none (gray), 1 = low, 2 = medium, 3 = high, 4 = highest
 */
const ACTIVITY_COLORS: Record<ActivityLevel, string> = {
  0: 'bg-slate-100',
  1: 'bg-blue-200',
  2: 'bg-blue-400',
  3: 'bg-blue-500',
  4: 'bg-blue-600',
};

/**
 * Activity level labels for the legend.
 */
const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  0: '无活动',
  1: '1-2 题',
  2: '3-5 题',
  3: '6-10 题',
  4: '11+ 题',
};

/**
 * Calculate activity level based on question count.
 * 4 levels: none (gray), low, medium, high (blue gradient)
 */
function calculateActivityLevel(questionCount: number): ActivityLevel {
  if (questionCount === 0) return 0;
  if (questionCount <= 2) return 1;
  if (questionCount <= 5) return 2;
  if (questionCount <= 10) return 3;
  return 4;
}

/**
 * Format date for tooltip display.
 */
function formatTooltipDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/**
 * Get month labels for the calendar header.
 */
function getMonthLabels(calendar: HeatmapDay[]): Array<{ month: string; weekIndex: number }> {
  const labels: Array<{ month: string; weekIndex: number }> = [];
  let currentMonth = '';

  calendar.forEach((day, index) => {
    const weekIndex = Math.floor(index / 7);
    const date = new Date(day.date);
    const month = date.toLocaleDateString('zh-CN', { month: 'short' });

    if (month !== currentMonth) {
      labels.push({ month, weekIndex });
      currentMonth = month;
    }
  });

  return labels;
}

/**
 * Parse history data from localStorage.
 * This is needed because the component should directly read from HISTORY_KEY.
 */
function parseHistoryFromStorage(): SessionHistory[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw === null) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter valid history entries
    return parsed.filter((item): item is SessionHistory => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.timestamp === 'number'
      );
    });
  } catch {
    return [];
  }
}

/**
 * Build calendar data for the past N weeks.
 */
function buildCalendarData(weeks: number): HeatmapDay[] {
  const history = parseHistoryFromStorage();
  const result: HeatmapDay[] = [];

  const today = new Date();
  // Start from the beginning of 12 weeks ago (aligned to Sunday)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * 7) - today.getDay());

  // Build activity map from history
  const activityMap: Record<string, { sessions: number; questions: number; xp: number }> = {};
  history.forEach(entry => {
    const dateStr = new Date(entry.timestamp).toISOString().split('T')[0];
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { sessions: 0, questions: 0, xp: 0 };
    }
    activityMap[dateStr].sessions += 1;
    activityMap[dateStr].questions += entry.totalQuestions;
    activityMap[dateStr].xp += entry.score;
  });

  // Generate calendar days
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + (6 - today.getDay())); // End at this Saturday

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const activity = activityMap[dateStr] || { sessions: 0, questions: 0, xp: 0 };

    result.push({
      date: dateStr,
      dayOfMonth: current.getDate(),
      dayOfWeek: current.getDay(),
      sessionCount: activity.sessions,
      questionCount: activity.questions,
      xpEarned: activity.xp,
      level: calculateActivityLevel(activity.questions),
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * Learning Calendar Heatmap component.
 * Displays a GitHub-style contribution heatmap showing learning activity over the past few months.
 */
export function LearningCalendarHeatmap({ weeks = 12, className = '' }: LearningCalendarHeatmapProps) {
  const calendar = useMemo(() => {
    return buildCalendarData(weeks);
  }, [weeks]);

  // Group calendar days by week
  const weeksData = useMemo(() => {
    const result: HeatmapDay[][] = [];
    for (let i = 0; i < calendar.length; i += 7) {
      result.push(calendar.slice(i, i + 7));
    }
    return result;
  }, [calendar]);

  // Filter to show only the requested number of weeks
  const displayWeeks = weeksData.slice(-weeks);

  // Calculate stats
  const activeDays = calendar.filter(d => d.level > 0).length;
  const totalDays = calendar.length;
  const totalQuestions = calendar.reduce((sum, d) => sum + d.questionCount, 0);
  const totalSessions = calendar.reduce((sum, d) => sum + d.sessionCount, 0);
  const totalXP = calendar.reduce((sum, d) => sum + d.xpEarned, 0);

  // Calculate current streak
  let currentStreak = 0;
  for (let i = calendar.length - 1; i >= 0; i--) {
    if (calendar[i].level > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Get month labels
  const monthLabels = getMonthLabels(calendar);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}
      data-testid="learning-calendar-heatmap"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-700">学习热力图</h3>
            <p className="text-xs text-slate-400">
              {activeDays}/{totalDays} 天活跃
            </p>
          </div>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
            <svg
              className="w-3 h-3 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium text-blue-600">连续 {currentStreak} 天</span>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Day labels */}
          <div className="flex gap-1 pl-6">
            {DAY_LABELS.map((day, i) => (
              <div
                key={day}
                className="w-4 h-4 text-xs text-slate-400 flex items-center justify-center"
              >
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="flex gap-1">
            {/* Month labels column */}
            <div className="flex flex-col gap-1 pr-1">
              {Array.from({ length: Math.ceil(displayWeeks.length / 4) }).map((_, i) => (
                <div key={i} className="h-4 flex items-center">
                  {i > 0 && (
                    <span className="text-xs text-slate-300">
                      {monthLabels.find(m => m.weekIndex === i * 4)?.month || ''}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {displayWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <TooltipCell
                    key={`${weekIndex}-${dayIndex}`}
                    day={day}
                    colorClass={ACTIVITY_COLORS[day.level]}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend and Stats */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        {/* Legend */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">学习强度:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-100" title={ACTIVITY_LABELS[0]} />
            <div className="w-3 h-3 rounded-sm bg-blue-200" title={ACTIVITY_LABELS[1]} />
            <div className="w-3 h-3 rounded-sm bg-blue-400" title={ACTIVITY_LABELS[2]} />
            <div className="w-3 h-3 rounded-sm bg-blue-500" title={ACTIVITY_LABELS[3]} />
            <div className="w-3 h-3 rounded-sm bg-blue-600" title={ACTIVITY_LABELS[4]} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{totalSessions} 次</span>
          <span>{totalQuestions} 题</span>
          <span>{totalXP} XP</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Tooltip cell component with hover tooltip.
 */
interface TooltipCellProps {
  day: HeatmapDay;
  colorClass: string;
}

function TooltipCell({ day, colorClass }: TooltipCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`w-4 h-4 rounded-sm ${colorClass} cursor-pointer transition-opacity hover:opacity-80`}
        data-testid={`calendar-day-${day.date}`}
        data-level={day.level}
      />
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap shadow-lg">
          <div className="font-medium">{formatTooltipDate(day.date)}</div>
          <div className="text-slate-300">
            {day.questionCount > 0 ? (
              <>
                {day.sessionCount} 次练习 · {day.questionCount} 题 · {day.xpEarned} XP
              </>
            ) : (
              '无学习活动'
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

export default LearningCalendarHeatmap;