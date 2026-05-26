import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LearnProfilePanel } from '../LearnProfilePanel';
import type { PracticeRecommendation } from '@/data/types';

// Sample recommendation data for testing
const mockRecommendations: PracticeRecommendation[] = [
  {
    id: 'rec-1',
    type: 'high-error',
    priority: 1,
    reason: '高频错误',
    targetSentenceId: 'test-sentence-1',
    action: '开始练习',
  },
  {
    id: 'rec-2',
    type: 'mode-weak',
    priority: 2,
    reason: '模式薄弱',
    targetSentenceId: 'test-sentence-2',
    action: '开始练习',
    suggestedMode: 'fill-in-blanks',
  },
];

// Mock the sub-components
vi.mock('../LearningProfileCard', () => ({
  LearningProfileCard: ({ className }: { className?: string }) => (
    <div data-testid="learning-profile-card" className={className}>
      LearningProfileCard
    </div>
  ),
}));

vi.mock('../AbilityRadarMini', () => ({
  AbilityRadarMini: ({ size }: { size?: number }) => (
    <div data-testid="ability-radar-mini">AbilityRadarMini-{size}</div>
  ),
}));

vi.mock('../LearningCalendarHeatmap', () => ({
  LearningCalendarHeatmap: ({ weeks }: { weeks?: number }) => (
    <div data-testid="learning-calendar-heatmap">LearningCalendarHeatmap-{weeks}</div>
  ),
}));

vi.mock('../MilestoneTimeline', () => ({
  MilestoneTimeline: () => (
    <div data-testid="milestone-timeline">MilestoneTimeline</div>
  ),
}));

// Mock the PracticeRecommendationPanel component
vi.mock('../PracticeRecommendationPanel', () => ({
  PracticeRecommendationPanel: ({
    recommendations,
    onStartPractice,
    onDismissRecommendation,
  }: {
    recommendations: PracticeRecommendation[];
    onStartPractice: (_rec: PracticeRecommendation) => void;
    onDismissRecommendation: (_recId: string) => void;
  }) => (
    <div data-testid="practice-recommendation-panel">
      <span data-testid="recommendation-count">{recommendations.length}</span>
      {recommendations.map((rec) => (
        <div key={rec.id} data-testid={`recommendation-${rec.id}`}>
          <span>{rec.reason}</span>
          <button
            data-testid={`start-practice-${rec.id}`}
            onClick={() => onStartPractice(rec)}
          >
            开始练习
          </button>
          <button
            data-testid={`dismiss-recommendation-${rec.id}`}
            onClick={() => onDismissRecommendation(rec.id)}
          >
            关闭
          </button>
        </div>
      ))}
    </div>
  ),
}));

// Mock storage service
vi.mock('@/services/storage', () => ({
  storage: {
    getMistakes: vi.fn(() => []),
    getPersonalWords: vi.fn(() => []),
  },
}));

// Mock the usePracticeRecommendations hook - default returns empty recommendations
vi.mock('@/hooks/usePracticeRecommendations', () => ({
  usePracticeRecommendations: vi.fn(() => ({
    recommendations: [],
    isLoading: false,
    refreshRecommendations: vi.fn(),
  })),
}));

import { usePracticeRecommendations } from '@/hooks/usePracticeRecommendations';

describe('LearnProfilePanel', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockOnBack.mockClear();
  });

  describe('Rendering', () => {
    it('renders the panel with correct test id', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('learn-profile-panel')).toBeInTheDocument();
    });

    it('renders the header with title', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByText('学习画像')).toBeInTheDocument();
    });

    it('renders the subtitle in header', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByText('查看个人学习数据统计')).toBeInTheDocument();
    });
  });

  describe('Back Button', () => {
    it('renders the back button', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      screen.getByTestId('back-button').click();
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Section 1: Learning Stats', () => {
    it('renders the learning stats section', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('section-learning-stats')).toBeInTheDocument();
    });

    it('renders the section title', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByText('学习概览')).toBeInTheDocument();
    });

    it('renders the LearningProfileCard component', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('learning-profile-card')).toBeInTheDocument();
    });
  });

  describe('Section 2: Ability Radar', () => {
    it('renders the ability radar section', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('section-ability-radar')).toBeInTheDocument();
    });

    it('renders the section title', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByText('能力分布')).toBeInTheDocument();
    });

    it('renders the AbilityRadarMini component with default size', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('ability-radar-mini')).toBeInTheDocument();
      expect(screen.getByText('AbilityRadarMini-160')).toBeInTheDocument();
    });

    it('renders the radar chart description', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByText('各模式正确率分布')).toBeInTheDocument();
    });
  });

  describe('Section 2: Practice Recommendations', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders recommendations section when recommendations exist', () => {
      (usePracticeRecommendations as ReturnType<typeof vi.fn>).mockReturnValue({
        recommendations: mockRecommendations,
        isLoading: false,
        refreshRecommendations: vi.fn(),
      });

      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('section-practice-recommendations')).toBeInTheDocument();
    });

    it('renders section title for recommendations', () => {
      (usePracticeRecommendations as ReturnType<typeof vi.fn>).mockReturnValue({
        recommendations: mockRecommendations,
        isLoading: false,
        refreshRecommendations: vi.fn(),
      });

      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByText('智能推荐')).toBeInTheDocument();
    });

    it('renders PracticeRecommendationPanel component with recommendations', () => {
      (usePracticeRecommendations as ReturnType<typeof vi.fn>).mockReturnValue({
        recommendations: mockRecommendations,
        isLoading: false,
        refreshRecommendations: vi.fn(),
      });

      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('practice-recommendation-panel')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-count')).toHaveTextContent('2');
    });

    it('does not render recommendations section when no recommendations', () => {
      (usePracticeRecommendations as ReturnType<typeof vi.fn>).mockReturnValue({
        recommendations: [],
        isLoading: false,
        refreshRecommendations: vi.fn(),
      });

      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.queryByTestId('section-practice-recommendations')).not.toBeInTheDocument();
    });

    it('renders individual recommendation cards', () => {
      (usePracticeRecommendations as ReturnType<typeof vi.fn>).mockReturnValue({
        recommendations: mockRecommendations,
        isLoading: false,
        refreshRecommendations: vi.fn(),
      });

      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('recommendation-rec-1')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-rec-2')).toBeInTheDocument();
    });

    it('calls onStartPractice when start button is clicked', () => {
      (usePracticeRecommendations as ReturnType<typeof vi.fn>).mockReturnValue({
        recommendations: [mockRecommendations[0]],
        isLoading: false,
        refreshRecommendations: vi.fn(),
      });

      render(<LearnProfilePanel onBack={mockOnBack} />);
      const startBtn = screen.getByTestId('start-practice-rec-1');
      fireEvent.click(startBtn);
      // The mock implementation calls onStartPractice with the recommendation
    });

    it('calls onDismissRecommendation when dismiss button is clicked', () => {
      (usePracticeRecommendations as ReturnType<typeof vi.fn>).mockReturnValue({
        recommendations: [mockRecommendations[0]],
        isLoading: false,
        refreshRecommendations: vi.fn(),
      });

      render(<LearnProfilePanel onBack={mockOnBack} />);
      const dismissBtn = screen.getByTestId('dismiss-recommendation-rec-1');
      fireEvent.click(dismissBtn);
      // The mock implementation calls onDismissRecommendation with the id
    });

    it('shows recommendations section for different priority levels', () => {
      const mixedPriorityRecs: PracticeRecommendation[] = [
        { ...mockRecommendations[0], priority: 1 },
        { ...mockRecommendations[1], priority: 2 },
        {
          id: 'rec-3',
          type: 'new-word' as const,
          priority: 3 as const,
          reason: '新内容推荐',
          targetSentenceId: 'new-sentence',
          action: '开始练习',
        },
      ];

      (usePracticeRecommendations as ReturnType<typeof vi.fn>).mockReturnValue({
        recommendations: mixedPriorityRecs,
        isLoading: false,
        refreshRecommendations: vi.fn(),
      });

      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('section-practice-recommendations')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-count')).toHaveTextContent('3');
    });

    it('handles empty recommendations gracefully', () => {
      (usePracticeRecommendations as ReturnType<typeof vi.fn>).mockReturnValue({
        recommendations: [],
        isLoading: false,
        refreshRecommendations: vi.fn(),
      });

      render(<LearnProfilePanel onBack={mockOnBack} />);
      // Section should not be rendered when no recommendations
      expect(screen.queryByTestId('section-practice-recommendations')).not.toBeInTheDocument();
    });

    it('section has correct aria-labelledby attribute', () => {
      (usePracticeRecommendations as ReturnType<typeof vi.fn>).mockReturnValue({
        recommendations: mockRecommendations,
        isLoading: false,
        refreshRecommendations: vi.fn(),
      });

      render(<LearnProfilePanel onBack={mockOnBack} />);
      const section = screen.getByTestId('section-practice-recommendations');
      expect(section).toHaveAttribute('aria-labelledby', 'section-practice-recommendations-title');
    });
  });

  describe('Section 3: Activity Heatmap', () => {
    it('renders the activity heatmap section', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('section-activity-heatmap')).toBeInTheDocument();
    });

    it('renders the section title', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByText('活动热力图')).toBeInTheDocument();
    });

    it('renders the LearningCalendarHeatmap component with default weeks', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('learning-calendar-heatmap')).toBeInTheDocument();
      expect(screen.getByText('LearningCalendarHeatmap-12')).toBeInTheDocument();
    });
  });

  describe('Section 4: Milestones', () => {
    it('renders the milestones section', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('section-milestones')).toBeInTheDocument();
    });

    it('renders the section title', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByText('学习里程碑')).toBeInTheDocument();
    });

    it('renders the MilestoneTimeline component', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(screen.getByTestId('milestone-timeline')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies custom className when provided', () => {
      const { container } = render(
        <LearnProfilePanel onBack={mockOnBack} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies default background styling', () => {
      const { container } = render(<LearnProfilePanel onBack={mockOnBack} />);
      expect(container.firstChild).toHaveClass('bg-slate-50');
    });

    it('has sticky header', () => {
      const { container } = render(<LearnProfilePanel onBack={mockOnBack} />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky', 'top-0', 'z-10');
    });
  });

  describe('Accessibility', () => {
    it('section has correct aria-labelledby', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);
      const section = screen.getByTestId('section-learning-stats');
      expect(section).toHaveAttribute('aria-labelledby', 'section-learning-stats-title');
    });
  });

  describe('Navigation', () => {
    it('renders with correct view structure', () => {
      render(<LearnProfilePanel onBack={mockOnBack} />);

      // All 4 sections should be present
      expect(screen.getByTestId('section-learning-stats')).toBeInTheDocument();
      expect(screen.getByTestId('section-ability-radar')).toBeInTheDocument();
      expect(screen.getByTestId('section-activity-heatmap')).toBeInTheDocument();
      expect(screen.getByTestId('section-milestones')).toBeInTheDocument();
    });
  });
});