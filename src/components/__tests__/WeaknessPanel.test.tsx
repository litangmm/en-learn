import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeaknessPanel } from '../WeaknessPanel';

// Mock child dependencies
vi.mock('@/hooks/useWeaknessStats', () => ({
  useWeaknessStats: vi.fn(() => ({
    stats: {
      totalWeakCount: 0,
      byDictionary: {},
      byType: { 'high-error': 0, 'low-accuracy': 0, 'review-neglected': 0, 'mode-weak': 0 },
      overallStrength: 100,
    },
    refresh: vi.fn(),
    getAllWeaknesses: vi.fn(() => []),
    getByDictionary: vi.fn(() => []),
  })),
}));

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/data/dictionaries', () => ({
  getDictionaryById: vi.fn((id: string) => ({ id, name: id.toUpperCase() })),
}));

describe('WeaknessPanel', () => {
  const mockOnPracticeWeaknesses = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no weaknesses', () => {
    render(<WeaknessPanel onPracticeWeaknesses={mockOnPracticeWeaknesses} onBack={mockOnBack} />);
    expect(screen.getByText('暂无薄弱点')).toBeInTheDocument();
    expect(screen.getByText('继续保持，薄弱点会自动在这里标记')).toBeInTheDocument();
  });

  it('renders header with correct title', () => {
    render(<WeaknessPanel onPracticeWeaknesses={mockOnPracticeWeaknesses} onBack={mockOnBack} />);
    expect(screen.getByText('薄弱点训练')).toBeInTheDocument();
    expect(screen.getByText('0 个薄弱点')).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(<WeaknessPanel onPracticeWeaknesses={mockOnPracticeWeaknesses} onBack={mockOnBack} />);
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<WeaknessPanel onPracticeWeaknesses={mockOnPracticeWeaknesses} onBack={mockOnBack} />);
    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('renders stats summary with overallStrength', () => {
    render(<WeaknessPanel onPracticeWeaknesses={mockOnPracticeWeaknesses} onBack={mockOnBack} />);
    // Empty state shows strength=0 placeholders
    expect(screen.getByText('薄弱点总数')).toBeInTheDocument();
    expect(screen.getByText('高频错误')).toBeInTheDocument();
    expect(screen.getByText('低正确率')).toBeInTheDocument();
    expect(screen.getByText('综合实力')).toBeInTheDocument();
  });
});
