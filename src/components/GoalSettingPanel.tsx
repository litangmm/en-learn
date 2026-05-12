import { useState, useCallback } from 'react';
import { ChevronLeft, Target, Zap, Flame, CalendarDays, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Goal, GoalType, GoalPeriod } from '@/data/types';
import {
  DAILY_QUESTION_PRESETS,
  DAILY_XP_PRESETS,
  DAILY_STREAK_PRESETS,
  WEEKLY_QUESTION_PRESETS,
  WEEKLY_XP_PRESETS,
} from '@/data/types';

interface GoalSettingPanelProps {
  goals: Goal[];
  onSave: (goals: Goal[]) => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Preset Options
// ---------------------------------------------------------------------------

const DAILY_QUESTION_OPTIONS = DAILY_QUESTION_PRESETS.map((v) => ({
  value: v,
  label: `${v} 题`,
}));

const DAILY_XP_OPTIONS = DAILY_XP_PRESETS.map((v) => ({
  value: v,
  label: `${v} XP`,
}));

const DAILY_STREAK_OPTIONS = DAILY_STREAK_PRESETS.map((v) => ({
  value: v,
  label: `${v} 天`,
}));

const WEEKLY_QUESTION_OPTIONS = WEEKLY_QUESTION_PRESETS.map((v) => ({
  value: v,
  label: `${v} 题`,
}));

const WEEKLY_XP_OPTIONS = WEEKLY_XP_PRESETS.map((v) => ({
  value: v,
  label: `${v} XP`,
}));

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

interface PresetSelectorProps {
  options: { value: number; label: string }[];
  selected: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function PresetSelector({ options, selected, onChange, disabled = false }: PresetSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${selected === opt.value
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface GoalRowProps {
  icon: React.ReactNode;
  label: string;
  type: GoalType;
  period: GoalPeriod;
  currentTarget: number;
  onTargetChange: (newTarget: number) => void;
  presets: { value: number; label: string }[];
  isCompleted: boolean;
}

function GoalRow({
  icon,
  label,
  currentTarget,
  onTargetChange,
  presets,
  isCompleted,
}: GoalRowProps) {
  const [customValue, setCustomValue] = useState<string>('');
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetSelect = (value: number) => {
    setShowCustom(false);
    setCustomValue('');
    onTargetChange(value);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
  };

  const handleCustomBlur = () => {
    const parsed = parseInt(customValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onTargetChange(parsed);
    }
    setShowCustom(false);
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const isCustomSelected = !presets.some((p) => p.value === currentTarget);

  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-500">{icon}</span>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {isCompleted && (
          <Badge variant="secondary" className="text-xs ml-auto">
            已完成
          </Badge>
        )}
      </div>

      <PresetSelector
        options={presets}
        selected={isCustomSelected ? -1 : currentTarget}
        onChange={handlePresetSelect}
      />

      {/* Custom input toggle */}
      <button
        type="button"
        onClick={() => setShowCustom((prev) => !prev)}
        className="mt-2 text-xs text-blue-500 hover:text-blue-600"
      >
        {showCustom ? '收起自定义' : '自定义目标'}
      </button>

      {showCustom && (
        <div className="mt-2">
          <input
            type="number"
            value={customValue}
            onChange={handleCustomChange}
            onBlur={handleCustomBlur}
            onKeyDown={handleCustomKeyDown}
            placeholder={`当前: ${currentTarget}`}
            min="1"
            max="9999"
            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function GoalSettingPanel({ goals, onSave, onBack }: GoalSettingPanelProps) {
  // Local editable state initialized from props
  const [editedGoals, setEditedGoals] = useState<Goal[]>(() => [...goals]);

  const handleTargetChange = useCallback((goalId: string, newTarget: number) => {
    setEditedGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, target: newTarget } : g))
    );
  }, []);

  const handleSave = useCallback(() => {
    const now = Date.now();
    const updated = editedGoals.map((g) => ({ ...g, updatedAt: now }));
    onSave(updated);
  }, [editedGoals, onSave]);

  // Separate goals by period
  const dailyGoals = editedGoals.filter((g) => g.period === 'daily');
  const weeklyGoals = editedGoals.filter((g) => g.period === 'weekly');

  // Find goals by type within each period
  const dailyQuestionsGoal = dailyGoals.find((g) => g.type === 'questions');
  const dailyXPGoal = dailyGoals.find((g) => g.type === 'xp');
  const dailyStreakGoal = dailyGoals.find((g) => g.type === 'streak');

  // Weekly goals
  const weeklyQuestionsGoal = weeklyGoals.find((g) => g.type === 'questions');
  const weeklyXPGoal = weeklyGoals.find((g) => g.type === 'xp');

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800">学习目标</h1>
          </div>
        </div>
        <Button
          onClick={handleSave}
          className="gap-1.5 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Save className="w-4 h-4" />
          保存
        </Button>
      </div>

      <div className="space-y-6">
        {/* Daily Goals Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-slate-700">每日目标</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dailyQuestionsGoal && (
              <GoalRow
                icon={<Target className="w-4 h-4" />}
                label="答题目标"
                type="questions"
                period="daily"
                currentTarget={dailyQuestionsGoal.target}
                onTargetChange={(v) => handleTargetChange(dailyQuestionsGoal.id, v)}
                presets={DAILY_QUESTION_OPTIONS}
                isCompleted={dailyQuestionsGoal.completed}
              />
            )}
            {dailyXPGoal && (
              <GoalRow
                icon={<Zap className="w-4 h-4" />}
                label="XP 目标"
                type="xp"
                period="daily"
                currentTarget={dailyXPGoal.target}
                onTargetChange={(v) => handleTargetChange(dailyXPGoal.id, v)}
                presets={DAILY_XP_OPTIONS}
                isCompleted={dailyXPGoal.completed}
              />
            )}
            {dailyStreakGoal && (
              <GoalRow
                icon={<Flame className="w-4 h-4" />}
                label="连续学习"
                type="streak"
                period="daily"
                currentTarget={dailyStreakGoal.target}
                onTargetChange={(v) => handleTargetChange(dailyStreakGoal.id, v)}
                presets={DAILY_STREAK_OPTIONS}
                isCompleted={dailyStreakGoal.completed}
              />
            )}
          </div>
        </section>

        {/* Weekly Goals Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-purple-500" />
            <h2 className="text-base font-semibold text-slate-700">每周目标</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {weeklyQuestionsGoal && (
              <GoalRow
                icon={<Target className="w-4 h-4" />}
                label="答题目标"
                type="questions"
                period="weekly"
                currentTarget={weeklyQuestionsGoal.target}
                onTargetChange={(v) => handleTargetChange(weeklyQuestionsGoal.id, v)}
                presets={WEEKLY_QUESTION_OPTIONS}
                isCompleted={weeklyQuestionsGoal.completed}
              />
            )}
            {weeklyXPGoal && (
              <GoalRow
                icon={<Zap className="w-4 h-4" />}
                label="XP 目标"
                type="xp"
                period="weekly"
                currentTarget={weeklyXPGoal.target}
                onTargetChange={(v) => handleTargetChange(weeklyXPGoal.id, v)}
                presets={WEEKLY_XP_OPTIONS}
                isCompleted={weeklyXPGoal.completed}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
