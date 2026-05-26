import { Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PracticeRecommendationCard } from './PracticeRecommendationCard';
import type { PracticeRecommendation } from '@/data/types';

/**
 * Props for PracticeRecommendationPanel component.
 */
export interface PracticeRecommendationPanelProps {
  /** Array of recommendations to display */
  recommendations: PracticeRecommendation[];
  /** Callback when user clicks start practice button */
  onStartPractice: (_recommendation: PracticeRecommendation) => void;
  /** Callback when user dismisses a recommendation */
  onDismissRecommendation: (_id: string) => void;
}

/**
 * Practice Recommendation Panel component.
 * Displays a list of personalized practice recommendations.
 * Includes a header, list of recommendation cards, and a start practice button.
 */
export function PracticeRecommendationPanel({
  recommendations,
  onStartPractice,
  onDismissRecommendation,
}: PracticeRecommendationPanelProps) {
  const hasRecommendations = recommendations.length > 0;

  // Handle dismiss from card - pass through to parent
  const handleDismiss = (recId: string) => {
    onDismissRecommendation(recId);
  };

  // Handle start practice from card
  const handleStartPractice = (rec: PracticeRecommendation) => {
    onStartPractice(rec);
  };

  // Handle main start practice button
  const handleMainStartPractice = () => {
    // If there are recommendations, start with the first one
    if (recommendations.length > 0) {
      onStartPractice(recommendations[0]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          智能推荐
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Empty state */}
        {!hasRecommendations && (
          <div className="text-center py-6 text-slate-500">
            <p className="text-sm">暂时没有推荐内容</p>
            <p className="text-xs mt-1">完成更多练习后将为您生成个性化推荐</p>
          </div>
        )}

        {/* Recommendation cards */}
        {hasRecommendations && (
          <>
            <div className="space-y-3">
              {recommendations.map((recommendation) => (
                <PracticeRecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onDismiss={handleDismiss}
                  onStartPractice={handleStartPractice}
                />
              ))}
            </div>

            {/* Start practice button */}
            <Button
              onClick={handleMainStartPractice}
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Sparkles className="w-4 h-4" />
              开始练习
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PracticeRecommendationPanel;