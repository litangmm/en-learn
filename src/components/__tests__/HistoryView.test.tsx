import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistoryView } from '../HistoryView';
import { storage } from '@/services/storage';
import type { SessionHistory } from '@/data/types';

function createMockHistory(overrides: Partial<SessionHistory> = {}): SessionHistory {
  return {
    id: 'test-id',
    timestamp: Date.now(),
    duration: 120,
    dictionaryId: 'cet4',
    dictionaryName: 'CET-4',
    score: 85,
    totalQuestions: 10,
    correctCount: 8,
    accuracy: 80,
    ...overrides,
  };
}

describe('HistoryView', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders empty state when no history', () => {
    vi.spyOn(storage, 'getHistory').mockReturnValue([]);

    render(<HistoryView onBack={mockOnBack} />);

    expect(screen.getByText('学习记录')).toBeInTheDocument();
    expect(screen.getByText('0 次')).toBeInTheDocument();
    expect(screen.getByText('暂无学习记录')).toBeInTheDocument();
    expect(screen.getByText('完成练习后，学习记录会出现在这里')).toBeInTheDocument();
  });

  it('renders history list with entries', () => {
    vi.spyOn(storage, 'getHistory').mockReturnValue([
      createMockHistory({ id: 'id-1', dictionaryName: 'CET-4', score: 85, accuracy: 80 }),
      createMockHistory({ id: 'id-2', dictionaryName: '雅思', score: 92, accuracy: 90 }),
    ]);

    render(<HistoryView onBack={mockOnBack} />);

    expect(screen.getByText('CET-4')).toBeInTheDocument();
    expect(screen.getByText('雅思')).toBeInTheDocument();
    expect(screen.getAllByText(/分/).length).toBeGreaterThanOrEqual(2);
  });

  it('groups entries by date', () => {
    const now = Date.now();
    const yesterday = now - 86400000;
    vi.spyOn(storage, 'getHistory').mockReturnValue([
      createMockHistory({ id: 'id-1', timestamp: now, dictionaryName: '今天记录' }),
      createMockHistory({ id: 'id-2', timestamp: yesterday, dictionaryName: '昨天记录' }),
    ]);

    render(<HistoryView onBack={mockOnBack} />);

    expect(screen.getByText('今天')).toBeInTheDocument();
    expect(screen.getByText('昨天')).toBeInTheDocument();
    expect(screen.getByText('今天记录')).toBeInTheDocument();
    expect(screen.getByText('昨天记录')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    vi.spyOn(storage, 'getHistory').mockReturnValue([]);

    render(<HistoryView onBack={mockOnBack} />);

    const backButton = screen.getByRole('button', { name: '' }); // icon button
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows clear confirmation dialog when clear button clicked', () => {
    vi.spyOn(storage, 'getHistory').mockReturnValue([
      createMockHistory({ id: 'id-1' }),
    ]);

    render(<HistoryView onBack={mockOnBack} />);

    const clearButton = screen.getByText('清空记录');
    fireEvent.click(clearButton);

    expect(screen.getByText('清空学习记录')).toBeInTheDocument();
    expect(screen.getByText('确定要清空所有学习记录吗？此操作无法撤销。')).toBeInTheDocument();
  });

  it('clears history when confirm button clicked', async () => {
    const clearSpy = vi.spyOn(storage, 'clearHistory').mockImplementation(() => {});
    vi.spyOn(storage, 'getHistory')
      .mockReturnValueOnce([createMockHistory({ id: 'id-1' })])
      .mockReturnValueOnce([]);

    render(<HistoryView onBack={mockOnBack} />);

    const clearButton = screen.getByText('清空记录');
    fireEvent.click(clearButton);

    const confirmButton = screen.getByText('清空');
    fireEvent.click(confirmButton);

    expect(clearSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('暂无学习记录')).toBeInTheDocument();
    });
  });

  it('does not show clear button when no history', () => {
    vi.spyOn(storage, 'getHistory').mockReturnValue([]);

    render(<HistoryView onBack={mockOnBack} />);

    expect(screen.queryByText('清空记录')).not.toBeInTheDocument();
  });

  it('displays correct metadata for each entry', () => {
    vi.spyOn(storage, 'getHistory').mockReturnValue([
      createMockHistory({
        id: 'id-1',
        score: 95,
        accuracy: 90,
        duration: 185,
        correctCount: 9,
        totalQuestions: 10,
      }),
    ]);

    render(<HistoryView onBack={mockOnBack} />);

    expect(screen.getByText('95 分')).toBeInTheDocument();
    expect(screen.getByText(/正确率 90%/)).toBeInTheDocument();
    expect(screen.getByText(/3分5秒/)).toBeInTheDocument();
    expect(screen.getByText('9/10 题')).toBeInTheDocument();
  });
});
