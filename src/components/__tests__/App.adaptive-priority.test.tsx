import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MoreMenu } from '../MoreMenu';
import type { PriorityView } from '@/hooks/useAdaptiveViewRegistry';

// Mock shadcn UI components with state tracking for dropdown
let dropdownIsOpen = false;

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  )),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: vi.fn(({ children, ...props }: { children: React.ReactNode }) => (
    <span {...props} data-testid="badge">{children}</span>
  )),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  )),
  DropdownMenuTrigger: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div
      data-testid="dropdown-trigger"
      onClick={() => {
        dropdownIsOpen = !dropdownIsOpen;
      }}
    >
      {children}
    </div>
  )),
  DropdownMenuContent: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  )),
  DropdownMenuItem: vi.fn(({ children, onClick }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => {
    return (
      <div
        data-testid-base="dropdown-item"
        onClick={onClick}
      >
        {children}
      </div>
    );
  }),
  DropdownMenuSeparator: vi.fn(() => (
    <div data-testid="dropdown-separator" />
  )),
}));

// Mock useAdaptiveViewRegistry
const mockTopViews = vi.fn();
vi.mock('@/hooks/useAdaptiveViewRegistry', () => ({
  useAdaptiveViewRegistry: vi.fn(() => ({
    topViews: mockTopViews(),
  })),
}));

// Helper to open dropdown
const openDropdown = () => {
  const trigger = screen.getByTestId('dropdown-trigger');
  fireEvent.click(trigger);
};

describe('App adaptive priority integration', () => {
  const mockOnOpenMistakeBook = vi.fn();
  const mockOnOpenHistory = vi.fn();
  const mockOnOpenDataManager = vi.fn();
  const mockOnOpenSmartReview = vi.fn();
  const mockOnOpenChallenges = vi.fn();
  const mockOnOpenBadges = vi.fn();
  const mockOnOpenLeaderboard = vi.fn();
  const mockOnOpenWeakness = vi.fn();

  const defaultProps = {
    mistakeCount: 0,
    historyCount: 0,
    reviewDueCount: 0,
    unclaimedCount: 0,
    unlockedCount: 0,
    weaknessCount: 0,
    isReviewMode: false,
    onOpenMistakeBook: mockOnOpenMistakeBook,
    onOpenHistory: mockOnOpenHistory,
    onOpenDataManager: mockOnOpenDataManager,
    onOpenSmartReview: mockOnOpenSmartReview,
    onOpenChallenges: mockOnOpenChallenges,
    onOpenBadges: mockOnOpenBadges,
    onOpenLeaderboard: mockOnOpenLeaderboard,
    onOpenWeakness: mockOnOpenWeakness,
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    dropdownIsOpen = false;
    mockTopViews.mockReturnValue([]);
  });

  describe('MoreMenu with adaptive priority views', () => {
    it('renders recommended views section when useAdaptiveViewRegistry returns topViews', () => {
      const mockViews: PriorityView[] = [
        { id: 'practice', priority: 95, config: { id: 'practice', title: 'Practice' } },
        { id: 'review', priority: 85, config: { id: 'review', title: 'Review' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Should show the recommendation section header
      expect(screen.getByText('为你推荐')).toBeInTheDocument();
    });

    it('renders without recommended views section when topViews is empty', () => {
      mockTopViews.mockReturnValue([]);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Should NOT show the recommendation section header
      expect(screen.queryByText('为你推荐')).not.toBeInTheDocument();
    });

    it('renders without recommended views when topViews returns null/undefined', () => {
      mockTopViews.mockReturnValue(null);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      expect(screen.queryByText('为你推荐')).not.toBeInTheDocument();
    });
  });

  describe('AdaptivePrioritySection displays correct number of views', () => {
    it('displays up to 3 views when more than 3 views are returned', () => {
      const mockViews: PriorityView[] = [
        { id: 'practice', priority: 95, config: { id: 'practice', title: 'Practice' } },
        { id: 'review', priority: 85, config: { id: 'review', title: 'Review' } },
        { id: 'learn-insight', priority: 75, config: { id: 'learn-insight', title: 'Learn Insight' } },
        { id: 'badges', priority: 65, config: { id: 'badges', title: 'Badges' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Should show "为你推荐" section
      expect(screen.getByText('为你推荐')).toBeInTheDocument();

      // Should display "练习", "复习", "学习洞察" (first 3 views)
      expect(screen.getByText('练习')).toBeInTheDocument();
      expect(screen.getByText('复习')).toBeInTheDocument();
      expect(screen.getByText('学习洞察')).toBeInTheDocument();

      // Find the priority section container (has px-2 py-1.5 class) and count its items
      // The priority section renders views in a .space-y-0.5 container
      const prioritySection = document.querySelector('.space-y-0\\.5');
      const priorityViewItems = prioritySection?.querySelectorAll('.flex.items-center.gap-2');
      // Should have exactly 3 items (first 3 views)
      expect(priorityViewItems?.length).toBe(3);
    });

    it('displays all views when fewer than 3 views are returned', () => {
      const mockViews: PriorityView[] = [
        { id: 'practice', priority: 95, config: { id: 'practice', title: 'Practice' } },
        { id: 'review', priority: 85, config: { id: 'review', title: 'Review' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Should display both views
      expect(screen.getByText('练习')).toBeInTheDocument();
      expect(screen.getByText('复习')).toBeInTheDocument();

      // Should NOT show the 3rd view (not returned)
      expect(screen.queryByText('学习洞察')).not.toBeInTheDocument();
    });

    it('displays single view when only one view is returned', () => {
      const mockViews: PriorityView[] = [
        { id: 'practice', priority: 95, config: { id: 'practice', title: 'Practice' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      expect(screen.getByText('练习')).toBeInTheDocument();
      expect(screen.queryByText('复习')).not.toBeInTheDocument();
    });
  });

  describe('Priority labels display correctly', () => {
    it('displays 高优先级 label for views with priority >= 80', () => {
      const mockViews: PriorityView[] = [
        { id: 'practice', priority: 95, config: { id: 'practice', title: 'Practice' } },
        { id: 'review', priority: 85, config: { id: 'review', title: 'Review' } },
        { id: 'learn-insight', priority: 80, config: { id: 'learn-insight', title: 'Learn Insight' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Priority labels are rendered with parentheses: (高优先级)
      const highPriorityLabels = screen.getAllByText(/\(高优先级\)/);
      expect(highPriorityLabels.length).toBe(3);
    });

    it('displays 待复习 label for views with priority 50-79', () => {
      const mockViews: PriorityView[] = [
        { id: 'challenges', priority: 75, config: { id: 'challenges', title: 'Challenge' } },
        { id: 'badges', priority: 50, config: { id: 'badges', title: 'Badges' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Priority labels are rendered with parentheses: (待复习)
      const reviewLabels = screen.getAllByText(/\(待复习\)/);
      expect(reviewLabels.length).toBe(2);
    });

    it('displays 可学习 label for views with priority 20-49', () => {
      const mockViews: PriorityView[] = [
        { id: 'leaderboard', priority: 35, config: { id: 'leaderboard', title: 'Leaderboard' } },
        { id: 'learn-profile', priority: 20, config: { id: 'learn-profile', title: 'Learn Profile' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Priority labels are rendered with parentheses: (可学习)
      const learnableLabels = screen.getAllByText(/\(可学习\)/);
      expect(learnableLabels.length).toBe(2);
    });

    it('displays 低优先级 label for views with priority < 20', () => {
      const mockViews: PriorityView[] = [
        { id: 'practice', priority: 15, config: { id: 'practice', title: 'Practice' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Should show "低优先级" label (with parentheses)
      expect(screen.getByText('练习')).toBeInTheDocument();
      expect(screen.getByText(/\(低优先级\)/)).toBeInTheDocument();
    });

    it('displays mixed priority labels correctly', () => {
      const mockViews: PriorityView[] = [
        { id: 'practice', priority: 95, config: { id: 'practice', title: 'Practice' } },
        { id: 'challenges', priority: 65, config: { id: 'challenges', title: 'Challenge' } },
        { id: 'leaderboard', priority: 10, config: { id: 'leaderboard', title: 'Leaderboard' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Should show each priority label (with parentheses)
      expect(screen.getByText(/\(高优先级\)/)).toBeInTheDocument();
      expect(screen.getByText(/\(待复习\)/)).toBeInTheDocument();
      expect(screen.getByText(/\(低优先级\)/)).toBeInTheDocument();
    });
  });

  describe('View titles display correctly', () => {
    it('displays correct Chinese titles for known view IDs', () => {
      const mockViews: PriorityView[] = [
        { id: 'practice', priority: 90, config: { id: 'practice', title: 'Practice' } },
        { id: 'review', priority: 85, config: { id: 'review', title: 'Review' } },
        { id: 'challenges', priority: 80, config: { id: 'challenges', title: 'Challenge' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      expect(screen.getByText('练习')).toBeInTheDocument();
      expect(screen.getByText('复习')).toBeInTheDocument();
      expect(screen.getByText('挑战')).toBeInTheDocument();
    });
  });

  describe('Integration with MoreMenu dropdown', () => {
    it('renders separator after recommended views section', () => {
      const mockViews: PriorityView[] = [
        { id: 'practice', priority: 90, config: { id: 'practice', title: 'Practice' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Should have a separator after the recommendation section
      expect(screen.getByTestId('dropdown-separator')).toBeInTheDocument();

      // The separator should come after the recommendation section
      // Separator follows the recommendation header, so separator's position relative to header is DOCUMENT_POSITION_PRECEDING (2)
      const separator = screen.getByTestId('dropdown-separator');
      const recommendationHeader = screen.getByText('为你推荐');
      expect(separator.compareDocumentPosition(recommendationHeader)).toBe(Node.DOCUMENT_POSITION_PRECEDING);
    });

    it('still renders regular menu items alongside recommended views', () => {
      const mockViews: PriorityView[] = [
        { id: 'practice', priority: 90, config: { id: 'practice', title: 'Practice' } },
      ];
      mockTopViews.mockReturnValue(mockViews);

      render(<MoreMenu {...defaultProps} />);
      openDropdown();

      // Regular menu items should still be visible
      expect(screen.getByText('错题本')).toBeInTheDocument();
      expect(screen.getByText('学习记录')).toBeInTheDocument();
      expect(screen.getByText('数据管理')).toBeInTheDocument();
      expect(screen.getByText('智能复习')).toBeInTheDocument();
    });
  });
});
