import { X, AlertCircle, Clock, BookOpen, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PracticeRecommendation, RecommendationType } from '@/data/types';

/**
 * Props for PracticeRecommendationCard component.
 */
export interface PracticeRecommendationCardProps {
  /** The recommendation data to display */
  recommendation: PracticeRecommendation;
  /** Callback when user dismisses this recommendation */
  onDismiss: (_id: string) => void;
  /** Callback when user clicks start practice button */
  onStartPractice: (_recommendation: PracticeRecommendation) => void;
}

/**
 * Mapping of recommendation types to icons.
 */
const RECOMMENDATION_ICONS: Record<RecommendationType, React.ElementType> = {
  'high-error': AlertCircle,
  'low-accuracy': AlertCircle,
  'neglected-review': Clock,
  'new-word': BookOpen,
  'mode-weak': Target,
};

/**
 * Mapping of recommendation types to colors.
 */
const RECOMMENDATION_COLORS: Record<RecommendationType, { bg: string; icon: string; badge: string }> = {
  'high-error': { bg: 'bg-red-50', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' },
  'low-accuracy': { bg: 'bg-orange-50', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' },
  'neglected-review': { bg: 'bg-blue-50', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  'new-word': { bg: 'bg-green-50', icon: 'text-green-500', badge: 'bg-green-100 text-green-700' },
  'mode-weak': { bg: 'bg-purple-50', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-700' },
};

/**
 * Mapping of recommendation types to display titles.
 */
const RECOMMENDATION_TITLES: Record<RecommendationType, string> = {
  'high-error': '高频错误',
  'low-accuracy': '正确率低',
  'neglected-review': '久未复习',
  'new-word': '新单词',
  'mode-weak': '题型薄弱',
};

/**
 * A card component displaying a single practice recommendation.
 * Shows an icon, title, reason text, and action button.
 * Supports dismissing the recommendation.
 */
export function PracticeRecommendationCard({
  recommendation,
  onDismiss,
  onStartPractice,
}: PracticeRecommendationCardProps) {
  const { type, reason, action } = recommendation;
  const Icon = RECOMMENDATION_ICONS[type];
  const colors = RECOMMENDATION_COLORS[type];
  const title = RECOMMENDATION_TITLES[type];

  const handleDismiss = () => {
    onDismiss(recommendation.id);
  };

  const handleStartPractice = () => {
    onStartPractice(recommendation);
  };

  return (
    <div className={`p-4 rounded-lg border border-slate-200 ${colors.bg}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.badge}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with title and dismiss button */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
              {title}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDismiss}
              className="shrink-0 hover:bg-slate-200/50"
              aria-label="关闭"
            >
              <X className="w-4 h-4 text-slate-400" />
            </Button>
          </div>

          {/* Reason text */}
          <p className="text-sm text-slate-700 mb-3 line-clamp-2">{reason}</p>

          {/* Action button */}
          <Button
            onClick={handleStartPractice}
            size="sm"
            className="w-full gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {action}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PracticeRecommendationCard;