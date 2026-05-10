import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { SharePromptToast } from '../SharePromptToast';
import type { SharePrompt } from '@/App';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock ShareDialog
vi.mock('@/components/ShareDialog', () => ({
  ShareDialog: vi.fn(({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    if (!open) return null;
    return (
      <div data-testid="share-dialog">
        <button data-testid="close-share-dialog" onClick={() => onOpenChange(false)}>Close</button>
      </div>
    );
  }),
}));

// Import type for SharePrompt from App
import type { SharePromptType } from '@/App';

describe('SharePromptToast', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('Rendering behavior', () => {
    it('renders nothing when prompt is null', () => {
      render(<SharePromptToast prompt={null} onDismiss={mockOnDismiss} />);
      expect(screen.queryByTestId('share-prompt-toast')).not.toBeInTheDocument();
      expect(screen.queryByText(/升级到/)).not.toBeInTheDocument();
    });

    it('renders level-up toast with correct level text', () => {
      const prompt: SharePrompt = { type: 'levelup', level: 3 };
      render(<SharePromptToast prompt={prompt} onDismiss={mockOnDismiss} />);
      // Text is broken up: "升级到 Lv." and "3" are separate elements
      expect(screen.getByText(/升级到 Lv\.3/)).toBeInTheDocument();
    });

    it('renders badge toast with badge text', () => {
      const prompt: SharePrompt = {
        type: 'badge',
        badge: { id: 'test-badge', title: 'Test Badge', description: 'Test', category: 'answer', icon: 'Star', conditionType: 'total_correct', conditionValue: 10 }
      };
      render(<SharePromptToast prompt={prompt} onDismiss={mockOnDismiss} />);
      expect(screen.getByText(/获得新成就/)).toBeInTheDocument();
    });
  });

  describe('Share button', () => {
    it('has share button with aria-label for level-up', () => {
      const prompt: SharePrompt = { type: 'levelup', level: 3 };
      render(<SharePromptToast prompt={prompt} onDismiss={mockOnDismiss} />);
      expect(screen.getByLabelText('分享')).toBeInTheDocument();
    });

    it('has share button with aria-label for badge', () => {
      const prompt: SharePrompt = {
        type: 'badge',
        badge: { id: 'test-badge', title: 'Test Badge', description: 'Test', category: 'answer', icon: 'Star', conditionType: 'total_correct', conditionValue: 10 }
      };
      render(<SharePromptToast prompt={prompt} onDismiss={mockOnDismiss} />);
      expect(screen.getByLabelText('分享')).toBeInTheDocument();
    });

    it('opens ShareDialog when share button is clicked', () => {
      const prompt: SharePrompt = { type: 'levelup', level: 3 };
      render(<SharePromptToast prompt={prompt} onDismiss={mockOnDismiss} />);

      const shareButton = screen.getByLabelText('分享');
      fireEvent.click(shareButton);

      expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss behavior', () => {
    it('calls onDismiss after 1.5 seconds', () => {
      const prompt: SharePrompt = { type: 'levelup', level: 3 };
      render(<SharePromptToast prompt={prompt} onDismiss={mockOnDismiss} />);

      expect(mockOnDismiss).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not call onDismiss before 1.5 seconds', () => {
      const prompt: SharePrompt = { type: 'levelup', level: 3 };
      render(<SharePromptToast prompt={prompt} onDismiss={mockOnDismiss} />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('only dismisses once even if timer fires multiple times', () => {
      const prompt: SharePrompt = { type: 'levelup', level: 3 };
      render(<SharePromptToast prompt={prompt} onDismiss={mockOnDismiss} />);

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast dismissal on click', () => {
    it('calls onDismiss when toast container is clicked', () => {
      const prompt: SharePrompt = { type: 'levelup', level: 3 };
      render(<SharePromptToast prompt={prompt} onDismiss={mockOnDismiss} />);

      const toast = screen.getByTestId('share-prompt-toast');
      fireEvent.click(toast);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Proper cleanup on prompt change', () => {
    it('clears previous timer when prompt changes', () => {
      const { rerender } = render(<SharePromptToast prompt={null} onDismiss={mockOnDismiss} />);

      // Set initial prompt
      rerender(<SharePromptToast prompt={{ type: 'levelup', level: 3 }} onDismiss={mockOnDismiss} />);

      // Advance time but not enough to trigger dismiss
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Change prompt - this should clear previous timer
      rerender(<SharePromptToast prompt={{ type: 'levelup', level: 4 }} onDismiss={mockOnDismiss} />);

      // Now advance past 1.5s from new prompt
      act(() => {
        vi.advanceTimersByTime(1600);
      });

      // Should only be called once for the final prompt
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });
});