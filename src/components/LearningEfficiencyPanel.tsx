import { Brain, TrendingUp, Target, Award, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearningEfficiency } from '@/hooks/useLearningEfficiency';

interface LearningEfficiencyPanelProps {
  onBack: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '一般';
  return '需加强';
}

export function LearningEfficiencyPanel({ onBack }: LearningEfficiencyPanelProps) {
  const metrics = useLearningEfficiency();

  const cards = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: '记忆保持率',
      value: metrics.memoryRetentionRate,
      subtitle: `${metrics.totalCorrectOnReview}/${metrics.totalReviewed} 次复习正确`,
      description: '复习时答对的比例',
      color: 'blue' as const,
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: '遗忘曲线拟合',
      value: metrics.forgettingCurveFit,
      subtitle: '间隔递增趋势',
      description: '复习间隔是否持续延长',
      color: 'green' as const,
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: '薄弱点攻克',
      value: metrics.weaknessProgress,
      subtitle: `${metrics.improvedMistakes}/${metrics.totalMistakes} 个改善`,
      description: '薄弱句子的进步趋势',
      color: 'purple' as const,
    },
  ];

  const overallScore = Math.round(
    (metrics.memoryRetentionRate + metrics.forgettingCurveFit + metrics.weaknessProgress) / 3
  );

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-4" data-testid="learning-efficiency-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500" data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            <h1 className="text-xl font-bold text-slate-800">学习效率</h1>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className={`mb-6 p-6 bg-gradient-to-br ${
        overallScore >= 80 ? 'from-green-500 to-green-600' :
        overallScore >= 60 ? 'from-blue-500 to-blue-600' :
        overallScore >= 40 ? 'from-orange-500 to-orange-600' :
        'from-red-500 to-red-600'
      } rounded-xl text-white text-center`}>
        <p className="text-sm text-white/80 mb-1">综合效率评分</p>
        <p className="text-5xl font-bold">{overallScore}</p>
        <p className={`text-lg mt-1 ${overallScore >= 60 ? 'text-white' : 'text-white/90'}`}>
          {getScoreLabel(overallScore)}
        </p>
        <p className="text-xs text-white/70 mt-2">
          基于 {metrics.totalReviewed} 次复习数据
        </p>
      </div>

      {/* Metric Cards */}
      <div className="space-y-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                card.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                card.color === 'green' ? 'bg-green-100 text-green-600' :
                card.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {card.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-slate-700">{card.title}</span>
                  <span className={`text-2xl font-bold ${getScoreColor(card.value)}`}>
                    {card.value}
                  </span>
                  <span className="text-sm text-slate-400">分</span>
                </div>
                <p className="text-xs text-slate-500">{card.subtitle}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  card.color === 'blue' ? 'bg-blue-500' :
                  card.color === 'green' ? 'bg-green-500' :
                  card.color === 'purple' ? 'bg-purple-500' :
                  'bg-slate-500'
                }`}
                style={{ width: `${card.value}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Empty State Hint */}
      {metrics.totalReviewed === 0 && (
        <div className="mt-6 text-center py-8">
          <p className="text-sm text-slate-400">
            开始复习后，这里会显示你的学习效率数据
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl">
        <h3 className="text-sm font-medium text-slate-700 mb-2">如何提高效率</h3>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>按时复习到期题目，不要积压</li>
          <li>薄弱点要多次练习直到完全掌握</li>
          <li>保持稳定的复习节奏比突击更有效</li>
        </ul>
      </div>
    </div>
  );
}

export default LearningEfficiencyPanel;