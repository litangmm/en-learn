import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LearningEfficiencyPanel } from '../LearningEfficiencyPanel';
import { useLearningEfficiency } from '@/hooks/useLearningEfficiency';
import type { LearningEfficiencyMetrics } from '@/hooks/useLearningEfficiency';

const defaultMockMetrics: LearningEfficiencyMetrics = {
  memoryRetentionRate: 75,
  forgettingCurveFit: 60,
  weaknessProgress: 45,
  totalReviewed: 20,
  totalCorrectOnReview: 15,
  totalMistakes: 5,
  improvedMistakes: 2,
};

// Mock useLearningEfficiency hook at module level
// Note: vi.mock is hoisted to top of file, so we use vi.fn() inline
vi.mock('@/hooks/useLearningEfficiency', () => ({
  useLearningEfficiency: vi.fn(() => defaultMockMetrics),
}));

describe('LearningEfficiencyPanel', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    // Reset to default metrics before each test
    vi.mocked(useLearningEfficiency).mockReturnValue(defaultMockMetrics);
  });

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

  it('displays metric values in cards', () => {
    const mockOnBack = vi.fn();
    const { container } = render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    // Each card shows its metric value - look for values in the card spans
    const valueSpans = container.querySelectorAll('span.text-2xl');
    expect(valueSpans[0].textContent).toBe('75'); // memoryRetentionRate
    expect(valueSpans[1].textContent).toBe('60'); // forgettingCurveFit
    expect(valueSpans[2].textContent).toBe('45'); // weaknessProgress
  });

  it('displays subtitle with correct data', () => {
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByText(/15\/20 次复习正确/)).toBeInTheDocument();
    expect(screen.getByText(/2\/5 个改善/)).toBeInTheDocument();
  });

  it('shows empty state when no reviews', () => {
    vi.mocked(useLearningEfficiency).mockReturnValueOnce({
      memoryRetentionRate: 0,
      forgettingCurveFit: 0,
      weaknessProgress: 100,
      totalReviewed: 0,
      totalCorrectOnReview: 0,
      totalMistakes: 0,
      improvedMistakes: 0,
    });
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByText('开始复习后，这里会显示你的学习效率数据')).toBeInTheDocument();
  });

  it('renders tips section', () => {
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByText('如何提高效率')).toBeInTheDocument();
    expect(screen.getByText(/按时复习到期题目/)).toBeInTheDocument();
    expect(screen.getByText(/薄弱点要多次练习/)).toBeInTheDocument();
    expect(screen.getByText(/保持稳定的复习节奏/)).toBeInTheDocument();
  });

  it('renders progress bars for each metric', () => {
    const mockOnBack = vi.fn();
    const { container } = render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    // Each card has a progress bar
    const progressBars = container.querySelectorAll('.h-2.bg-slate-100');
    expect(progressBars).toHaveLength(3);
  });

  it('shows score label based on overall score', () => {
    vi.mocked(useLearningEfficiency).mockReturnValueOnce({
      memoryRetentionRate: 90,
      forgettingCurveFit: 85,
      weaknessProgress: 80,
      totalReviewed: 100,
      totalCorrectOnReview: 90,
      totalMistakes: 10,
      improvedMistakes: 8,
    });
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    // Overall score should be 85 (avg of 90, 85, 80) -> "优秀"
    expect(screen.getByText('优秀')).toBeInTheDocument();
  });

  it('shows "需加强" for low scores', () => {
    vi.mocked(useLearningEfficiency).mockReturnValueOnce({
      memoryRetentionRate: 20,
      forgettingCurveFit: 15,
      weaknessProgress: 10,
      totalReviewed: 50,
      totalCorrectOnReview: 5,
      totalMistakes: 10,
      improvedMistakes: 1,
    });
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    // Overall score should be ~15 (avg of 20, 15, 10) -> "需加强"
    expect(screen.getByText('需加强')).toBeInTheDocument();
  });

  it('displays total reviewed count in score card', () => {
    const mockOnBack = vi.fn();
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByText(/基于 20 次复习数据/)).toBeInTheDocument();
  });
});
