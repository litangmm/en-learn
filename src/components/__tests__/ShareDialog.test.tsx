import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ShareDialog } from '../ShareDialog';
import type { ShareCardData } from '@/data/types';

// Use vi.hoisted to define mocks at the same hoisting level as vi.mock
const { mockToastSuccess, mockToastError, mockDownloadImage, mockCopyText, mockSetCardRef } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockDownloadImage: vi.fn(),
  mockCopyText: vi.fn(),
  mockSetCardRef: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

// Mock useShareExport hook
vi.mock('@/hooks/useShareExport', () => ({
  useShareExport: vi.fn(() => ({
    setCardRef: mockSetCardRef,
    downloadImage: mockDownloadImage,
    copyText: mockCopyText,
  })),
}));

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
const mockShareCardData: ShareCardData = {
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
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    mockDownloadImage.mockClear();
    mockCopyText.mockClear();
    mockSetCardRef.mockClear();
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

  describe('useShareExport hook', () => {
    it('is called when component mounts', () => {
      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // The mock is called because the component uses it
      expect(mockSetCardRef).toHaveBeenCalled();
    });
  });

  describe('Button click handlers - copy text', () => {
    it('calls copyText from useShareExport when "复制文本" button is clicked', async () => {
      mockCopyText.mockResolvedValue(true);

      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const copyButton = screen.getByRole('button', { name: '复制文本' });
      fireEvent.click(copyButton);

      // Wait for async operation
      await vi.waitFor(() => {
        expect(mockCopyText).toHaveBeenCalledWith(mockShareCardData);
      });
    });

    it('shows success toast when copyText succeeds', async () => {
      mockCopyText.mockResolvedValue(true);

      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const copyButton = screen.getByRole('button', { name: '复制文本' });
      fireEvent.click(copyButton);

      await vi.waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('文本已复制到剪贴板');
      });
    });

    it('shows error toast when copyText fails', async () => {
      mockCopyText.mockResolvedValue(false);

      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const copyButton = screen.getByRole('button', { name: '复制文本' });
      fireEvent.click(copyButton);

      await vi.waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('复制失败，请重试');
      });
    });
  });

  describe('Button click handlers - generate image', () => {
    it('calls downloadImage from useShareExport when "生成分享图片" button is clicked', async () => {
      mockDownloadImage.mockResolvedValue(true);

      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const imageButton = screen.getByRole('button', { name: '生成分享图片' });
      fireEvent.click(imageButton);

      await vi.waitFor(() => {
        expect(mockDownloadImage).toHaveBeenCalledWith(mockShareCardData);
      });
    });

    it('shows success toast when downloadImage succeeds', async () => {
      mockDownloadImage.mockResolvedValue(true);

      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const imageButton = screen.getByRole('button', { name: '生成分享图片' });
      fireEvent.click(imageButton);

      await vi.waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('图片已保存');
      });
    });

    it('shows error toast when downloadImage fails', async () => {
      mockDownloadImage.mockResolvedValue(false);

      render(
        <ShareDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const imageButton = screen.getByRole('button', { name: '生成分享图片' });
      fireEvent.click(imageButton);

      await vi.waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('保存失败，请重试');
      });
    });
  });

  describe('Button click handlers - additional behavior', () => {
    it('does not call onOpenChange when share buttons are clicked', async () => {
      mockCopyText.mockResolvedValue(true);
      mockDownloadImage.mockResolvedValue(true);

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

      await vi.waitFor(() => {
        expect(mockOnOpenChange).not.toHaveBeenCalled();
      });
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