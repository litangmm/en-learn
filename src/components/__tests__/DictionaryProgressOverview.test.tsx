import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DictionaryProgressOverview } from '../DictionaryProgressOverview';
import type { DictionaryProgress } from '@/hooks/useProgressStats';

describe('DictionaryProgressOverview', () => {
  const mockProgress: DictionaryProgress[] = [
    { dictionaryId: 'junior', dictionaryName: '初中词汇', totalSentences: 1600, practicedSentences: 100, correctCount: 80, accuracy: 80, progress: 6 },
    { dictionaryId: 'senior', dictionaryName: '高中词汇', totalSentences: 2000, practicedSentences: 0, correctCount: 0, accuracy: 0, progress: 0 },
    { dictionaryId: 'cet4', dictionaryName: 'CET-4', totalSentences: 1500, practicedSentences: 500, correctCount: 450, accuracy: 90, progress: 33 },
  ];

  it('renders with data-testid', () => {
    render(<DictionaryProgressOverview progress={mockProgress} />);
    expect(screen.getByTestId('dictionary-progress-overview')).toBeInTheDocument();
  });

  it('renders all dictionary items', () => {
    render(<DictionaryProgressOverview progress={mockProgress} />);
    expect(screen.getByText('初中词汇')).toBeInTheDocument();
    expect(screen.getByText('高中词汇')).toBeInTheDocument();
    expect(screen.getByText('CET-4')).toBeInTheDocument();
  });

  it('renders header with started count', () => {
    render(<DictionaryProgressOverview progress={mockProgress} />);
    expect(screen.getByText(/已开始 2\/3 个词库/)).toBeInTheDocument();
  });

  it('renders header with completed count when applicable', () => {
    const withCompleted = [
      ...mockProgress,
      { dictionaryId: 'cet6', dictionaryName: 'CET-6', totalSentences: 1500, practicedSentences: 1500, correctCount: 1400, accuracy: 93, progress: 100 },
    ];
    render(<DictionaryProgressOverview progress={withCompleted} />);
    expect(screen.getByText(/完成 1 个/)).toBeInTheDocument();
  });

  it('renders practice count for each dictionary', () => {
    render(<DictionaryProgressOverview progress={mockProgress} />);
    expect(screen.getByText('100/1600 题')).toBeInTheDocument();
    expect(screen.getByText('0/2000 题')).toBeInTheDocument();
    expect(screen.getByText('500/1500 题')).toBeInTheDocument();
  });

  it('renders accuracy badge for practiced dictionaries', () => {
    render(<DictionaryProgressOverview progress={mockProgress} />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('calls onDictionaryClick when item is clicked', () => {
    const onClick = vi.fn();
    render(<DictionaryProgressOverview progress={mockProgress} onDictionaryClick={onClick} />);

    fireEvent.click(screen.getByText('初中词汇'));
    expect(onClick).toHaveBeenCalledWith('junior');
  });

  it('does not trigger click when onDictionaryClick is not provided', () => {
    render(<DictionaryProgressOverview progress={mockProgress} />);
    // Should not throw
    expect(() => {
      fireEvent.click(screen.getByText('高中词汇'));
    }).not.toThrow();
  });

  it('sorts practiced dictionaries first by practiced count', () => {
    render(<DictionaryProgressOverview progress={mockProgress} />);
    const items = screen.getAllByTestId(/dictionary-progress-item-/);
    // Cet4 has 500 practiced (most), junior has 100, senior has 0
    // So cet4 should be first
    expect(items[0]).toHaveAttribute('data-testid', 'dictionary-progress-item-cet4');
    // Senior should be last (not practiced)
    const lastItem = items[items.length - 1];
    expect(lastItem).toHaveAttribute('data-testid', 'dictionary-progress-item-senior');
  });
});