import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Clock, Target, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChurnMetrics } from '@/hooks/useChurnMetrics';
import { useChurnSignals } from '@/hooks/useChurnSignals';
import { ChurnRiskGauge } from '@/components/ChurnRiskGauge';
import { ChurnTrendChart, type TrendDataPoint } from '@/components/ChurnTrendChart';
import { InterventionEffectiveness } from '@/components/InterventionEffectiveness';
import { storage } from '@/services/storage';

/**
 * Props for the ChurnWarningDashboard component.
 */
export interface ChurnWarningDashboardProps {
  /** Callback to navigate back */
  onBack?: () => void;
}

/**
 * Metric card component for summary display.
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
  delay?: number;
}

function MetricCard({ title, value, subtitle, icon, color, delay = 0 }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  const borderClasses = {
    blue: 'border-blue-200',
    green: 'border-green-200',
    orange: 'border-orange-200',
    purple: 'border-purple-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={`border ${borderClasses[color]}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <span className={`w-6 h-6 rounded flex items-center justify-center ${colorClasses[color]}`}>
              {icon}
            </span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Full-page churn warning dashboard with risk gauge, trend chart, and intervention effectiveness.
 * Integrates all three chart components from epic-058 iter-004 Task 1.
 */
export function ChurnWarningDashboard({ onBack }: ChurnWarningDashboardProps) {
  // Get metrics data from hook
  const { metrics, summary, trend, hasMetrics } = useChurnMetrics();

  // Get churn risk level from signals hook for the gauge
  const sessionHistory = useMemo(() => {
    return storage.getHistory();
  }, []);

  const { riskLevel } = useChurnSignals({
    history: sessionHistory,
    overdueCount: metrics.triggers.length > 0 ? 5 : 0, // Default for gauge display
    dailyGoalProgress: [],
    weeklyGoalProgress: [],
    lastReviewDate: null,
    currentStreak: 0,
  });

  // Convert trend data to the format expected by ChurnTrendChart
  const trendData: TrendDataPoint[] = useMemo(() => {
    return trend.map(t => ({
      date: t.date,
      count: t.count,
    }));
  }, [trend]);

  // Prepare effectiveness data for the bar chart
  const effectivenessData = useMemo(() => ({
    accepted: summary.acceptedCount,
    dismissed: summary.dismissedCount,
    snoozed: summary.snoozedCount,
  }), [summary]);

  // Calculate conversion rate percentage
  const conversionRate = useMemo(() => {
    return summary.totalTriggers > 0
      ? Math.round((summary.acceptedCount / summary.totalTriggers) * 100)
      : 0;
  }, [summary]);

  // Empty state when no data
  if (!hasMetrics) {
    return (
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold text-slate-800">流失预警数据看板</h1>
            </div>
          </div>
        </div>

        {/* Empty state card */}
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              暂无流失预警数据
            </h3>
            <p className="text-sm text-slate-500">
              当系统检测到流失风险并触发干预时，数据将自动记录在这里
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-bold text-slate-800">流失预警数据看板</h1>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="干预次数"
          value={summary.totalTriggers}
          subtitle="总触发数"
          icon={<Users className="w-4 h-4" />}
          color="blue"
          delay={0}
        />
        <MetricCard
          title="接受数"
          value={summary.acceptedCount}
          subtitle="用户响应"
          icon={<Target className="w-4 h-4" />}
          color="green"
          delay={0.05}
        />
        <MetricCard
          title="忽略数"
          value={summary.dismissedCount + summary.snoozedCount}
          subtitle="未响应"
          icon={<Clock className="w-4 h-4" />}
          color="orange"
          delay={0.1}
        />
        <MetricCard
          title="最近7天"
          value={summary.recentTriggers}
          subtitle="触发次数"
          icon={<TrendingUp className="w-4 h-4" />}
          color="purple"
          delay={0.15}
        />
      </div>

      {/* Churn Risk Gauge */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            当前流失风险等级
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ChurnRiskGauge riskLevel={riskLevel} size={240} delay={0.2} />
        </CardContent>
      </Card>

      {/* Churn Trend Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            30天干预触发趋势
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center overflow-x-auto">
          <ChurnTrendChart data={trendData} height={200} delay={0.3} />
        </CardContent>
      </Card>

      {/* Intervention Effectiveness */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            干预效果分解
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InterventionEffectiveness data={effectivenessData} delay={0.4} />
        </CardContent>
      </Card>

      {/* Conversion Rate Summary */}
      <Card className="border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            召回转化率
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-slate-800">
              {conversionRate}%
            </div>
            <div className="text-sm text-slate-500">
              {conversionRate >= 50 ? '(效果良好)' : '(待提升)'}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            转化率 = 接受数 ÷ 总触发数，50%以上表示召回效果良好
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChurnWarningDashboard;