import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdaptiveViewStateIndicator } from '../AdaptiveViewStateIndicator';
import type { AdaptiveViewState } from '@/hooks/useAdaptiveViewContext';
import type { FlowState } from '@/hooks/useFlowState';

// Create mock functions
const mockUseAdaptiveViewContext = vi.fn();

vi.mock('@/hooks/useAdaptiveViewContext', () => ({
  useAdaptiveViewContext: () => mockUseAdaptiveViewContext(),
}));

describe('AdaptiveViewStateIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock adaptive state
  const createMockState = (overrides: Partial<AdaptiveViewState> = {}): AdaptiveViewState => ({
    difficultyLevel: 'normal',
    priorityAdjustment: 1.0,
    recommendedViews: ['practice'],
    flowState: 'normal' as FlowState,
    fatigueSignals: [],
    hasWeaknessBias: false,
    weaknessCount: 0,
    recentAccuracy: 0.6,
    ...overrides,
  });

  describe('flow state display', () => {
    it('displays normal state label', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'normal' }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('正常')).toBeInTheDocument();
    });

    it('displays focused state label', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'focused' }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('专注')).toBeInTheDocument();
    });

    it('displays fatigued state label', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'fatigued' }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('疲惫')).toBeInTheDocument();
    });

    it('renders correct icon for normal state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'normal' }));

      render(<AdaptiveViewStateIndicator />);

      // Look for the Brain icon (lucide-brain)
      const icon = document.querySelector('svg.lucide-brain');
      expect(icon).toBeInTheDocument();
    });

    it('renders correct icon for focused state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'focused' }));

      render(<AdaptiveViewStateIndicator />);

      // Look for the Zap icon (lucide-zap)
      const icon = document.querySelector('svg.lucide-zap');
      expect(icon).toBeInTheDocument();
    });

    it('renders correct icon for fatigued state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'fatigued' }));

      render(<AdaptiveViewStateIndicator />);

      // Look for the Coffee icon (lucide-coffee)
      const icon = document.querySelector('svg.lucide-coffee');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('recommended views display', () => {
    it('displays recommended views when provided', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({
        recommendedViews: ['practice', 'learning'],
      }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText(/推荐:/)).toBeInTheDocument();
      expect(screen.getByText('练习, 学习')).toBeInTheDocument();
    });

    it('displays practice as default when no recommended views', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ recommendedViews: [] }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText(/推荐:/)).toBeInTheDocument();
      expect(screen.getByText('练习')).toBeInTheDocument();
    });

    it('displays single view correctly', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ recommendedViews: ['challenge'] }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('挑战')).toBeInTheDocument();
    });

    it('displays unknown view ID as-is', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ recommendedViews: ['custom-view'] }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('custom-view')).toBeInTheDocument();
    });
  });

  describe('priority adjustment display', () => {
    it('displays 0% when priority adjustment is 1.0', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ priorityAdjustment: 1.0 }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays +20% when priority adjustment is 1.2 (boosted)', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ priorityAdjustment: 1.2 }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('+20%')).toBeInTheDocument();
    });

    it('displays -20% when priority adjustment is 0.8 (reduced)', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ priorityAdjustment: 0.8 }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('-20%')).toBeInTheDocument();
    });

    it('displays up arrow for boosted priority', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ priorityAdjustment: 1.5 }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('↑')).toBeInTheDocument();
    });

    it('displays down arrow for reduced priority', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ priorityAdjustment: 0.5 }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('displays right arrow for neutral priority', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ priorityAdjustment: 1.0 }));

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('→')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('renders in compact mode with just flow state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'focused' }));

      render(<AdaptiveViewStateIndicator compact />);

      expect(screen.getByText('专注')).toBeInTheDocument();
      // Should not show recommended views in compact mode
      expect(screen.queryByText(/推荐:/)).not.toBeInTheDocument();
    });

    it('compact mode shows correct icon for each state', () => {
      const states: FlowState[] = ['normal', 'focused', 'fatigued'];
      const labels = ['正常', '专注', '疲惫'];

      states.forEach((state, index) => {
        mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: state }));
        const { unmount } = render(<AdaptiveViewStateIndicator compact />);
        expect(screen.getByText(labels[index])).toBeInTheDocument();
        unmount();
      });
    });

    it('compact mode renders as inline rounded pill', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'normal' }));

      render(<AdaptiveViewStateIndicator compact />);

      const container = screen.getByText('正常').closest('div');
      expect(container?.className).toContain('rounded-full');
    });
  });

  describe('hide options', () => {
    it('hides priority indicator when hidePriority is true', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ priorityAdjustment: 1.2 }));

      render(<AdaptiveViewStateIndicator hidePriority />);

      expect(screen.queryByText('+20%')).not.toBeInTheDocument();
    });

    it('hides recommended views when hideRecommendedViews is true', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ recommendedViews: ['practice'] }));

      render(<AdaptiveViewStateIndicator hideRecommendedViews />);

      expect(screen.queryByText(/推荐:/)).not.toBeInTheDocument();
    });

    it('shows only flow state badge when both are hidden', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({
        flowState: 'normal',
        recommendedViews: ['practice'],
        priorityAdjustment: 1.2,
      }));

      render(<AdaptiveViewStateIndicator hidePriority hideRecommendedViews />);

      expect(screen.getByText('正常')).toBeInTheDocument();
      expect(screen.queryByText(/推荐:/)).not.toBeInTheDocument();
      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });
  });

  describe('override state', () => {
    it('uses override state when provided', () => {
      // Context returns normal state
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'normal' }));
      // But we override to focused
      render(<AdaptiveViewStateIndicator overrideState={{ flowState: 'focused' }} />);

      expect(screen.getByText('专注')).toBeInTheDocument();
    });

    it('override takes precedence over context', () => {
      // Context returns focused state
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'focused', priorityAdjustment: 1.2 }));
      // But we override to fatigued with different priority
      render(<AdaptiveViewStateIndicator overrideState={{ flowState: 'fatigued', priorityAdjustment: 0.8 }} />);

      expect(screen.getByText('疲惫')).toBeInTheDocument();
      expect(screen.getByText('-20%')).toBeInTheDocument();
    });

    it('partial override preserves other context values', () => {
      // Context returns focused with specific views
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({
        flowState: 'focused',
        recommendedViews: ['challenge', 'leaderboard'],
        priorityAdjustment: 1.2,
      }));
      // Only override flow state
      render(<AdaptiveViewStateIndicator overrideState={{ flowState: 'fatigued' }} />);

      expect(screen.getByText('疲惫')).toBeInTheDocument();
      // Recommended views should still be from context
      expect(screen.getByText('挑战, 排行榜')).toBeInTheDocument();
      // Priority adjustment should still be from context
      expect(screen.getByText('+20%')).toBeInTheDocument();
    });
  });

  describe('state-specific styling classes', () => {
    it('applies emerald color scheme for focused state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'focused' }));

      render(<AdaptiveViewStateIndicator />);

      // Check the badge container has the correct background color
      const badge = screen.getByText('专注').closest('div');
      expect(badge?.className).toContain('bg-emerald-50');
      // Check the text element itself has the correct text color
      const textElement = screen.getByText('专注');
      expect(textElement.className).toContain('text-emerald-700');
    });

    it('applies blue color scheme for normal state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'normal' }));

      render(<AdaptiveViewStateIndicator />);

      // Check the badge container has the correct background color
      const badge = screen.getByText('正常').closest('div');
      expect(badge?.className).toContain('bg-blue-50');
      // Check the text element itself has the correct text color
      const textElement = screen.getByText('正常');
      expect(textElement.className).toContain('text-blue-700');
    });

    it('applies amber color scheme for fatigued state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ flowState: 'fatigued' }));

      render(<AdaptiveViewStateIndicator />);

      // Check the badge container has the correct background color
      const badge = screen.getByText('疲惫').closest('div');
      expect(badge?.className).toContain('bg-amber-50');
      // Check the text element itself has the correct text color
      const textElement = screen.getByText('疲惫');
      expect(textElement.className).toContain('text-amber-700');
    });

    it('applies green styling for boosted priority', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ priorityAdjustment: 1.2 }));

      render(<AdaptiveViewStateIndicator />);

      // Check the outer container has the green styling
      const priorityBadge = screen.getByText('+20%').closest('div');
      expect(priorityBadge?.className).toContain('bg-green-50');
      expect(priorityBadge?.className).toContain('text-green-700');
    });

    it('applies orange styling for reduced priority', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ priorityAdjustment: 0.8 }));

      render(<AdaptiveViewStateIndicator />);

      // Check the outer container has the orange styling
      const priorityBadge = screen.getByText('-20%').closest('div');
      expect(priorityBadge?.className).toContain('bg-orange-50');
      expect(priorityBadge?.className).toContain('text-orange-700');
    });
  });

  describe('tooltip titles', () => {
    it('compact mode has title attribute', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({
        flowState: 'focused',
        recommendedViews: ['practice', 'learning'],
      }));

      render(<AdaptiveViewStateIndicator compact />);

      const label = screen.getByText('专注').closest('div');
      expect(label?.getAttribute('title')).toContain('专注状态');
      expect(label?.getAttribute('title')).toContain('推荐: 练习, 学习');
    });

    it('priority indicator has title with difficulty adjustment', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockState({ priorityAdjustment: 1.2 }));

      render(<AdaptiveViewStateIndicator />);

      const priorityBadge = screen.getByText('+20%').closest('div');
      expect(priorityBadge?.getAttribute('title')).toContain('难度调整: +20%');
    });
  });

  describe('integration with full adaptive state', () => {
    it('renders correctly with all fields populated', () => {
      mockUseAdaptiveViewContext.mockReturnValue({
        difficultyLevel: 'hard',
        priorityAdjustment: 1.2,
        recommendedViews: ['challenge', 'leaderboard'],
        flowState: 'focused',
        fatigueSignals: [
          { type: 'accuracy', trend: 'improving', description: '正确率正在提升', severity: 0.2 },
        ],
        hasWeaknessBias: false,
        weaknessCount: 1,
        recentAccuracy: 0.85,
      });

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('专注')).toBeInTheDocument();
      expect(screen.getByText('挑战, 排行榜')).toBeInTheDocument();
      expect(screen.getByText('+20%')).toBeInTheDocument();
      expect(screen.getByText('↑')).toBeInTheDocument();
    });

    it('renders correctly with weakness bias state', () => {
      mockUseAdaptiveViewContext.mockReturnValue({
        difficultyLevel: 'easy',
        priorityAdjustment: 0.8,
        recommendedViews: ['practice', 'learning', 'review'],
        flowState: 'fatigued',
        fatigueSignals: [],
        hasWeaknessBias: true,
        weaknessCount: 5,
        recentAccuracy: 0.35,
      });

      render(<AdaptiveViewStateIndicator />);

      expect(screen.getByText('疲惫')).toBeInTheDocument();
      expect(screen.getByText('-20%')).toBeInTheDocument();
      expect(screen.getByText('↓')).toBeInTheDocument();
    });
  });
});