import { Flame } from 'lucide-react';
import type { CalendarDay } from '@/hooks/useProgressStats';

/**
 * Props for the ReviewStreakCalendar component.
 */
export interface ReviewStreakCalendarProps {
  /** Array of calendar day data */
  calendar: CalendarDay[];
  /** Number of weeks to display */
  weeks?: number;
}

/**
 * Get the activity level color based on questions answered.
 * Similar to GitHub's contribution graph color scheme.
 */
function getActivityColor(questions: number): string {
  if (questions === 0) return 'bg-slate-100';
  if (questions < 5) return 'bg-blue-200';
  if (questions < 10) return 'bg-blue-300';
  if (questions < 20) return 'bg-blue-400';
  return 'bg-blue-500';
}

/**
 * Day labels for the week.
 */
const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * Month labels for display.
 */
function getMonthLabels(calendar: CalendarDay[]): Array<{ month: string; weekIndex: number }> {
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
 * Review Streak Calendar component for ProgressHub.
 * Displays a GitHub-style contribution graph showing learning activity over time.
 */
export function ReviewStreakCalendar({ calendar, weeks = 12 }: ReviewStreakCalendarProps) {
  // Group calendar days by week
  const weeksData: CalendarDay[][] = [];
  for (let i = 0; i < calendar.length; i += 7) {
    weeksData.push(calendar.slice(i, i + 7));
  }

  // Calculate stats
  const activeDays = calendar.filter(d => d.hasActivity).length;
  const totalDays = calendar.length;
  const totalQuestions = calendar.reduce((sum, d) => sum + d.questionsAnswered, 0);
  const totalXP = calendar.reduce((sum, d) => sum + d.xpEarned, 0);

  // Calculate current streak
  let currentStreak = 0;
  for (let i = calendar.length - 1; i >= 0; i--) {
    if (calendar[i].hasActivity) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Get month labels
  const monthLabels = getMonthLabels(calendar);

  // Filter to show only the requested number of weeks
  const displayWeeks = weeksData.slice(-weeks);

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4"
      data-testid="review-streak-calendar"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-700">学习日历</h3>
            <p className="text-xs text-slate-400">
              {activeDays}/{totalDays} 天活跃
            </p>
          </div>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-full">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">连续 {currentStreak} 天</span>
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
            {/* Week index labels */}
            <div className="flex flex-col gap-1 pr-1">
              {Array.from({ length: Math.ceil(displayWeeks.length / 4) }).map((_, i) => (
                <div key={i} className="h-4 flex items-center">
                  {i > 0 && (
                    <span className="text-xs text-slate-300">{monthLabels.find(m => m.weekIndex === i * 4)?.month || ''}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {displayWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-4 h-4 rounded-sm ${getActivityColor(day.questionsAnswered)}`}
                    title={`${day.date}: ${day.questionsAnswered} 题, ${day.xpEarned} XP`}
                    data-testid={`calendar-day-${day.date}`}
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
            <div className="w-3 h-3 rounded-sm bg-slate-100" />
            <div className="w-3 h-3 rounded-sm bg-blue-200" />
            <div className="w-3 h-3 rounded-sm bg-blue-300" />
            <div className="w-3 h-3 rounded-sm bg-blue-400" />
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{totalQuestions} 题</span>
          <span>{totalXP} XP</span>
        </div>
      </div>
    </div>
  );
}

export default ReviewStreakCalendar;