import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LearningProfileCard } from './LearningProfileCard';
import { AbilityRadarMini } from './AbilityRadarMini';
import { LearningCalendarHeatmap } from './LearningCalendarHeatmap';
import { MilestoneTimeline } from './MilestoneTimeline';
import { PracticeRecommendationPanel } from './PracticeRecommendationPanel';
import { usePracticeRecommendations } from '@/hooks/usePracticeRecommendations';
import { storage } from '@/services/storage';
import type { Sentence } from '@/data/types';

/**
 * Props for the LearnProfilePanel component.
 */
export interface LearnProfilePanelProps {
  /** Callback when the user wants to go back */
  onBack: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * LearnProfilePanel is the main container that combines all learning profile sub-components.
 * Displays 5 sections:
 * 1. LearningProfileCard (4 stat cards) - Total days, questions, accuracy, streak
 * 2. PracticeRecommendationPanel - Smart practice recommendations (conditional)
 * 3. AbilityRadarMini (radar chart) - Visual ability breakdown by mode
 * 4. LearningCalendarHeatmap (heatmap) - GitHub-style activity heatmap
 * 5. MilestoneTimeline (milestones) - Learning achievement timeline
 */
export function LearnProfilePanel({ onBack, className = '' }: LearnProfilePanelProps) {
  // Get data for practice recommendations
  const mistakes = storage.getMistakes();
  const personalWords = storage.getPersonalWords();
  const personalSentences: Sentence[] = personalWords.map(w => ({
    id: w.word,
    english: w.exampleSentence,
    chinese: w.exampleSentenceCn,
    blanks: [{ word: w.word }],
    level: 'personal',
  }));

  // Get practice recommendations
  const { recommendations } = usePracticeRecommendations(mistakes, [], personalSentences);

  // Handlers for recommendation actions
  const handleStartPractice = (rec: typeof recommendations[0]) => {
    console.log('[PracticeRecommendation] Start practice:', rec);
    // TODO: Navigate to practice view with the recommended sentence/mode
    // For now, just log the action
  };

  const handleDismissRecommendation = (recId: string) => {
    console.log('[PracticeRecommendation] Dismissed:', recId);
    // TODO: Implement dismiss functionality (store dismissed IDs in localStorage)
  };

  const hasRecommendations = recommendations.length > 0;
  return (
    <div
      className={`min-h-screen bg-slate-50 ${className}`}
      data-testid="learn-profile-panel"
    >
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
          <div>
            <h1 className="text-lg font-semibold text-slate-800">学习画像</h1>
            <p className="text-xs text-slate-500 hidden sm:block">查看个人学习数据统计</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Section 1: LearningProfileCard - 4 stat cards */}
        <section
          className="space-y-3"
          data-testid="section-learning-stats"
          aria-labelledby="section-learning-stats-title"
        >
          <h2
            id="section-learning-stats-title"
            className="text-sm font-medium text-slate-500 uppercase tracking-wide"
          >
            学习概览
          </h2>
          <LearningProfileCard />
        </section>

        {/* Section 2: Practice Recommendations - shown conditionally when recommendations exist */}
        {hasRecommendations && (
          <section
            className="space-y-3"
            data-testid="section-practice-recommendations"
            aria-labelledby="section-practice-recommendations-title"
          >
            <h2
              id="section-practice-recommendations-title"
              className="text-sm font-medium text-slate-500 uppercase tracking-wide"
            >
              智能推荐
            </h2>
            <PracticeRecommendationPanel
              recommendations={recommendations}
              onStartPractice={handleStartPractice}
              onDismissRecommendation={handleDismissRecommendation}
            />
          </section>
        )}

        {/* Section 3: AbilityRadarMini - radar chart */}
        <section
          className="space-y-3"
          data-testid="section-ability-radar"
          aria-labelledby="section-ability-radar-title"
        >
          <h2
            id="section-ability-radar-title"
            className="text-sm font-medium text-slate-500 uppercase tracking-wide"
          >
            能力分布
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex flex-col items-center">
              <AbilityRadarMini size={160} />
              <p className="text-xs text-slate-400 mt-2">各模式正确率分布</p>
            </div>
          </div>
        </section>

        {/* Section 4: LearningCalendarHeatmap - heatmap */}
        <section
          className="space-y-3"
          data-testid="section-activity-heatmap"
          aria-labelledby="section-activity-heatmap-title"
        >
          <h2
            id="section-activity-heatmap-title"
            className="text-sm font-medium text-slate-500 uppercase tracking-wide"
          >
            活动热力图
          </h2>
          <LearningCalendarHeatmap weeks={12} />
        </section>

        {/* Section 5: MilestoneTimeline - milestones */}
        <section
          className="space-y-3"
          data-testid="section-milestones"
          aria-labelledby="section-milestones-title"
        >
          <h2
            id="section-milestones-title"
            className="text-sm font-medium text-slate-500 uppercase tracking-wide"
          >
            学习里程碑
          </h2>
          <MilestoneTimeline />
        </section>
      </main>
    </div>
  );
}

export default LearnProfilePanel;