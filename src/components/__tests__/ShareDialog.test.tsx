import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ShareDialog } from '../ShareDialog';

// Mock global alert
const mockAlert = vi.fn();
vi.stubGlobal('alert', mockAlert);

// Mock shadcn UI Dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: vi.fn(({ open, children }: { open: boolean; children: React.ReactNode }) => (
    open ? <div data-testid="dialog">{children}</div> : null
  )),
  DialogContent: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  )),
  DialogHeader: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  )),
  DialogTitle: vi.fn(({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  )),
  DialogDescription: vi.fn(({ children }: { children: React.ReactNode }) => (
    <p data-testid="dialog-description">{children}</p>
  )),
  DialogFooter: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  )),
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button data-testid="button" onClick={onClick} {...props}>{children}</button>
  )),
}));

// Mock ShareCard component
vi.mock('../ShareCard', () => ({
  ShareCard: vi.fn(({ data }: { data: unknown }) => (
    <div data-testid="share-card">
      <span data-testid="share-card-level">Lv.{(data as { xp: { currentLevel: number } }).xp.currentLevel}</span>
      <span data-testid="share-card-xp">{(data as { xp: { totalXP: number } }).xp.totalXP} XP</span>
    </div>
  )),
}));

// Mock useShareCardData hook
const mockShareCardData = {
  xp: {
    totalXP: 750,
    currentLevel: 5,
    levelProgress: 65,
  },
  session: {
    score: 120,
    accuracy: 0.85,
    streak: 10,
  },
  badges: [
    { id: 'streak-5', icon: 'Flame' },
    { id: 'perfect-10', icon: 'Star' },
  ],
  rank: 3,
  appName: 'en-learn',
};

// Track the session result passed to the hook
let capturedSessionResult: { score: number; accuracy: number; streak: number } | undefined;

vi.mock('@/hooks/useShareCardData', () => ({
  useShareCardData: vi.fn((sessionResult?: { score: number; accuracy: number; streak: number }) => {
    capturedSessionResult = sessionResult;
    return mockShareCardData;
  }),
}));

// Import the mocked module reference for test assertions
import { useShareCardData } from '@/hooks/useShareCardData';

describe('ShareDialog', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockAlert.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Dialog rendering', () => {
    it('renders ShareCard when dialog is open', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByTestId('share-card')).toBeInTheDocument();
    });

    it('does not render when dialog is closed', () => {
      render(
        <ShareDialog
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog with correct structure', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-footer')).toBeInTheDocument();
    });
  });

  describe('Dialog title and description', () => {
    it('shows correct dialog title', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('分享你的成绩');
    });

    it('shows correct dialog description', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByTestId('dialog-description')).toHaveTextContent(
        '查看你的学习成果并分享给朋友'
      );
    });
  });

  describe('Share action buttons', () => {
    it('has two share action buttons', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const buttons = screen.getAllByTestId('button');
      expect(buttons).toHaveLength(2);
    });

    it('has "复制文本" button with outline variant', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const copyButton = screen.getByRole('button', { name: '复制文本' });
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveAttribute('variant', 'outline');
    });

    it('has "生成分享图片" button', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const imageButton = screen.getByRole('button', { name: '生成分享图片' });
      expect(imageButton).toBeInTheDocument();
    });

    it('buttons have flex-1 class for layout', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const buttons = screen.getAllByTestId('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('flex-1');
      });
    });
  });

  describe('Button click handlers', () => {
    it('calls alert when "复制文本" button is clicked', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const copyButton = screen.getByRole('button', { name: '复制文本' });
      fireEvent.click(copyButton);

      expect(mockAlert).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledWith('文本复制功能将在 iter-002 中实现');
    });

    it('calls alert when "生成分享图片" button is clicked', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const imageButton = screen.getByRole('button', { name: '生成分享图片' });
      fireEvent.click(imageButton);

      expect(mockAlert).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledWith('图片分享功能将在 iter-002 中实现');
    });

    it('does not call onOpenChange when share buttons are clicked', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const copyButton = screen.getByRole('button', { name: '复制文本' });
      fireEvent.click(copyButton);

      const imageButton = screen.getByRole('button', { name: '生成分享图片' });
      fireEvent.click(imageButton);

      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Dialog close behavior', () => {
    it('renders dialog with onOpenChange handler', () => {
      const mockOnOpenChangeCustom = vi.fn();

      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChangeCustom}
        />
      );

      // Verify the dialog receives the onOpenChange handler by checking
      // the rendered output is correct (dialog should be visible)
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  describe('Session result handling', () => {
    it('passes sessionResult to useShareCardData hook', () => {
      const sessionResult = {
        score: 150,
        accuracy: 0.9,
        streak: 15,
      };

      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          sessionResult={sessionResult}
        />
      );

      // Verify the hook was called with the session result
      expect(useShareCardData).toHaveBeenCalledWith(sessionResult);
      expect(capturedSessionResult).toEqual(sessionResult);
    });

    it('uses useShareCardData hook to aggregate data for ShareCard', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Verify the hook was called
      expect(useShareCardData).toHaveBeenCalled();
    });
  });

  describe('ShareCard data display', () => {
    it('passes correct data to ShareCard from hook', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByTestId('share-card-level')).toHaveTextContent('Lv.5');
      expect(screen.getByTestId('share-card-xp')).toHaveTextContent('750 XP');
    });
  });
});
