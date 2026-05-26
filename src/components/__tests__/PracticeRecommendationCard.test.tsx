import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeRecommendationCard } from '../PracticeRecommendationCard';
import type { PracticeRecommendation } from '@/data/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => (
    <svg data-testid="x-icon" className={className} />
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <svg data-testid="alert-icon" className={className} />
  ),
  Clock: ({ className }: { className?: string }) => (
    <svg data-testid="clock-icon" className={className} />
  ),
  BookOpen: ({ className }: { className?: string }) => (
    <svg data-testid="book-icon" className={className} />
  ),
  Target: ({ className }: { className?: string }) => (
    <svg data-testid="target-icon" className={className} />
  ),
  Sparkles: ({ className }: { className?: string }) => (
    <svg data-testid="sparkles-icon" className={className} />
  ),
}));

describe('PracticeRecommendationCard', () => {
  const mockRecommendation: PracticeRecommendation = {
    id: 'rec-1',
    type: 'high-error',
    priority: 1,
    reason: '这道题您已答错3次，属于高频错误，需要重点复习',
    targetSentenceId: 'sent-1',
    action: '重点练习这个句型',
  };

  const mockOnDismiss = vi.fn();
  const mockOnStartPractice = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the recommendation reason text', () => {
      render(
        <PracticeRecommendationCard
          recommendation={mockRecommendation}
          onDismiss={mockOnDismiss}
          onStartPractice={mockOnStartPractice}
        />
      );

      expect(screen.getByText('这道题您已答错3次，属于高频错误，需要重点复习')).toBeInTheDocument();
    });

    it('renders the action button text', () => {
      render(
        <PracticeRecommendationCard
          recommendation={mockRecommendation}
          onDismiss={mockOnDismiss}
          onStartPractice={mockOnStartPractice}
        />
      );

      expect(screen.getByText('重点练习这个句型')).toBeInTheDocument();
    });

    it('renders the title badge for high-error type', () => {
      render(
        <PracticeRecommendationCard
          recommendation={mockRecommendation}
          onDismiss={mockOnDismiss}
          onStartPractice={mockOnStartPractice}
        />
      );

      expect(screen.getByText('高频错误')).toBeInTheDocument();
    });

    it('renders correct title for neglected-review type', () => {
      const neglectedReviewRec: PracticeRecommendation = {
        ...mockRecommendation,
        id: 'rec-2',
        type: 'neglected-review',
        reason: '这道题已经7天没有复习了',
        action: '巩固复习',
      };

      render(
        <PracticeRecommendationCard
          recommendation={neglectedReviewRec}
          onDismiss={mockOnDismiss}
          onStartPractice={mockOnStartPractice}
        />
      );

      expect(screen.getByText('久未复习')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onDismiss when dismiss button is clicked', () => {
      render(
        <PracticeRecommendationCard
          recommendation={mockRecommendation}
          onDismiss={mockOnDismiss}
          onStartPractice={mockOnStartPractice}
        />
      );

      const dismissButton = screen.getByRole('button', { name: '关闭' });
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledWith('rec-1');
    });

    it('calls onStartPractice when action button is clicked', () => {
      render(
        <PracticeRecommendationCard
          recommendation={mockRecommendation}
          onDismiss={mockOnDismiss}
          onStartPractice={mockOnStartPractice}
        />
      );

      const actionButton = screen.getByRole('button', { name: '重点练习这个句型' });
      fireEvent.click(actionButton);

      expect(mockOnStartPractice).toHaveBeenCalledWith(mockRecommendation);
    });
  });

  describe('Dismiss logic', () => {
    it('passes correct id to onDismiss callback', () => {
      const recommendationWithCustomId: PracticeRecommendation = {
        ...mockRecommendation,
        id: 'custom-id-123',
      };

      render(
        <PracticeRecommendationCard
          recommendation={recommendationWithCustomId}
          onDismiss={mockOnDismiss}
          onStartPractice={mockOnStartPractice}
        />
      );

      const dismissButton = screen.getByRole('button', { name: '关闭' });
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledWith('custom-id-123');
    });
  });
});