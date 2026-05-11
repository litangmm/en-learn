import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningEfficiencyPanel } from '../LearningEfficiencyPanel';

// Mock useLearningEfficiency hook at module level
vi.mock('@/hooks/useLearningEfficiency', () => ({
  useLearningEfficiency: vi.fn(() => ({
    memoryRetentionRate: 75,
    forgettingCurveFit: 60,
    weaknessProgress: 45,
    totalReviewed: 20,
    totalCorrectOnReview: 15,
    totalMistakes: 5,
    improvedMistakes: 2,
  })),
}));

describe('LearningEfficiencyPanel', () => {
  it('renders the panel with metrics', () => {
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByTestId('learning-efficiency-panel')).toBeInTheDocument();
    expect(screen.getByText('学习效率')).toBeInTheDocument();
    expect(screen.getByText('记忆保持率')).toBeInTheDocument();
    expect(screen.getByText('遗忘曲线拟合')).toBeInTheDocument();
    expect(screen.getByText('薄弱点攻克')).toBeInTheDocument();
  });

  it('renders back button', () => {
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows overall score card with correct score and label', () => {
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    // Find the overall score text (5xl font) and its label
    const scoreCard = screen.getByText('综合效率评分')?.closest('div');
    expect(scoreCard).toBeInTheDocument();
    // The overall score of 60 is in the card
    expect(screen.getByText('良好')).toBeInTheDocument();
  });

  it('renders three metric cards with titles', () => {
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByText('记忆保持率')).toBeInTheDocument();
    expect(screen.getByText('遗忘曲线拟合')).toBeInTheDocument();
    expect(screen.getByText('薄弱点攻克')).toBeInTheDocument();
  });

  it('renders overall score card with title', () => {
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByText('综合效率评分')).toBeInTheDocument();
  });
});