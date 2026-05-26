import { useState } from 'react';
import { ChevronLeft, Clock, AlertTriangle, TrendingUp, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ForgettingCurveChart } from './ForgettingCurveChart';
import { useForgettingCurve } from '@/hooks/useForgettingCurve';
import type { ForgettingCurveData } from '@/hooks/useForgettingCurve';

/**
 * Props for the ForgettingCurvePanel component.
 */
export interface ForgettingCurvePanelProps {
  /** Callback when the user wants to go back */
  onBack: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * Tab types for the panel view.
 */
type TabType = 'overview' | 'overdue' | 'healthy';

/**
 * ForgettingCurvePanel displays the forgetting curve visualization
 * and review urgency list for the user's tracked mistakes.
 *
 * Features:
 * - Summary stats (total tracked, overdue count, average retention)
 * - Overview tab: All curves sorted by urgency
 * - Overdue tab: Items that need immediate review
 * - Healthy tab: Items with good retention
 * - Interactive chart for each item
 */
export function ForgettingCurvePanel({ onBack, className = '' }: ForgettingCurvePanelProps) {
  const { totalTracked, overdueCount, dueSoonCount, healthyCount, averageRetention, sortedByUrgency } = useForgettingCurve();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedItem, setSelectedItem] = useState<ForgettingCurveData | null>(null);

  // Filter items by tab
  const getFilteredItems = () => {
    switch (activeTab) {
      case 'overdue':
        return sortedByUrgency.filter((item) => item.isOverdue || item.daysUntilReview <= 0);
      case 'healthy':
        return sortedByUrgency.filter((item) => item.memoryRetentionScore >= 60);
      default:
        return sortedByUrgency;
    }
  };

  const filteredItems = getFilteredItems();

  // Format days for display
  const formatDaysUntilReview = (days: number, isOverdue: boolean) => {
    if (isOverdue) {
      const overdueDays = Math.abs(days);
      return overdueDays === 0 ? '今天到期' : `已逾期 ${overdueDays} 天`;
    }
    if (days === 0) return '今天到期';
    if (days === 1) return '明天到期';
    return `${days} 天后到期`;
  };

  // Get urgency badge style
  const getUrgencyBadge = (urgencyLevel: 1 | 2 | 3) => {
    switch (urgencyLevel) {
      case 3:
        return { label: '紧急', className: 'bg-red-100 text-red-700 border-red-200' };
      case 2:
        return { label: '即将到期', className: 'bg-amber-100 text-amber-700 border-amber-200' };
      default:
        return { label: '良好', className: 'bg-green-100 text-green-700 border-green-200' };
    }
  };

  // Empty state
  if (totalTracked === 0) {
    return (
      <div className={`min-h-screen bg-slate-50 ${className}`} data-testid="forgetting-curve-panel">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-600 hover:text-slate-800"
              data-testid="back-button"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <h1 className="text-lg font-semibold text-slate-800">遗忘曲线</h1>
            </div>
          </div>
        </header>

        {/* Empty State */}
        <main className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">暂无追踪数据</h2>
          <p className="text-slate-500 text-center max-w-md">
            开始练习并记录错题后，这里会显示您的遗忘曲线和复习提醒。
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 ${className}`} data-testid="forgetting-curve-panel">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-600 hover:text-slate-800"
            data-testid="back-button"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-semibold text-slate-800">遗忘曲线</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Stats */}
        <section
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          data-testid="summary-stats"
          aria-label="摘要统计"
        >
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-bold text-slate-800">{totalTracked}</div>
            <div className="text-xs text-slate-500 mt-1">追踪词条</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <div className="text-xs text-slate-500 mt-1">需要复习</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{dueSoonCount}</div>
            <div className="text-xs text-slate-500 mt-1">即将到期</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className={`text-2xl font-bold ${averageRetention >= 60 ? 'text-green-600' : averageRetention >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
              {averageRetention}%
            </div>
            <div className="text-xs text-slate-500 mt-1">平均保留率</div>
          </div>
        </section>

        {/* Tabs */}
        <section className="flex gap-2 border-b border-slate-200" data-testid="tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            data-testid="tab-overview"
          >
            全部 ({sortedByUrgency.length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'overdue'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            data-testid="tab-overdue"
          >
            <AlertTriangle className="w-4 h-4" />
            待复习 ({overdueCount})
          </button>
          <button
            onClick={() => setActiveTab('healthy')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'healthy'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            data-testid="tab-healthy"
          >
            记忆良好 ({healthyCount})
          </button>
        </section>

        {/* Selected Item Chart (if any) */}
        {selectedItem && (
          <section
            className="bg-white rounded-xl border border-slate-200 p-4"
            data-testid="selected-item-chart"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-slate-800">词条详情</h3>
                <p className="text-sm text-slate-500">{selectedItem.sentenceId}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                关闭
              </Button>
            </div>
            <ForgettingCurveChart data={selectedItem} width={320} height={200} />
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  {formatDaysUntilReview(selectedItem.daysUntilReview, selectedItem.isOverdue)}
                </span>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyBadge(selectedItem.urgencyLevel).className}`}>
                {getUrgencyBadge(selectedItem.urgencyLevel).label}
              </div>
            </div>
          </section>
        )}

        {/* Item List */}
        <section className="space-y-3" data-testid="item-list">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              {activeTab === 'overdue' ? '暂无需要复习的词条' : activeTab === 'healthy' ? '暂无记忆良好的词条' : '暂无数据'}
            </div>
          ) : (
            filteredItems.map((item) => {
              const badge = getUrgencyBadge(item.urgencyLevel);
              return (
                <div
                  key={item.sentenceId}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                  data-testid={`curve-item-${item.sentenceId}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedItem(item);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {item.sentenceId}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>复习 {item.intervalContext.reviewCount} 次</span>
                        <span>间隔 {item.intervalContext.currentInterval} 天</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${item.memoryRetentionScore >= 60 ? 'text-green-600' : item.memoryRetentionScore >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                        {item.memoryRetentionScore}%
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDaysUntilReview(item.daysUntilReview, item.isOverdue)}
                      </div>
                    </div>
                  </div>

                  {/* Mini chart */}
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <ForgettingCurveChart data={item} width={280} height={100} showLabels={false} />
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Info Section */}
        <section className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
            <Brain className="w-4 h-4" />
            关于遗忘曲线
          </h3>
          <p className="text-xs text-blue-600">
            遗忘曲线基于艾宾浩斯遗忘规律绘制。随着时间推移，记忆会逐渐衰减。
            及时复习可以有效巩固记忆，保持较高的保留率。建议在词条即将到期前进行复习。
          </p>
        </section>
      </main>
    </div>
  );
}

export default ForgettingCurvePanel;