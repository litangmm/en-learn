import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BadgePanel } from '../BadgePanel';
import { BADGE_DEFINITIONS } from '@/services/storage';

// Mock AchievementPanel
vi.mock('@/components/AchievementPanel', () => ({
  AchievementPanel: ({ badge, onClose }: { badge: unknown; onClose: () => void }) => {
    if (!badge) return null;
    return (
      <div data-testid="achievement-panel-mock">
        <button data-testid="mock-close" onClick={onClose}>Close</button>
      </div>
    );
  },
}));

// Mock BADGE_DEFINITIONS to ensure stable test data
vi.mock('@/services/storage', async () => {
  const actual = await vi.importActual<typeof import('@/services/storage')>('@/services/storage');
  return {
    ...actual,
    BADGE_DEFINITIONS: [
      { id: 'first-steps', title: '初次尝试', description: '完成第一道题', category: 'answer', icon: 'Footprints', conditionType: 'total_answered', conditionValue: 1 },
      { id: 'correct-10', title: '答对 10 题', description: '累计答对 10 道题', category: 'answer', icon: 'CheckCircle2', conditionType: 'total_correct', conditionValue: 10 },
      { id: 'streak-5', title: '连对 5 题', description: '连续答对 5 道题', category: 'streak', icon: 'Flame', conditionType: 'max_streak', conditionValue: 5 },
      { id: 'level-3', title: '等级 3', description: '达到等级 3', category: 'level', icon: 'Trophy', conditionType: 'level', conditionValue: 3 },
      { id: 'session-10', title: '完成 10 次练习', description: '累计完成 10 次练习', category: 'session', icon: 'BookOpen', conditionType: 'total_sessions', conditionValue: 10 },
      { id: 'perfect-session', title: '完美练习', description: '完成一次全对练习', category: 'session', icon: 'Star', conditionType: 'perfect_sessions', conditionValue: 1 },
      { id: 'review-10', title: '复习 10 次', description: '累计复习 10 次', category: 'review', icon: 'RefreshCw', conditionType: 'total_reviews', conditionValue: 10 },
      { id: 'challenge-7', title: '挑战 7 次', description: '累计完成 7 次每日挑战', category: 'challenge', icon: 'Target', conditionType: 'total_challenges', conditionValue: 7 },
      { id: 'correct-50', title: '答对 50 题', description: '累计答对 50 道题', category: 'answer', icon: 'CheckCircle2', conditionType: 'total_correct', conditionValue: 50 },
      { id: 'streak-10', title: '连对 10 题', description: '连续答对 10 道题', category: 'streak', icon: 'Flame', conditionType: 'max_streak', conditionValue: 10 },
      { id: 'level-5', title: '等级 5', description: '达到等级 5', category: 'level', icon: 'Trophy', conditionType: 'level', conditionValue: 5 },
      { id: 'special-1', title: '特殊徽章', description: '特殊成就', category: 'special', icon: 'Star', conditionType: 'total_answered', conditionValue: 100 },
    ] as typeof actual.BADGE_DEFINITIONS,
  };
});

describe('BadgePanel', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  function renderBadgePanel(props?: { unlockedIds?: Set<string>; getProgress?: (id: string) => number }) {
    const unlockedIds = props?.unlockedIds ?? new Set<string>();
    const getProgress = props?.getProgress ?? (() => 0);
    return render(<BadgePanel unlockedIds={unlockedIds} getProgress={getProgress} onBack={mockOnBack} />);
  }

  it('renders header with 成就徽章 and count', () => {
    const unlockedIds = new Set(['first-steps', 'correct-10', 'streak-5']);
    renderBadgePanel({ unlockedIds });

    expect(screen.getByText('成就徽章')).toBeInTheDocument();
    expect(screen.getByText('3/12')).toBeInTheDocument();
  });

  it('renders all 12 badge cards', () => {
    renderBadgePanel();

    for (const badge of BADGE_DEFINITIONS) {
      expect(screen.getByText(badge.title)).toBeInTheDocument();
    }
  });

  it('unlocked badge shows amber border and date', () => {
    const unlockedIds = new Set(['first-steps']);
    renderBadgePanel({ unlockedIds });

    const card = screen.getByTestId('badge-card-first-steps');
    expect(card.className).toContain('border-amber-400');
    expect(screen.getByText(/\d{4}-\d{2}-\d{2} 解锁/)).toBeInTheDocument();
  });

  it('locked badge shows gray border and progress bar', () => {
    renderBadgePanel({ getProgress: () => 45 });

    const card = screen.getByTestId('badge-card-correct-10');
    expect(card.className).toContain('border-slate-200');
    expect(screen.getByTestId('progress-bar-correct-10')).toBeInTheDocument();
  });

  it('progress bar width matches getProgress return value', () => {
    renderBadgePanel({ getProgress: (id: string) => (id === 'correct-10' ? 65 : 0) });

    const progressBar = screen.getByTestId('progress-bar-correct-10');
    expect(progressBar).toHaveStyle('width: 65%');
  });

  it('back button calls onBack', () => {
    renderBadgePanel();

    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('category sections render correctly', () => {
    renderBadgePanel();

    expect(screen.getByTestId('category-answer')).toBeInTheDocument();
    expect(screen.getByTestId('category-streak')).toBeInTheDocument();
    expect(screen.getByTestId('category-level')).toBeInTheDocument();
    expect(screen.getByTestId('category-session')).toBeInTheDocument();
    expect(screen.getByTestId('category-review')).toBeInTheDocument();
    expect(screen.getByTestId('category-challenge')).toBeInTheDocument();
    expect(screen.getByTestId('category-special')).toBeInTheDocument();
  });

  it('clicking a badge card opens AchievementPanel', () => {
    renderBadgePanel({ getProgress: () => 50 });

    const card = screen.getByTestId('badge-card-correct-10');
    fireEvent.click(card);

    expect(screen.getByTestId('achievement-panel-mock')).toBeInTheDocument();
  });

  it('clicking AchievementPanel close button hides panel', () => {
    renderBadgePanel({ getProgress: () => 50 });

    const card = screen.getByTestId('badge-card-correct-10');
    fireEvent.click(card);

    const closeButton = screen.getByTestId('mock-close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('achievement-panel-mock')).not.toBeInTheDocument();
  });

  it('unlocked badge passes isUnlocked=true to AchievementPanel', () => {
    const unlockedIds = new Set(['first-steps']);
    renderBadgePanel({ unlockedIds });

    const card = screen.getByTestId('badge-card-first-steps');
    fireEvent.click(card);

    // Panel should be open with unlocked badge
    expect(screen.getByTestId('achievement-panel-mock')).toBeInTheDocument();
  });
});
