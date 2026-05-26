import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Share2,
  Activity,
  Trophy,
  Target,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  CheckCircle2,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LearningReport } from '@/data/types';
import { useLearningReport } from '@/hooks/useLearningReport';
import { generateBadgeImage, downloadBadgeBlob } from '@/hooks/useBadgeExport';

const ICON_MAP: Record<string, LucideIcon> = {
  Star,
  Trophy,
  CheckCircle2,
  Target,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Lightbulb,
};

interface LearningReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onShare?: (_report: LearningReport) => void;
  onExport?: (_ref: HTMLElement | null) => void;
  isExporting?: boolean;
  // Internal export functionality (uses onExport callback if provided)
  enableInternalExport?: boolean;
}

/**
 * Health score circular gauge component for the report.
 */
function ReportHealthGauge({ score, level, label }: {
  score: number;
  level: string;
  label: string;
}) {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const colorMap: Record<string, string> = {
    high: '#22c55e',
    medium: '#f59e0b',
    low: '#f97316',
    critical: '#ef4444',
  };
  const color = colorMap[level] || '#f59e0b';

  return (
    <div className="relative inline-flex items-center justify-center" data-testid="report-health-gauge">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
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
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
    </div>
  );
}

/**
 * Achievement badge component for the report.
 */
function AchievementBadge({ id, title, icon }: {
  id: string;
  title: string;
  icon: string;
}) {
  const Icon = ICON_MAP[icon] || Star;

  return (
    <div
      className="flex flex-col items-center text-center p-2 rounded-lg bg-amber-50/50 border border-amber-200"
      data-testid={`achievement-badge-${id}`}
    >
      <div className="text-amber-500 mb-1">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-slate-700">{title}</span>
    </div>
  );
}

/**
 * LearningReportPanel - Displays the learning health report with export and share functionality.
 *
 * Features:
 * - Health score gauge display
 * - Key metrics summary (XP, accuracy, streak)
 * - Weak mode recommendation
 * - Recent achievements display
 * - Personalized insights
 * - Export to image functionality
 * - Share functionality
 */
export function LearningReportPanel({
  isOpen,
  onClose,
  onShare,
  onExport,
  isExporting = false,
  enableInternalExport = false,
}: LearningReportPanelProps) {
  const report = useLearningReport();
  const panelRef = useRef<HTMLDivElement>(null);
  const [internalExporting, setInternalExporting] = useState(false);

  const handleExport = async () => {
    if (onExport) {
      onExport(panelRef.current);
    } else if (enableInternalExport && panelRef.current) {
      setInternalExporting(true);
      try {
        const blob = await generateBadgeImage(panelRef.current);
        downloadBadgeBlob(blob, `en-learn-report-${report.period.endDate}.png`);
      } finally {
        setInternalExporting(false);
      }
    }
  };

  const isCurrentlyExporting = isExporting || internalExporting;

  const handleShare = () => {
    onShare?.(report);
  };

  const trendIcon = report.accuracy.trend === 'up'
    ? <TrendingUp className="w-4 h-4 text-green-500" />
    : report.accuracy.trend === 'down'
      ? <TrendingDown className="w-4 h-4 text-red-500" />
      : <Minus className="w-4 h-4 text-slate-400" />;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          data-testid="learning-report-panel-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            data-testid="learning-report-panel-content"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="text-blue-500" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">学习健康报告</h2>
                  <p className="text-xs text-slate-500">{report.periodLabel}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                data-testid="report-close-button"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Report Card for Export */}
              <div
                ref={panelRef}
                className="bg-white rounded-xl border border-slate-200 p-6"
                data-testid="learning-report-card"
              >
                {/* Brand Header */}
                <div className="flex items-center justify-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <Activity className="text-blue-500" size={20} />
                  <span className="text-lg font-semibold text-slate-800">学习健康报告</span>
                  <div className="ml-auto px-2 py-1 bg-blue-100 rounded-full">
                    <span className="text-xs font-medium text-blue-700">
                      {report.period.startDate} ~ {report.period.endDate}
                    </span>
                  </div>
                </div>

                {/* Health Score Section */}
                <div className="flex flex-col items-center mb-6">
                  <ReportHealthGauge
                    score={report.healthScore.score}
                    level={report.healthScore.level}
                    label={report.healthScore.label}
                  />
                  <p className="text-sm text-slate-500 mt-3 text-center">
                    学习状态{report.healthScore.label}，继续保持！
                  </p>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-xs text-slate-500">累计 XP</p>
                      <p className="text-lg font-semibold text-slate-800">
                        {report.xp.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Target className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-500">正确率</p>
                      <div className="flex items-center gap-1">
                        <p className="text-lg font-semibold text-slate-800">
                          {report.accuracy.total}%
                        </p>
                        {trendIcon}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-slate-500">当前连续</p>
                      <p className="text-lg font-semibold text-slate-800">
                        {report.streak.current} 天
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Activity className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-slate-500">本周 XP</p>
                      <p className="text-lg font-semibold text-slate-800">
                        +{report.xp.weeklyGained}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Weak Mode Recommendation */}
                {report.weakModeRecommendation && (
                  <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h3 className="text-sm font-medium text-red-700 mb-2">
                      ⚠️ 薄弱环节：{report.weakModeRecommendation.mode === 'fill-in-blanks' ? '填空' : report.weakModeRecommendation.mode === 'dictation' ? '听写' : report.weakModeRecommendation.mode === 'multiple-choice' ? '选择' : '排序'}
                    </h3>
                    <p className="text-sm text-red-600">
                      正确率 {report.weakModeRecommendation.accuracy}%
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      {report.weakModeRecommendation.suggestion}
                    </p>
                  </div>
                )}

                {/* Achievements */}
                {report.achievements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">🏆 近期成就</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {report.achievements.map((achievement) => (
                        <AchievementBadge
                          key={achievement.id}
                          id={achievement.id}
                          title={achievement.title}
                          icon={achievement.icon}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Actions */}
                {report.nextActions.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">💡 行动建议</h3>
                    <ul className="space-y-1">
                      {report.nextActions.map((action, index) => (
                        <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-blue-500">{index + 1}.</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400">持续学习，成为更好的自己</p>
                </div>
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
                data-testid="report-share-button"
              >
                <Share2 className="w-4 h-4" />
                分享
              </Button>
              <Button
                onClick={handleExport}
                disabled={isCurrentlyExporting}
                className="flex items-center gap-2"
                data-testid="report-export-button"
              >
                <Download className="w-4 h-4" />
                {isCurrentlyExporting ? '导出中...' : '下载图片'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LearningReportPanel;