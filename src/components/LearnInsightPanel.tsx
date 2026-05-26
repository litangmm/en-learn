import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Target,
  Trophy,
  Zap,
  Clock,
  Lightbulb,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AbilityRadar } from '@/components/AbilityRadar';
import { useLearnInsights } from '@/hooks/useLearnInsights';
import { useProgressStats } from '@/hooks/useProgressStats';
import type { View } from './routing';
import type { HealthScoreLevel, WeaknessPattern, InsightItem } from '@/data/types';

/**
 * Props for the LearnInsightPanel component.
 */
export interface LearnInsightPanelProps {
  onBack?: () => void;
  onNavigate?: (_view: View) => void;
}

/**
 * Health score circular gauge component.
 */
function HealthGauge({ score, level, color, size = 180 }: {
  score: number;
  level: HealthScoreLevel;
  color: string;
  size?: number;
}) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const levelLabels: Record<HealthScoreLevel, string> = {
    critical: '需要关注',
    low: '待提升',
    medium: '良好',
    high: '优秀',
  };

  return (
    <div className="relative inline-flex items-center justify-center" data-testid="health-gauge">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-slate-500 mt-1">{levelLabels[level]}</span>
      </div>
    </div>
  );
}

/**
 * Stat card component for displaying key metrics.
 */
function StatCard({ icon, label, value, trend }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-slate-800">{value}</p>
          {trend && <TrendIcon className={`w-4 h-4 ${trendColor}`} />}
        </div>
      </div>
    </div>
  );
}

/**
 * Weakness pattern card component.
 */
function WeaknessCard({ pattern, delay = 0 }: {
  pattern: WeaknessPattern;
  delay?: number;
}) {
  const severityColors = {
    1: 'border-l-yellow-400 bg-yellow-50/50',
    2: 'border-l-orange-400 bg-orange-50/50',
    3: 'border-l-red-400 bg-red-50/50',
  };

  const severityLabels = { 1: '轻度', 2: '中度', 3: '严重' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`p-3 rounded-lg border-l-4 ${severityColors[pattern.severity]} border border-slate-200`}
      data-testid="weakness-card"
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
      <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
        <Lightbulb className="w-3 h-3" />
        {pattern.suggestedAction}
      </p>
    </motion.div>
  );
}

/**
 * Insight item card component.
 */
function InsightCard({ insight, delay = 0 }: {
  insight: InsightItem;
  delay?: number;
}) {
  const sectionIcons: Record<string, React.ReactNode> = {
    health: <Activity className="w-4 h-4" />,
    ability: <Target className="w-4 h-4" />,
    weakness: <AlertTriangle className="w-4 h-4" />,
    recommendation: <Lightbulb className="w-4 h-4" />,
  };

  const sectionColors: Record<string, string> = {
    health: 'text-green-600 bg-green-50',
    ability: 'text-blue-600 bg-blue-50',
    weakness: 'text-orange-600 bg-orange-50',
    recommendation: 'text-purple-600 bg-purple-50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200"
      data-testid="insight-card"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${sectionColors[insight.section]}`}>
        {sectionIcons[insight.section]}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-slate-800">{insight.title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{insight.description}</p>
        {insight.value !== undefined && insight.unit && (
          <p className="text-lg font-bold text-slate-800 mt-1">
            {insight.value}{insight.unit}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Learn Insight Panel - Comprehensive learning insights dashboard.
 *
 * Displays:
 * - Health score with circular gauge
 * - Key statistics (XP, streak, accuracy)
 * - Ability radar chart
 * - Weakness patterns
 * - Personalized recommendations
 */
export function LearnInsightPanel({ onBack, onNavigate }: LearnInsightPanelProps) {
  const insights = useLearnInsights();
  const progressStats = useProgressStats();

  // Determine if user is new (no data yet)
  const isNewUser = progressStats.totalQuestions === 0;

  if (isNewUser) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-4" data-testid="learn-insight-panel">
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
            <Zap className="w-12 h-12 mx-auto text-slate-300 mb-4" />
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
    <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-4" data-testid="learn-insight-panel">
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
            <p className="text-sm text-slate-500 mt-4 text-center">
              综合评估你的学习状态、目标完成度和流失风险
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="累计 XP"
            value={insights.xpProfile.totalXP.toLocaleString()}
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="当前等级"
            value={`Lv.${insights.xpProfile.currentLevel}`}
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="正确率"
            value={`${insights.accuracy.total}%`}
            trend={insights.accuracy.trend}
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="学习天数"
            value={progressStats.learningDays}
          />
        </div>
      </motion.div>

      {/* Goal Progress */}
      {(insights.goalCompletion.dailyTotal > 0 || insights.goalCompletion.weeklyTotal > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">今日目标</span>
                      <span className="font-medium">
                        {insights.goalCompletion.dailyCompleted}/{insights.goalCompletion.dailyTotal}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${(insights.goalCompletion.dailyCompleted / insights.goalCompletion.dailyTotal) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}
                {insights.goalCompletion.weeklyTotal > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">本周目标</span>
                      <span className="font-medium">
                        {insights.goalCompletion.weeklyCompleted}/{insights.goalCompletion.weeklyTotal}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{
                          width: `${(insights.goalCompletion.weeklyCompleted / insights.goalCompletion.weeklyTotal) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Ability Radar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              能力雷达
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AbilityRadar data={progressStats.modeAccuracy} size={200} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Weakness Patterns Section */}
      {insights.weaknessPatterns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                薄弱点分析
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.weaknessPatterns.slice(0, 3).map((pattern, index) => (
                <WeaknessCard key={pattern.id} pattern={pattern} delay={0.3 + index * 0.05} />
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

      {/* Insights Section */}
      {insights.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-purple-500" />
                个性化建议
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.insights.slice(0, 4).map((insight, index) => (
                <InsightCard key={insight.id} insight={insight} delay={0.35 + index * 0.05} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Churn Risk Alert */}
      {insights.churnRisk.isAtRisk && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6"
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-orange-800">流失风险提醒</h4>
                <p className="text-xs text-orange-600 mt-0.5">
                  {insights.churnRisk.level === 'critical'
                    ? '检测到严重的流失风险，请尽快开始练习'
                    : '建议保持学习习惯，避免中断 streak'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Flow State Alert */}
      {insights.flowState.recommendedBreak && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800">建议休息一下</h4>
                <p className="text-xs text-blue-600 mt-0.5">
                  当前可能有些疲劳，适当休息后再继续效果更好
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default LearnInsightPanel;
