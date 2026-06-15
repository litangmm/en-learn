import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LearningRecommendations } from '../LearningRecommendations';
import type { ModeRecommendation, ModeAccuracy } from '@/data/types';

// Mock framer-motion to avoid animation testing issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('LearningRecommendations', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Empty state', () => {
    it('should show empty state placeholder when recommendations is empty array', () => {
      render(<LearningRecommendations recommendations={[]} />);

      expect(screen.getByText('开始练习后，这里会显示你的学习建议')).toBeInTheDocument();
    });

    it('should render Lightbulb icon in empty state', () => {
      const { container } = render(<LearningRecommendations recommendations={[]} />);

      // Check for the Lightbulb icon (Lucide renders as SVG)
      const lightbulbIcon = container.querySelector('svg');
      expect(lightbulbIcon).toBeTruthy();
    });

    it('should have centered styling for empty state', () => {
      const { container } = render(<LearningRecommendations recommendations={[]} />);

      const emptyStateDiv = container.querySelector('.text-center');
      expect(emptyStateDiv).toBeTruthy();
    });
  });

  describe('Single recommendation', () => {
    it('should render one recommendation card', () => {
      const recommendations: ModeRecommendation[] = [
        {
          mode: 'fill-in-blanks',
          preferred: true,
          reason: '「填空」正确率50%，需要更多练习',
          priority: 60,
        },
      ];

      render(<LearningRecommendations recommendations={recommendations} />);

      expect(screen.getByText('填空')).toBeInTheDocument();
      expect(screen.getByText('「填空」正确率50%，需要更多练习')).toBeInTheDocument();
    });

    it('should show "暂无数据" when no accuracy data provided', () => {
      const recommendations: ModeRecommendation[] = [
        {
          mode: 'fill-in-blanks',
          preferred: true,
          reason: '你还没有练习过「填空」模式，建议尝试一下',
          priority: 10,
        },
      ];

      render(<LearningRecommendations recommendations={recommendations} />);

      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('should display accuracy from modeAccuracy prop', () => {
      const recommendations: ModeRecommendation[] = [
        {
          mode: 'fill-in-blanks',
          preferred: true,
          reason: '「填空」正确率85%，表现不错',
          priority: 40,
        },
      ];
      const modeAccuracy: ModeAccuracy[] = [
        { mode: 'fill-in-blanks', accuracy: 85, totalQuestions: 20, correctCount: 17 },
      ];

      render(<LearningRecommendations recommendations={recommendations} modeAccuracy={modeAccuracy} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument(); // total questions
    });
  });

  describe('Multiple recommendations', () => {
    it('should render four recommendation cards', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '推荐原因1', priority: 80 },
        { mode: 'multiple-choice', preferred: false, reason: '推荐原因2', priority: 60 },
        { mode: 'sentence-reorder', preferred: false, reason: '推荐原因3', priority: 40 },
        { mode: 'dictation', preferred: false, reason: '推荐原因4', priority: 20 },
      ];

      render(<LearningRecommendations recommendations={recommendations} />);

      expect(screen.getByText('填空')).toBeInTheDocument();
      expect(screen.getByText('选择')).toBeInTheDocument();
      expect(screen.getByText('排序')).toBeInTheDocument();
      expect(screen.getByText('听写')).toBeInTheDocument();
    });

    it('should render all recommendation reasons', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '原因1', priority: 80 },
        { mode: 'multiple-choice', preferred: false, reason: '原因2', priority: 60 },
        { mode: 'sentence-reorder', preferred: false, reason: '原因3', priority: 40 },
        { mode: 'dictation', preferred: false, reason: '原因4', priority: 20 },
      ];

      render(<LearningRecommendations recommendations={recommendations} />);

      expect(screen.getByText('原因1')).toBeInTheDocument();
      expect(screen.getByText('原因2')).toBeInTheDocument();
      expect(screen.getByText('原因3')).toBeInTheDocument();
      expect(screen.getByText('原因4')).toBeInTheDocument();
    });

    it('should render cards in a responsive grid layout', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '推荐原因', priority: 80 },
        { mode: 'multiple-choice', preferred: false, reason: '原因2', priority: 60 },
      ];

      const { container } = render(<LearningRecommendations recommendations={recommendations} />);

      // Should have grid layout
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Preferred card styling', () => {
    it('should have Crown icon and "推荐" badge for preferred card', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '推荐原因', priority: 80 },
      ];

      const { container } = render(<LearningRecommendations recommendations={recommendations} />);

      expect(screen.getByText('推荐')).toBeInTheDocument();

      // Check for Crown icon (SVG element)
      const crownIcon = container.querySelector('svg');
      expect(crownIcon).toBeTruthy();
    });

    it('should have blue gradient background for preferred card', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '推荐原因', priority: 80 },
      ];

      const { container } = render(<LearningRecommendations recommendations={recommendations} />);

      const preferredCard = container.querySelector('.from-blue-50');
      expect(preferredCard).toBeTruthy();
    });

    it('should have blue text for preferred card reason', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '推荐原因', priority: 80 },
      ];

      const { container } = render(<LearningRecommendations recommendations={recommendations} />);

      const blueText = container.querySelector('.text-blue-800');
      expect(blueText).toBeTruthy();
      expect(blueText?.textContent).toBe('推荐原因');
    });

    it('should have blue mode label badge for preferred card', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '推荐原因', priority: 80 },
      ];

      const { container } = render(<LearningRecommendations recommendations={recommendations} />);

      const blueBadge = container.querySelector('.bg-blue-100');
      expect(blueBadge).toBeTruthy();
      expect(blueBadge?.textContent).toBe('填空');
    });
  });

  describe('Non-preferred card styling', () => {
    it('should have numbered badge (#1, #2, etc.) for non-preferred cards', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: false, reason: '原因1', priority: 80 },
        { mode: 'multiple-choice', preferred: false, reason: '原因2', priority: 60 },
      ];

      render(<LearningRecommendations recommendations={recommendations} />);

      expect(screen.getAllByText('#1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#2').length).toBeGreaterThan(0);
    });

    it('should show "优先级" label on non-preferred badges', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: false, reason: '原因', priority: 80 },
      ];

      render(<LearningRecommendations recommendations={recommendations} />);

      expect(screen.getByText('优先级')).toBeInTheDocument();
    });

    it('should have white background for non-preferred cards', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: false, reason: '原因', priority: 80 },
      ];

      const { container } = render(<LearningRecommendations recommendations={recommendations} />);

      const whiteCard = container.querySelector('.bg-white');
      expect(whiteCard).toBeTruthy();
    });

    it('should have slate text for non-preferred card reason', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: false, reason: 'UniqueReasonText123', priority: 80 },
      ];

      render(<LearningRecommendations recommendations={recommendations} />);

      // Use screen.getByText to find the reason paragraph
      const reasonText = screen.getByText('UniqueReasonText123');
      expect(reasonText).toBeInTheDocument();
      // The reason text should be in a paragraph with slate color
      expect(reasonText.className).toContain('text-slate-600');
    });

    it('should have slate mode label badge for non-preferred card', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: false, reason: '原因', priority: 80 },
      ];

      render(<LearningRecommendations recommendations={recommendations} />);

      // Find the mode badge specifically using exact text match
      const modeBadge = screen.getByText('填空', { selector: 'span' });
      expect(modeBadge).toBeInTheDocument();
      // The mode badge should have slate styling
      expect(modeBadge.className).toContain('bg-slate-100');
      expect(modeBadge.className).toContain('text-slate-600');
    });
  });

  describe('Performance data display', () => {
    it('should show correct count label "正确率"', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '原因', priority: 80 },
      ];
      const modeAccuracy: ModeAccuracy[] = [
        { mode: 'fill-in-blanks', accuracy: 75, totalQuestions: 20, correctCount: 15 },
      ];

      render(<LearningRecommendations recommendations={recommendations} modeAccuracy={modeAccuracy} />);

      expect(screen.getByText('正确率')).toBeInTheDocument();
    });

    it('should show question count label "题"', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '原因', priority: 80 },
      ];
      const modeAccuracy: ModeAccuracy[] = [
        { mode: 'fill-in-blanks', accuracy: 75, totalQuestions: 20, correctCount: 15 },
      ];

      render(<LearningRecommendations recommendations={recommendations} modeAccuracy={modeAccuracy} />);

      expect(screen.getAllByText('题').length).toBeGreaterThan(0);
    });

    it('should display correct totalQuestions value', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '原因', priority: 80 },
      ];
      const modeAccuracy: ModeAccuracy[] = [
        { mode: 'fill-in-blanks', accuracy: 75, totalQuestions: 50, correctCount: 38 },
      ];

      render(<LearningRecommendations recommendations={recommendations} modeAccuracy={modeAccuracy} />);

      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('Integration with modeAccuracy', () => {
    it('should use accuracy from modeAccuracy prop', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '原因', priority: 80 },
      ];
      const modeAccuracy: ModeAccuracy[] = [
        { mode: 'fill-in-blanks', accuracy: 92, totalQuestions: 25, correctCount: 23 },
      ];

      render(<LearningRecommendations recommendations={recommendations} modeAccuracy={modeAccuracy} />);

      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('should default to 0 accuracy when mode not in modeAccuracy', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '原因', priority: 80 },
      ];
      // modeAccuracy doesn't include fill-in-blanks
      const modeAccuracy: ModeAccuracy[] = [
        { mode: 'multiple-choice', accuracy: 80, totalQuestions: 10, correctCount: 8 },
      ];

      render(<LearningRecommendations recommendations={recommendations} modeAccuracy={modeAccuracy} />);

      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('should handle empty modeAccuracy gracefully', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '原因', priority: 80 },
      ];

      render(<LearningRecommendations recommendations={recommendations} modeAccuracy={[]} />);

      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });
  });

  describe('Grid layout', () => {
    it('should render in a grid container', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '原因1', priority: 80 },
        { mode: 'multiple-choice', preferred: false, reason: '原因2', priority: 60 },
      ];

      const { container } = render(<LearningRecommendations recommendations={recommendations} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeTruthy();
    });

    it('should have responsive grid classes', () => {
      const recommendations: ModeRecommendation[] = [
        { mode: 'fill-in-blanks', preferred: true, reason: '原因', priority: 80 },
      ];

      const { container } = render(<LearningRecommendations recommendations={recommendations} />);

      const gridContainer = container.querySelector('.grid-cols-1');
      expect(gridContainer).toBeTruthy();
    });
  });
});