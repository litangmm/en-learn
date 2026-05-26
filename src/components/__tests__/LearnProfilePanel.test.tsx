import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LearnProfilePanel } from '../LearnProfilePanel';

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