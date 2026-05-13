import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Clock, Target, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getMetricsSummary } from '@/hooks/useChurnMetrics';
import { storage } from '@/services/storage';
import type { ChurnMetrics } from '@/data/types';

interface ChurnMetricsPanelProps {
  onBack?: () => void;
  /** If true, show back button and full panel */
  isFullView?: boolean;
}

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
            <span className={`w-6 h-6 rounded flex items-center justify-center ${colorClasses[color].split(' ').reverse().join(' ')}`}>
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

function ConversionRateCard({ rate, delay = 0 }: { rate: number; delay?: number }) {
  const percentage = Math.round(rate * 100);
  const isGood = percentage >= 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <span className="w-6 h-6 rounded flex items-center justify-center bg-green-50 text-green-600">
              <Target className="w-4 h-4" />
            </span>
            召回转化率
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <p className={`text-2xl font-bold ${isGood ? 'text-green-600' : 'text-slate-600'}`}>
              {percentage}%
            </p>
            <span className="text-xs text-slate-500 mb-1">
              ({isGood ? '良好' : '待提升'})
            </span>
          </div>
          <Progress
            value={percentage}
            className="mt-2 h-2"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ChurnMetricsPanelProps {
  onBack?: () => void;
  /** If true, show back button and full panel */
  isFullView?: boolean;
}

export function ChurnMetricsPanel({ onBack, isFullView = false }: ChurnMetricsPanelProps) {
  const [metrics] = useState<ChurnMetrics>(() => storage.getChurnMetrics());
  const summary = useMemo(() => getMetricsSummary(metrics), [metrics]);

  const hasMetrics = summary.totalTriggers > 0;

  if (isFullView && onBack) {
    return (
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <h1 className="text-xl font-bold text-slate-800">召回效果追踪</h1>
            </div>
          </div>
        </div>

        {hasMetrics ? (
          <>
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

            {/* Conversion Rate */}
            <ConversionRateCard rate={summary.conversionRate} delay={0.2} />

            {/* Additional stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    效果评估
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasMetrics ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">总触发:</span>
                        <span className="font-medium">{summary.totalTriggers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">接受率:</span>
                        <span className="font-medium text-green-600">
                          {summary.totalTriggers > 0
                            ? `${Math.round((summary.acceptedCount / summary.totalTriggers) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">忽略率:</span>
                        <span className="font-medium text-orange-600">
                          {summary.totalTriggers > 0
                            ? `${Math.round(((summary.dismissedCount + summary.snoozedCount) / summary.totalTriggers) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">暂无数据</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    趋势说明
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>转化率 = 接受数 ÷ 总触发数</p>
                    <p className="text-xs text-slate-500">
                      50% 以上表示召回效果良好
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">
                暂无召回数据
              </h3>
              <p className="text-sm text-slate-500">
                当系统检测到流失风险并触发干预时，数据将自动记录在这里
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Compact inline view for DataManager
  return (
    <Card className="border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          召回效果
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasMetrics ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">干预触发</span>
              <span className="font-medium">{summary.totalTriggers} 次</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">转化率</span>
              <span className={`font-medium ${summary.conversionRate >= 0.5 ? 'text-green-600' : 'text-slate-600'}`}>
                {Math.round(summary.conversionRate * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center">暂无数据</p>
        )}
      </CardContent>
    </Card>
  );
}

export default ChurnMetricsPanel;