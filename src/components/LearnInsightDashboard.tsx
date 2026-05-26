import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Target,
  TrendingUp,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthGauge } from '@/components/HealthGauge';
import { AbilityRadar } from '@/components/AbilityRadar';
import { ProgressTrend } from '@/components/ProgressTrend';
import { useLearnInsights } from '@/hooks/useLearnInsights';
import { useProgressStats, getDailyXP, getFilteredTrend, MODE_LABELS } from '@/hooks/useProgressStats';
import type { View } from './routing';
import type { PracticeMode, DailyTrend } from '@/data/types';

/**
 * Props for the LearnInsightDashboard component.
 */
export interface LearnInsightDashboardProps {
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Callback for navigation to other views */
  onNavigate?: (_view: View) => void;
}

/**
 * LearnInsightDashboard - A unified dashboard layout for learning insights.
 *
 * Displays:
 * - Health score gauge (circular progress)
 * - Ability radar chart (mode accuracy)
 * - Progress trend line chart (daily XP/questions)
 *
 * Uses a card-based layout with responsive design.
 */
export function LearnInsightDashboard({ onBack, onNavigate }: LearnInsightDashboardProps) {
  const insights = useLearnInsights();
  const progressStats = useProgressStats();

  // Track selected mode from radar for trend filtering
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);

  // Get trend data - filtered by selected mode or all modes
  const trendData = useMemo(() => {
    if (selectedMode) {
      return getFilteredTrend([selectedMode], 7);
    }
    return getDailyXP(7);
  }, [selectedMode]);

  // Convert filtered trend to daily trend format for ProgressTrend
  const dailyTrendData = useMemo((): DailyTrend[] => {
    return trendData.map((d) => ({
      date: d.date,
      dayName: d.dayName,
      xp: d.xp,
      questions: d.questions,
      accuracy: d.accuracy,
      modesPracticed: d.modesPracticed,
    }));
  }, [trendData]);

  // Determine if user is new (no data yet)
  const isNewUser = progressStats.totalQuestions === 0;

  if (isNewUser) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-4" data-testid="learn-insight-dashboard">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800">学习洞察</h1>
          </div>
        </div>

        {/* Empty state */}
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              开始你的学习之旅
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              完成一些练习后，这里将展示你的学习洞察和个性化建议
            </p>
            {onNavigate && (
              <Button onClick={() => onNavigate('progress')} className="mt-2">
                查看学习进度
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-4" data-testid="learn-insight-dashboard">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold text-slate-800">学习洞察</h1>
        </div>
        {onNavigate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('progress')}
            className="ml-auto text-blue-600"
          >
            详细数据
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Health Score Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="mb-6"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              学习健康指数
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-4">
            <HealthGauge
              score={insights.healthScore.score}
              level={insights.healthScore.level}
              color={insights.healthScore.color}
              size={180}
            />
            <p className="text-sm text-slate-500 mt-4 text-center max-w-xs">
              综合评估你的学习状态、目标完成度和流失风险
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatItem
          label="累计 XP"
          value={insights.xpProfile.totalXP.toLocaleString()}
        />
        <StatItem
          label="当前等级"
          value={`Lv.${insights.xpProfile.currentLevel}`}
        />
        <StatItem
          label="正确率"
          value={`${insights.accuracy.total}%`}
          trend={insights.accuracy.trend}
        />
        <StatItem
          label="学习天数"
          value={progressStats.learningDays}
        />
      </motion.div>

      {/* Two Column Layout for Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Ability Radar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                能力雷达
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center flex-1 min-h-[280px]">
              <AbilityRadar
                data={progressStats.modeAccuracy}
                size={220}
                onModeSelect={setSelectedMode}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Trend Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                学习趋势
                {/* Mode filter indicator */}
                {selectedMode && (
                  <span className="ml-auto flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {MODE_LABELS[selectedMode]}
                    <button
                      onClick={() => setSelectedMode(null)}
                      className="ml-1 hover:text-blue-900"
                      aria-label="清除筛选"
                    >
                      ×
                    </button>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center flex-1 min-h-[280px]">
              <ProgressTrend
                data={dailyTrendData}
                days={7}
                height={220}
                onDayClick={(date) => {
                  // Reserved for future day detail view
                  void date;
                }}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Goal Progress Section */}
      {(insights.goalCompletion.dailyTotal > 0 || insights.goalCompletion.weeklyTotal > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                目标进度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.goalCompletion.dailyTotal > 0 && (
                  <GoalProgressBar
                    label="今日目标"
                    current={insights.goalCompletion.dailyCompleted}
                    total={insights.goalCompletion.dailyTotal}
                    color="bg-blue-500"
                  />
                )}
                {insights.goalCompletion.weeklyTotal > 0 && (
                  <GoalProgressBar
                    label="本周目标"
                    current={insights.goalCompletion.weeklyCompleted}
                    total={insights.goalCompletion.weeklyTotal}
                    color="bg-green-500"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weakness Patterns Section */}
      {insights.weaknessPatterns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <span className="w-4 h-4 text-orange-500">⚠️</span>
                薄弱点分析
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.weaknessPatterns.slice(0, 3).map((pattern) => (
                <WeaknessItem key={pattern.id} pattern={pattern} />
              ))}
              {insights.weaknessPatterns.length > 3 && (
                <p className="text-xs text-slate-500 text-center">
                  还有 {insights.weaknessPatterns.length - 3} 个薄弱点
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Stat item component for displaying a single metric.
 */
function StatItem({
  label,
  value,
  trend
}: {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : null;

  return (
    <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-1">
        <p className="text-lg font-semibold text-slate-800">{value}</p>
        {TrendIcon && (
          <TrendIcon className="w-4 h-4 text-green-500" />
        )}
      </div>
    </div>
  );
}

/**
 * Goal progress bar component.
 */
function GoalProgressBar({
  label,
  current,
  total,
  color,
}: {
  label: string;
  current: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">
          {current}/{total}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Weakness item component for displaying a single weakness pattern.
 */
function WeaknessItem({ pattern }: { pattern: {
  id: string;
  title: string;
  description: string;
  severity: 1 | 2 | 3;
  suggestedAction: string;
}}) {
  const severityColors = {
    1: 'border-l-yellow-400 bg-yellow-50/50',
    2: 'border-l-orange-400 bg-orange-50/50',
    3: 'border-l-red-400 bg-red-50/50',
  };

  const severityLabels = { 1: '轻度', 2: '中度', 3: '严重' };

  return (
    <div
      className={`p-3 rounded-lg border-l-4 ${severityColors[pattern.severity]} border border-slate-200`}
      data-testid="weakness-item"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium text-slate-800">{pattern.title}</h4>
          <p className="text-xs text-slate-500 mt-1">{pattern.description}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${
          pattern.severity === 3 ? 'bg-red-100 text-red-700' :
          pattern.severity === 2 ? 'bg-orange-100 text-orange-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {severityLabels[pattern.severity]}
        </span>
      </div>
      <p className="text-xs text-blue-600 mt-2">💡 {pattern.suggestedAction}</p>
    </div>
  );
}

export default LearnInsightDashboard;