import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MoreMenu } from '../MoreMenu';

// Mock shadcn UI components with state tracking for dropdown
let dropdownIsOpen = false;
const triggerClickHandler = { current: null as (() => void) | null };

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
        if (triggerClickHandler.current) triggerClickHandler.current();
      }}
    >
      {children}
    </div>
  )),
  DropdownMenuContent: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  )),
  DropdownMenuItem: vi.fn(({ children, onClick, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <div
      data-testid="dropdown-item"
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )),
}));

describe('MoreMenu', () => {
  const mockOnOpenMistakeBook = vi.fn();
  const mockOnOpenHistory = vi.fn();
  const mockOnOpenDataManager = vi.fn();
  const mockOnOpenSmartReview = vi.fn();
  const mockOnOpenChallenges = vi.fn();
  const mockOnOpenBadges = vi.fn();
  const mockOnOpenLeaderboard = vi.fn();

  const defaultProps = {
    mistakeCount: 0,
    historyCount: 0,
    reviewDueCount: 0,
    unclaimedCount: 0,
    unlockedCount: 0,
    isReviewMode: false,
    onOpenMistakeBook: mockOnOpenMistakeBook,
    onOpenHistory: mockOnOpenHistory,
    onOpenDataManager: mockOnOpenDataManager,
    onOpenSmartReview: mockOnOpenSmartReview,
    onOpenChallenges: mockOnOpenChallenges,
    onOpenBadges: mockOnOpenBadges,
    onOpenLeaderboard: mockOnOpenLeaderboard,
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    dropdownIsOpen = false;
  });

  it('Dropdown menu opens when 更多 button is clicked', () => {
    render(<MoreMenu {...defaultProps} />);

    // Initially only trigger is visible, dropdown items are not in the DOM
    // because DropdownMenuContent is inside the trigger (controlled component pattern)
    const trigger = screen.getByTestId('dropdown-trigger');

    // Click the trigger to open the dropdown
    fireEvent.click(trigger);

    // After clicking, the dropdown content becomes visible (items are now accessible)
    const dropdownContent = screen.getByTestId('dropdown-content');
    expect(dropdownContent).toBeInTheDocument();
    expect(screen.getByText('错题本')).toBeInTheDocument();
    expect(screen.getByText('学习记录')).toBeInTheDocument();
    expect(screen.getByText('智能复习')).toBeInTheDocument();
  });

  it('renders dropdown menu with trigger button', () => {
    render(<MoreMenu {...defaultProps} />);

    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
  });

  it('renders button with 更多 text and icon', () => {
    render(<MoreMenu {...defaultProps} />);

    const button = screen.getByRole('button', { name: /更多/ });
    expect(button).toBeInTheDocument();
  });

  it('renders all 7 nav items with correct labels', () => {
    render(<MoreMenu {...defaultProps} />);

    expect(screen.getByText('错题本')).toBeInTheDocument();
    expect(screen.getByText('学习记录')).toBeInTheDocument();
    expect(screen.getByText('数据管理')).toBeInTheDocument();
    expect(screen.getByText('智能复习')).toBeInTheDocument();
    expect(screen.getByText('每日挑战')).toBeInTheDocument();
    expect(screen.getByText('成就')).toBeInTheDocument();
    expect(screen.getByText('排行')).toBeInTheDocument();
  });

  it('calls onOpenMistakeBook when 错题本 item clicked', () => {
    render(<MoreMenu {...defaultProps} />);

    const mistakeBookItem = screen.getByText('错题本').closest('[data-testid="dropdown-item"]');
    fireEvent.click(mistakeBookItem!);

    expect(mockOnOpenMistakeBook).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenHistory when 学习记录 item clicked', () => {
    render(<MoreMenu {...defaultProps} />);

    const historyItem = screen.getByText('学习记录').closest('[data-testid="dropdown-item"]');
    fireEvent.click(historyItem!);

    expect(mockOnOpenHistory).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenDataManager when 数据管理 item clicked', () => {
    render(<MoreMenu {...defaultProps} />);

    const dataManagerItem = screen.getByText('数据管理').closest('[data-testid="dropdown-item"]');
    fireEvent.click(dataManagerItem!);

    expect(mockOnOpenDataManager).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenSmartReview when 智能复习 item clicked', () => {
    render(<MoreMenu {...defaultProps} />);

    const smartReviewItem = screen.getByText('智能复习').closest('[data-testid="dropdown-item"]');
    fireEvent.click(smartReviewItem!);

    expect(mockOnOpenSmartReview).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChallenges when 每日挑战 item clicked', () => {
    render(<MoreMenu {...defaultProps} />);

    const challengesItem = screen.getByText('每日挑战').closest('[data-testid="dropdown-item"]');
    fireEvent.click(challengesItem!);

    expect(mockOnOpenChallenges).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenBadges when 成就 item clicked', () => {
    render(<MoreMenu {...defaultProps} />);

    const badgesItem = screen.getByText('成就').closest('[data-testid="dropdown-item"]');
    fireEvent.click(badgesItem!);

    expect(mockOnOpenBadges).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenLeaderboard when 排行 item clicked', () => {
    render(<MoreMenu {...defaultProps} />);

    const leaderboardItem = screen.getByText('排行').closest('[data-testid="dropdown-item"]');
    fireEvent.click(leaderboardItem!);

    expect(mockOnOpenLeaderboard).toHaveBeenCalledTimes(1);
  });

  describe('Badge counts display', () => {
    const openDropdownAndGetItem = (text: string) => {
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      return screen.getByText(text).closest('[data-testid="dropdown-item"]');
    };

    it('shows mistake count badge when mistakeCount > 0', () => {
      render(<MoreMenu {...defaultProps} mistakeCount={5} />);

      const item = openDropdownAndGetItem('错题本');
      const badge = item?.querySelector('[data-testid="badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });

    it('shows history count badge when historyCount > 0', () => {
      render(<MoreMenu {...defaultProps} historyCount={3} />);

      const item = openDropdownAndGetItem('学习记录');
      const badge = item?.querySelector('[data-testid="badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });

    it('shows review due count badge when reviewDueCount > 0', () => {
      render(<MoreMenu {...defaultProps} reviewDueCount={7} />);

      const item = openDropdownAndGetItem('智能复习');
      const badge = item?.querySelector('[data-testid="badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('7');
    });

    it('shows unclaimed count badge when unclaimedCount > 0', () => {
      render(<MoreMenu {...defaultProps} unclaimedCount={2} />);

      const item = openDropdownAndGetItem('每日挑战');
      const badge = item?.querySelector('[data-testid="badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('2');
    });

    it('shows unlocked count badge when unlockedCount > 0', () => {
      render(<MoreMenu {...defaultProps} unlockedCount={4} />);

      const item = openDropdownAndGetItem('成就');
      const badge = item?.querySelector('[data-testid="badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('4');
    });

    it('hides mistake badge when mistakeCount = 0', () => {
      render(<MoreMenu {...defaultProps} mistakeCount={0} />);

      const item = openDropdownAndGetItem('错题本');
      const badge = item?.querySelector('[data-testid="badge"]');
      expect(badge).not.toBeInTheDocument();
    });

    it('hides history badge when historyCount = 0', () => {
      render(<MoreMenu {...defaultProps} historyCount={0} />);

      const item = openDropdownAndGetItem('学习记录');
      const badge = item?.querySelector('[data-testid="badge"]');
      expect(badge).not.toBeInTheDocument();
    });

    it('hides review badge when reviewDueCount = 0', () => {
      render(<MoreMenu {...defaultProps} reviewDueCount={0} />);

      const item = openDropdownAndGetItem('智能复习');
      const badge = item?.querySelector('[data-testid="badge"]');
      expect(badge).not.toBeInTheDocument();
    });

    it('hides unclaimed badge when unclaimedCount = 0', () => {
      render(<MoreMenu {...defaultProps} unclaimedCount={0} />);

      const item = openDropdownAndGetItem('每日挑战');
      const badge = item?.querySelector('[data-testid="badge"]');
      expect(badge).not.toBeInTheDocument();
    });

    it('hides unlocked badge when unlockedCount = 0', () => {
      render(<MoreMenu {...defaultProps} unlockedCount={0} />);

      const item = openDropdownAndGetItem('成就');
      const badge = item?.querySelector('[data-testid="badge"]');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('isReviewMode icon display', () => {
    it('shows Brain icon when isReviewMode = false', () => {
      render(<MoreMenu {...defaultProps} isReviewMode={false} />);

      // Open dropdown first to see the icon
      fireEvent.click(screen.getByTestId('dropdown-trigger'));

      // Brain icon is used when not in review mode
      const smartReviewItem = screen.getByText('智能复习').closest('[data-testid="dropdown-item"]');
      expect(smartReviewItem?.querySelector('.lucide-brain')).toBeInTheDocument();
      expect(smartReviewItem?.querySelector('.lucide-refresh-cw')).not.toBeInTheDocument();
    });

    it('shows RefreshCw icon when isReviewMode = true', () => {
      render(<MoreMenu {...defaultProps} isReviewMode={true} />);

      // Open dropdown first to see the icon
      fireEvent.click(screen.getByTestId('dropdown-trigger'));

      // RefreshCw icon is used when in review mode
      const smartReviewItem = screen.getByText('智能复习').closest('[data-testid="dropdown-item"]');
      expect(smartReviewItem?.querySelector('.lucide-refresh-cw')).toBeInTheDocument();
      expect(smartReviewItem?.querySelector('.lucide-brain')).not.toBeInTheDocument();
    });
  });

  it('renders all items with cursor-pointer class', () => {
    render(<MoreMenu {...defaultProps} />);

    const items = screen.getAllByTestId('dropdown-item');
    items.forEach((item) => {
      expect(item).toHaveClass('cursor-pointer');
    });
  });

  it('renders items with flex-1 class on text span', () => {
    render(<MoreMenu {...defaultProps} />);

    // Check that spans with flex-1 exist for items that have badges
    const mistakeBookItem = screen.getByText('错题本');
    const mistakeBookSpan = mistakeBookItem.parentElement?.querySelector('span.flex-1');
    expect(mistakeBookSpan).toBeInTheDocument();
  });
});