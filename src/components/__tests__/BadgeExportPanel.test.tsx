import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BadgeExportPanel } from '../BadgeExportPanel';
import type { BadgeDefinition } from '@/data/types';

// Sample badge definitions for testing
const mockBadges: BadgeDefinition[] = [
  {
    id: 'first-steps',
    title: '初次尝试',
    description: '完成第一道题',
    category: 'answer',
    icon: 'Footprints',
    conditionType: 'total_answered',
    conditionValue: 1,
  },
  {
    id: 'streak-5',
    title: '连对 5 题',
    description: '连续答对 5 道题',
    category: 'streak',
    icon: 'Flame',
    conditionType: 'max_streak',
    conditionValue: 5,
  },
  {
    id: 'level-3',
    title: '等级 3',
    description: '达到等级 3',
    category: 'level',
    icon: 'Trophy',
    conditionType: 'level',
    conditionValue: 3,
  },
];

describe('BadgeExportPanel', () => {
  const mockOnClose = vi.fn();
  const mockOnExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      render(
        <BadgeExportPanel
          isOpen={false}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.queryByTestId('badge-export-panel-overlay')).toBeNull();
    });

    it('renders panel when isOpen is true', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByTestId('badge-export-panel-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('badge-export-panel-content')).toBeInTheDocument();
    });

    it('displays header with export title', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('导出成就徽章')).toBeInTheDocument();
      expect(screen.getByText('保存为图片分享给朋友')).toBeInTheDocument();
    });

    it('displays badge wall preview', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByTestId('badge-wall-preview')).toBeInTheDocument();
    });

    it('displays brand header in preview', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('en-learn 成就墙')).toBeInTheDocument();
    });

    it('displays badge count in preview', () => {
      const unlockedIds = new Set(['first-steps']);
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={unlockedIds}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('displays all badge categories', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('答题成就')).toBeInTheDocument();
      expect(screen.getByText('连击成就')).toBeInTheDocument();
      expect(screen.getByText('等级成就')).toBeInTheDocument();
    });

    it('displays all badges in preview', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByTestId('preview-badge-first-steps')).toBeInTheDocument();
      expect(screen.getByTestId('preview-badge-streak-5')).toBeInTheDocument();
      expect(screen.getByTestId('preview-badge-level-3')).toBeInTheDocument();
    });

    it('displays unlocked badges with amber styling', () => {
      const unlockedIds = new Set(['first-steps']);
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={unlockedIds}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      const badgeCard = screen.getByTestId('preview-badge-first-steps');
      expect(badgeCard).toHaveClass('border-amber-300');
    });

    it('displays locked badges with grey styling', () => {
      const unlockedIds = new Set(['first-steps']);
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={unlockedIds}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      const lockedBadge = screen.getByTestId('preview-badge-streak-5');
      expect(lockedBadge).toHaveClass('border-slate-200');
    });
  });

  describe('interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      fireEvent.click(screen.getByTestId('export-close-button'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onExport when download button is clicked', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      fireEvent.click(screen.getByTestId('export-download-button'));

      expect(mockOnExport).toHaveBeenCalledTimes(1);
      expect(mockOnExport).toHaveBeenCalledWith(expect.any(Element));
    });

    it('calls onClose when cancel button is clicked', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      fireEvent.click(screen.getByTestId('export-cancel-button'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('disables download button when isExporting is true', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={true}
        />
      );

      const downloadButton = screen.getByTestId('export-download-button');
      expect(downloadButton).toBeDisabled();
    });

    it('shows loading state text when exporting', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={true}
        />
      );

      expect(screen.getByText('导出中...')).toBeInTheDocument();
    });

    it('shows download text when not exporting', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('下载图片')).toBeInTheDocument();
    });
  });

  describe('preview content', () => {
    it('displays footer text in preview', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('持续学习，解锁更多成就')).toBeInTheDocument();
    });

    it('displays badge title in preview cards', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('初次尝试')).toBeInTheDocument();
      expect(screen.getByText('连对 5 题')).toBeInTheDocument();
      expect(screen.getByText('等级 3')).toBeInTheDocument();
    });

    it('displays current date for unlocked badges', () => {
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const unlockedIds = new Set(['first-steps']);
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={unlockedIds}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('displays progress bar for locked badges', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      // Check that progress bar exists for locked badges
      const streak5Badge = screen.getByTestId('preview-badge-streak-5');
      expect(streak5Badge.querySelector('div[style*="width: 30%"]')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty badges array', () => {
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={[]}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('0/0')).toBeInTheDocument();
    });

    it('handles all badges unlocked', () => {
      const allUnlocked = new Set(['first-steps', 'streak-5', 'level-3']);
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={mockBadges}
          unlockedIds={allUnlocked}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('3/3')).toBeInTheDocument();
    });

    it('handles single badge', () => {
      const singleBadge: BadgeDefinition[] = [mockBadges[0]];
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={singleBadge}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('0/1')).toBeInTheDocument();
      expect(screen.getAllByTestId(/preview-badge-/)).toHaveLength(1);
    });

    it('handles unknown icon names gracefully', () => {
      const badgeWithUnknownIcon: BadgeDefinition[] = [
        {
          ...mockBadges[0],
          id: 'unknown-icon',
          icon: 'UnknownIcon',
        },
      ];
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={badgeWithUnknownIcon}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByTestId('preview-badge-unknown-icon')).toBeInTheDocument();
    });

    it('handles unknown category labels', () => {
      type BadgeCategory = 'answer' | 'streak' | 'level' | 'session' | 'review' | 'challenge' | 'special';
      const badgeWithUnknownCategory: BadgeDefinition[] = [
        {
          ...mockBadges[0],
          id: 'unknown-category',
          category: 'unknown' as BadgeCategory,
        },
      ];
      render(
        <BadgeExportPanel
          isOpen={true}
          onClose={mockOnClose}
          badges={badgeWithUnknownCategory}
          unlockedIds={new Set()}
          onExport={mockOnExport}
          isExporting={false}
        />
      );

      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });
});