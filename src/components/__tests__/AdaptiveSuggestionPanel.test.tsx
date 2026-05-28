import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AdaptiveSuggestionPanel } from '../AdaptiveSuggestionPanel';
import { useAdaptiveSuggestions } from '@/hooks/useAdaptiveSuggestions';
import type { SuggestedAction } from '@/hooks/useAdaptiveSuggestions';

const defaultMockActions: SuggestedAction[] = [
  {
    id: 'focused-challenge',
    title: '挑战高难度',
    description: '状态极佳，适合挑战更高难度内容',
    priority: 80,
    icon: 'fire',
    viewId: 'challenge',
  },
  {
    id: 'focused-leaderboard',
    title: '查看排行榜',
    description: '与好友竞争，激发学习动力',
    priority: 50,
    icon: 'trophy',
    viewId: 'leaderboard',
  },
  {
    id: 'practice-targeted',
    title: '针对性练习',
    description: '检测到3个薄弱点，建议进行针对性练习',
    priority: 80,
    icon: 'crosshair',
    viewId: 'practice',
  },
];

const defaultStatusSummary = '状态极佳 | 正确率中等 (65%) | 3个薄弱点待提升 | 进阶学习者';

// Mock useAdaptiveSuggestions hook at module level
vi.mock('@/hooks/useAdaptiveSuggestions', () => ({
  useAdaptiveSuggestions: vi.fn(),
}));

describe('AdaptiveSuggestionPanel', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    // Reset to default mock before each test
    vi.mocked(useAdaptiveSuggestions).mockReturnValue({
      statusSummary: defaultStatusSummary,
      suggestedActions: defaultMockActions,
    });
  });

  it('renders the panel', () => {
    render(<AdaptiveSuggestionPanel />);
    expect(screen.getByTestId('adaptive-suggestion-panel')).toBeInTheDocument();
  });

  it('renders status summary in header', () => {
    render(<AdaptiveSuggestionPanel />);
    expect(screen.getByTestId('status-summary')).toBeInTheDocument();
    expect(screen.getByText('学习状态')).toBeInTheDocument();
    expect(screen.getByText(defaultStatusSummary)).toBeInTheDocument();
  });

  it('renders suggested actions section', () => {
    render(<AdaptiveSuggestionPanel />);
    expect(screen.getByTestId('suggested-actions')).toBeInTheDocument();
    expect(screen.getByText('建议操作')).toBeInTheDocument();
  });

  it('renders all suggested action items', () => {
    render(<AdaptiveSuggestionPanel />);
    const actionItems = screen.getAllByTestId('action-item');
    expect(actionItems).toHaveLength(3);
  });

  it('renders action item title', () => {
    render(<AdaptiveSuggestionPanel />);
    expect(screen.getByText('挑战高难度')).toBeInTheDocument();
    expect(screen.getByText('查看排行榜')).toBeInTheDocument();
    expect(screen.getByText('针对性练习')).toBeInTheDocument();
  });

  it('renders action item description', () => {
    render(<AdaptiveSuggestionPanel />);
    expect(screen.getByText('状态极佳，适合挑战更高难度内容')).toBeInTheDocument();
    expect(screen.getByText('与好友竞争，激发学习动力')).toBeInTheDocument();
  });

  it('renders priority badge for each action', () => {
    render(<AdaptiveSuggestionPanel />);
    const priorityBadges = screen.getAllByTestId('priority-badge');
    expect(priorityBadges).toHaveLength(3);
  });

  it('renders correct priority badge text', () => {
    render(<AdaptiveSuggestionPanel />);
    // High priority (80) should show "高"
    const highPriorityBadges = screen.getAllByText('高');
    expect(highPriorityBadges).toHaveLength(2); // 2 high priority actions
    // Medium priority (50) should show "中"
    expect(screen.getByText('中')).toBeInTheDocument();
  });

  it('renders icons for actions with icon field', () => {
    render(<AdaptiveSuggestionPanel />);
    // Should render icon container for each action
    const iconContainers = screen.getAllByTestId('action-icon');
    expect(iconContainers).toHaveLength(3);
  });

  it('renders clickable action items', () => {
    render(<AdaptiveSuggestionPanel />);
    const actionItems = screen.getAllByTestId('action-item');
    actionItems.forEach((item) => {
      expect(item).toHaveAttribute('role', 'button');
    });
  });

  it('calls onActionSelect with action when clicked', () => {
    const mockOnActionSelect = vi.fn();
    render(<AdaptiveSuggestionPanel onActionSelect={mockOnActionSelect} />);

    const firstAction = screen.getByText('挑战高难度').closest('[data-testid="action-item"]');
    fireEvent.click(firstAction!);

    expect(mockOnActionSelect).toHaveBeenCalledTimes(1);
    expect(mockOnActionSelect).toHaveBeenCalledWith(defaultMockActions[0]);
  });

  it('calls onActionSelect with correct action data', () => {
    const mockOnActionSelect = vi.fn();
    render(<AdaptiveSuggestionPanel onActionSelect={mockOnActionSelect} />);

    // Click second action (查看排行榜)
    const secondAction = screen.getByText('查看排行榜').closest('[data-testid="action-item"]');
    fireEvent.click(secondAction!);

    expect(mockOnActionSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'focused-leaderboard',
        title: '查看排行榜',
        viewId: 'leaderboard',
      })
    );
  });

  it('shows skeleton loading state when suggestedActions is empty and statusSummary is empty', () => {
    vi.mocked(useAdaptiveSuggestions).mockReturnValueOnce({
      statusSummary: '',
      suggestedActions: [],
    });

    render(<AdaptiveSuggestionPanel />);

    // Should show skeleton for both status and actions
    expect(screen.getByTestId('status-summary-skeleton')).toBeInTheDocument();
    const skeletonItems = screen.getAllByTestId('action-skeleton');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  it('shows empty state message when suggestedActions is empty but statusSummary exists', () => {
    vi.mocked(useAdaptiveSuggestions).mockReturnValueOnce({
      statusSummary: '状态一般 | 正确率中等 (50%) | 初学者',
      suggestedActions: [],
    });

    render(<AdaptiveSuggestionPanel />);

    // Should show empty state message, not skeleton
    expect(screen.getByText('暂无建议')).toBeInTheDocument();
  });

  it('renders priority badge with correct variant text by priority level', () => {
    render(<AdaptiveSuggestionPanel />);
    const badges = screen.getAllByTestId('priority-badge');

    // In default mock: focused-challenge (80), focused-leaderboard (50), practice-targeted (80)
    // badges order matches suggestedActions order
    // High priority (>= 80) should show "高" (critical)
    expect(badges[0]).toHaveTextContent('高');
    expect(badges[2]).toHaveTextContent('高');
    // Medium priority (>= 50, < 80) should show "中" (medium)
    expect(badges[1]).toHaveTextContent('中');
  });

  it('renders action with viewId as navigate hint', () => {
    const mockOnActionSelect = vi.fn();
    render(<AdaptiveSuggestionPanel onActionSelect={mockOnActionSelect} />);

    const actionWithViewId = screen.getByText('挑战高难度').closest('[data-testid="action-item"]');
    expect(actionWithViewId).toHaveAttribute('data-view-id', 'challenge');
  });

  it('renders action without viewId gracefully', () => {
    vi.mocked(useAdaptiveSuggestions).mockReturnValueOnce({
      statusSummary: '状态疲劳 | 正确率偏低 (30%) | 建议休息',
      suggestedActions: [
        {
          id: 'rest-recovery',
          title: '建议休息',
          description: '疲劳状态可能影响学习效果，建议休息片刻',
          priority: 100,
          icon: 'moon',
          // No viewId
        },
      ],
    });

    render(<AdaptiveSuggestionPanel />);

    const actionWithoutViewId = screen.getByText('建议休息').closest('[data-testid="action-item"]');
    expect(actionWithoutViewId).not.toHaveAttribute('data-view-id');
  });

  it('handles missing icon gracefully', () => {
    vi.mocked(useAdaptiveSuggestions).mockReturnValueOnce({
      statusSummary: '测试状态',
      suggestedActions: [
        {
          id: 'test-action',
          title: '测试动作',
          description: '无图标测试',
          priority: 50,
          // No icon field
        },
      ],
    });

    render(<AdaptiveSuggestionPanel />);

    const actionWithoutIcon = screen.getByText('测试动作').closest('[data-testid="action-item"]');
    // Should still render without crashing
    expect(actionWithoutIcon).toBeInTheDocument();
  });

  it('does not call onActionSelect when clicking while no callback provided', () => {
    // No onActionSelect prop provided
    render(<AdaptiveSuggestionPanel />);

    const firstAction = screen.getByText('挑战高难度').closest('[data-testid="action-item"]');
    // Should not throw
    expect(() => fireEvent.click(firstAction!)).not.toThrow();
  });

  it('renders actions in the order provided by hook (pre-sorted)', () => {
    // Mock returns actions already sorted by priority (hook responsibility)
    vi.mocked(useAdaptiveSuggestions).mockReturnValueOnce({
      statusSummary: '测试状态',
      suggestedActions: [
        {
          id: 'high-priority',
          title: '高优先级',
          description: '优先级 100',
          priority: 100,
          icon: 'fire',
        },
        {
          id: 'medium-priority',
          title: '中优先级',
          description: '优先级 50',
          priority: 50,
          icon: 'book',
        },
        {
          id: 'low-priority',
          title: '低优先级',
          description: '优先级 30',
          priority: 30,
          icon: 'star',
        },
      ],
    });

    render(<AdaptiveSuggestionPanel />);

    // Check order in DOM (component preserves hook's ordering)
    const actionTitles = screen.getAllByTestId('action-item-title');
    expect(actionTitles[0].textContent).toBe('高优先级');
    expect(actionTitles[1].textContent).toBe('中优先级');
    expect(actionTitles[2].textContent).toBe('低优先级');
  });

  it('renders empty actions list gracefully', () => {
    vi.mocked(useAdaptiveSuggestions).mockReturnValueOnce({
      statusSummary: '状态极佳 | 无需建议',
      suggestedActions: [],
    });

    render(<AdaptiveSuggestionPanel />);

    // Should show empty state message
    expect(screen.getByText('暂无建议')).toBeInTheDocument();
  });

  it('handles all icon types correctly', () => {
    const iconActions: SuggestedAction[] = [
      { id: 'fire', title: 'Fire', description: 'fire icon', priority: 80, icon: 'fire' },
      { id: 'trophy', title: 'Trophy', description: 'trophy icon', priority: 80, icon: 'trophy' },
      { id: 'moon', title: 'Moon', description: 'moon icon', priority: 80, icon: 'moon' },
      { id: 'book', title: 'Book', description: 'book icon', priority: 80, icon: 'book' },
      { id: 'target', title: 'Target', description: 'target icon', priority: 80, icon: 'target' },
      { id: 'star', title: 'Star', description: 'star icon', priority: 80, icon: 'star' },
      { id: 'crosshair', title: 'Crosshair', description: 'crosshair icon', priority: 80, icon: 'crosshair' },
      { id: 'flame', title: 'Flame', description: 'flame icon', priority: 80, icon: 'flame' },
      { id: 'refresh', title: 'Refresh', description: 'refresh icon', priority: 80, icon: 'refresh-cw' },
      { id: 'alert', title: 'Alert', description: 'alert icon', priority: 80, icon: 'alert' },
      { id: 'trending', title: 'Trending', description: 'trending icon', priority: 80, icon: 'trending-up' },
    ];

    vi.mocked(useAdaptiveSuggestions).mockReturnValueOnce({
      statusSummary: 'Icon test',
      suggestedActions: iconActions,
    });

    // Should render without errors
    render(<AdaptiveSuggestionPanel />);
    expect(screen.getAllByTestId('action-item')).toHaveLength(11);
  });
});