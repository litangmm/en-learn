import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AchievementMomentCard } from '../AchievementMomentCard';
import type { AchievementMoment } from '@/data/types';

// Mock ShareDialog component
vi.mock('../ShareDialog', () => ({
  ShareDialog: vi.fn(({ open, onOpenChange, triggerType }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    triggerType?: string;
  }) => (
    open ? (
      <div data-testid="share-dialog" data-trigger-type={triggerType}>
        <button data-testid="dialog-close" onClick={() => onOpenChange(false)}>
          关闭
        </button>
      </div>
    ) : null
  )),
}));

// Mock framer-motion for animation testing
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
  AnimatePresence: vi.fn(({ children }) => children),
}));

// Helper to create a moment with all required fields
function createMoment(overrides: Partial<AchievementMoment> & { type: AchievementMoment['type'] }): AchievementMoment {
  return {
    id: 'test-moment-1',
    title: 'Test Achievement',
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('AchievementMomentCard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Template rendering', () => {
    it('renders badge-unlock template with purple/pink gradient', () => {
      const moment = createMoment({
        type: 'badge-unlock',
        title: '解锁成就: 新手入门',
        badgeTitle: '新手入门',
        badgeIcon: 'Trophy',
      });

      render(<AchievementMomentCard moment={moment} />);

      // Should have gradient class
      const card = screen.getByTestId('achievement-moment-card');
      expect(card.querySelector('.from-purple-500')).toBeInTheDocument();

      // Should display title
      expect(screen.getByText('解锁成就: 新手入门')).toBeInTheDocument();

      // Should display badge info
      expect(screen.getByText('新手入门')).toBeInTheDocument();
      expect(screen.getByText('成就已解锁')).toBeInTheDocument();
    });

    it('renders level-up template with amber/orange gradient and level badge', () => {
      const moment = createMoment({
        type: 'level-up',
        title: '恭喜升级到 Lv.5！',
        level: 5,
        subtitle: '继续加油，下一等级还需 350 XP',
      });

      render(<AchievementMomentCard moment={moment} />);

      const card = screen.getByTestId('achievement-moment-card');
      expect(card.querySelector('.from-amber-400')).toBeInTheDocument();

      // Level display
      expect(screen.getByText('Lv.5')).toBeInTheDocument();
      expect(screen.getByText('等级提升')).toBeInTheDocument();
    });

    it('renders streak-milestone template with orange/amber gradient and streak stats', () => {
      const moment = createMoment({
        type: 'streak-milestone',
        title: '🔥 连续学习 7 天！',
        streak: 7,
        subtitle: '一周坚持，继续加油！',
      });

      render(<AchievementMomentCard moment={moment} />);

      const card = screen.getByTestId('achievement-moment-card');
      expect(card.querySelector('.from-orange-400')).toBeInTheDocument();

      // Streak display
      expect(screen.getByText('7 天')).toBeInTheDocument();
      expect(screen.getByText('连续学习')).toBeInTheDocument();
    });

    it('renders xp-milestone template with blue/teal gradient and XP stats', () => {
      const moment = createMoment({
        type: 'xp-milestone',
        title: '积累 1,000 XP，里程碑达成！',
        xp: 1000,
        totalCorrect: 250,
        subtitle: '已解答 250 道题，正确率 85%',
      });

      render(<AchievementMomentCard moment={moment} />);

      const card = screen.getByTestId('achievement-moment-card');
      expect(card.querySelector('.from-blue-400')).toBeInTheDocument();

      // XP and total correct display
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('XP')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('答对')).toBeInTheDocument();
    });

    it('renders perfect-session template with green/emerald gradient and stats', () => {
      const moment = createMoment({
        type: 'perfect-session',
        title: '满分答完一轮练习！',
        accuracy: 100,
        streak: 15,
        subtitle: '10/10 正确率，15 连击',
      });

      render(<AchievementMomentCard moment={moment} />);

      const card = screen.getByTestId('achievement-moment-card');
      expect(card.querySelector('.from-emerald-400')).toBeInTheDocument();

      // Perfect accuracy display
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('正确率')).toBeInTheDocument();

      // Streak display
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('连击')).toBeInTheDocument();
    });
  });

  describe('Share functionality', () => {
    it('opens ShareDialog when share button is clicked', () => {
      const moment = createMoment({
        type: 'badge-unlock',
        title: '解锁成就',
        badgeTitle: '新成就',
      });

      render(<AchievementMomentCard moment={moment} />);

      // Click share button
      const shareButton = screen.getByTestId('achievement-share-button');
      fireEvent.click(shareButton);

      // ShareDialog should be visible
      expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
    });

    it('passes correct triggerType to ShareDialog', () => {
      const moment = createMoment({
        type: 'level-up',
        title: '升级到 Lv.3',
        level: 3,
      });

      render(<AchievementMomentCard moment={moment} />);

      // Click share button
      const shareButton = screen.getByTestId('achievement-share-button');
      fireEvent.click(shareButton);

      // Verify trigger type includes the moment type
      const dialog = screen.getByTestId('share-dialog');
      expect(dialog.getAttribute('data-trigger-type')).toBe('achievement-level-up');
    });

    it('share button has correct aria-label', () => {
      const moment = createMoment({
        type: 'streak-milestone',
        title: '连续学习 30 天',
        streak: 30,
      });

      render(<AchievementMomentCard moment={moment} />);

      const shareButton = screen.getByTestId('achievement-share-button');
      expect(shareButton).toHaveAttribute('aria-label', '分享成就');
    });
  });

  describe('Animation and re-mount behavior', () => {
    it('has data-testid for identification', () => {
      const moment = createMoment({
        type: 'badge-unlock',
        title: 'Test',
      });

      render(<AchievementMomentCard moment={moment} />);

      expect(screen.getByTestId('achievement-moment-card')).toBeInTheDocument();
    });

    it('renders with triggerKey prop', () => {
      const moment = createMoment({
        type: 'xp-milestone',
        title: 'XP 里程碑',
        xp: 500,
      });

      render(
        <AchievementMomentCard moment={moment} triggerKey="unique-key-123" />
      );

      // Component should render without error
      expect(screen.getByTestId('achievement-moment-card')).toBeInTheDocument();
    });

    it('re-renders with different triggerKey', () => {
      const moment1 = createMoment({
        id: 'moment-1',
        type: 'badge-unlock',
        title: 'First Achievement',
      });
      const moment2 = createMoment({
        id: 'moment-1',
        type: 'badge-unlock',
        title: 'First Achievement',
      });

      const { rerender } = render(
        <AchievementMomentCard moment={moment1} triggerKey="key-1" />
      );

      expect(screen.getByText('First Achievement')).toBeInTheDocument();

      // Rerender with different triggerKey
      rerender(<AchievementMomentCard moment={moment2} triggerKey="key-2" />);

      expect(screen.getByText('First Achievement')).toBeInTheDocument();
    });
  });

  describe('Fallback template behavior', () => {
    it('falls back to badge-unlock template for unknown type', () => {
      const moment = createMoment({
        type: 'invalid-type' as AchievementMoment['type'],
        title: 'Unknown Achievement',
      });

      render(<AchievementMomentCard moment={moment} />);

      // Should fall back to badge-unlock gradient
      const card = screen.getByTestId('achievement-moment-card');
      expect(card.querySelector('.from-purple-500')).toBeInTheDocument();
    });

    it('renders subtitle when present', () => {
      const moment = createMoment({
        type: 'level-up',
        title: '升级到 Lv.5',
        level: 5,
        subtitle: '继续加油！',
      });

      render(<AchievementMomentCard moment={moment} />);

      expect(screen.getByText('继续加油！')).toBeInTheDocument();
    });

    it('hides content area when not applicable to template type', () => {
      // Badge unlock without badge info
      const moment = createMoment({
        type: 'badge-unlock',
        title: 'Badge Unlock',
        badgeTitle: undefined,
      });

      render(<AchievementMomentCard moment={moment} />);

      // Component should still render
      expect(screen.getByTestId('achievement-moment-card')).toBeInTheDocument();
    });
  });

  describe('Emoji and icon display', () => {
    it('displays emoji badge for each template type', () => {
      const templates: AchievementMoment['type'][] = [
        'badge-unlock',
        'level-up',
        'streak-milestone',
        'xp-milestone',
        'perfect-session',
      ];
      const emojis = ['🎖️', '🏆', '🔥', '🎯', '⭐'];

      templates.forEach((type, index) => {
        const moment = createMoment({ type, title: `Test ${type}` });
        render(<AchievementMomentCard moment={moment} />);
        expect(screen.getByText(emojis[index])).toBeInTheDocument();
        cleanup();
      });
    });
  });
});
