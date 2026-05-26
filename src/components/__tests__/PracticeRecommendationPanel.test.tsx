import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeRecommendationPanel } from '../PracticeRecommendationPanel';
import type { PracticeRecommendation } from '@/data/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Lightbulb: ({ className }: { className?: string }) => (
    <svg data-testid="lightbulb-icon" className={className} />
  ),
  Sparkles: ({ className }: { className?: string }) => (
    <svg data-testid="sparkles-icon" className={className} />
  ),
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
}));

describe('PracticeRecommendationPanel', () => {
  const mockRecommendations: PracticeRecommendation[] = [
    {
      id: 'rec-1',
      type: 'high-error',
      priority: 1,
      reason: '这道题您已答错3次，属于高频错误',
      targetSentenceId: 'sent-1',
      action: '重点练习',
    },
    {
      id: 'rec-2',
      type: 'neglected-review',
      priority: 2,
      reason: '这道题已经7天没有复习了',
      targetSentenceId: 'sent-2',
      action: '巩固复习',
    },
  ];

  const mockOnStartPractice = vi.fn();
  const mockOnDismissRecommendation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the panel header "智能推荐"', () => {
      render(
        <PracticeRecommendationPanel
          recommendations={mockRecommendations}
          onStartPractice={mockOnStartPractice}
          onDismissRecommendation={mockOnDismissRecommendation}
        />
      );

      expect(screen.getByText('智能推荐')).toBeInTheDocument();
    });

    it('renders multiple recommendation cards when provided', () => {
      render(
        <PracticeRecommendationPanel
          recommendations={mockRecommendations}
          onStartPractice={mockOnStartPractice}
          onDismissRecommendation={mockOnDismissRecommendation}
        />
      );

      expect(screen.getByText('这道题您已答错3次，属于高频错误')).toBeInTheDocument();
      expect(screen.getByText('这道题已经7天没有复习了')).toBeInTheDocument();
    });

    it('renders empty state when no recommendations provided', () => {
      render(
        <PracticeRecommendationPanel
          recommendations={[]}
          onStartPractice={mockOnStartPractice}
          onDismissRecommendation={mockOnDismissRecommendation}
        />
      );

      expect(screen.getByText('暂时没有推荐内容')).toBeInTheDocument();
      expect(screen.getByText('完成更多练习后将为您生成个性化推荐')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('renders the main "开始练习" button when recommendations exist', () => {
      render(
        <PracticeRecommendationPanel
          recommendations={mockRecommendations}
          onStartPractice={mockOnStartPractice}
          onDismissRecommendation={mockOnDismissRecommendation}
        />
      );

      const startButton = screen.getByRole('button', { name: /开始练习/i });
      expect(startButton).toBeInTheDocument();
    });

    it('calls onStartPractice with first recommendation when main button is clicked', () => {
      render(
        <PracticeRecommendationPanel
          recommendations={mockRecommendations}
          onStartPractice={mockOnStartPractice}
          onDismissRecommendation={mockOnDismissRecommendation}
        />
      );

      const startButton = screen.getByRole('button', { name: /开始练习/i });
      fireEvent.click(startButton);

      expect(mockOnStartPractice).toHaveBeenCalledWith(mockRecommendations[0]);
    });

    it('does not render main start button in empty state', () => {
      render(
        <PracticeRecommendationPanel
          recommendations={[]}
          onStartPractice={mockOnStartPractice}
          onDismissRecommendation={mockOnDismissRecommendation}
        />
      );

      const startButton = screen.queryByRole('button', { name: /开始练习/i });
      expect(startButton).not.toBeInTheDocument();
    });
  });

  describe('Dismiss', () => {
    it('renders dismiss buttons on individual cards', () => {
      render(
        <PracticeRecommendationPanel
          recommendations={mockRecommendations}
          onStartPractice={mockOnStartPractice}
          onDismissRecommendation={mockOnDismissRecommendation}
        />
      );

      // Each card should have a dismiss button
      const dismissButtons = screen.getAllByRole('button', { name: '关闭' });
      expect(dismissButtons.length).toBe(mockRecommendations.length);
    });

    it('individual card dismiss is passed through to onDismissRecommendation', () => {
      render(
        <PracticeRecommendationPanel
          recommendations={mockRecommendations}
          onStartPractice={mockOnStartPractice}
          onDismissRecommendation={mockOnDismissRecommendation}
        />
      );

      // Click the first dismiss button
      const dismissButtons = screen.getAllByRole('button', { name: '关闭' });
      fireEvent.click(dismissButtons[0]);

      expect(mockOnDismissRecommendation).toHaveBeenCalledWith('rec-1');
    });
  });
});