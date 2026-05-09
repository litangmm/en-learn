import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Leaderboard } from '../Leaderboard';
import type { LeaderboardEntry } from '@/data/types';

function createMockEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank: 1,
    sessionId: 's1',
    dictionaryName: 'CET-4',
    score: 100,
    accuracy: 80,
    speed: 50,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('Leaderboard', () => {
  const mockOnCategoryChange = vi.fn();
  const mockOnTimeFilterChange = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderLeaderboard(props?: {
    entries?: LeaderboardEntry[];
    category?: 'score' | 'accuracy' | 'speed';
    timeFilter?: 'today' | 'week' | 'all';
  }) {
    return render(
      <Leaderboard
        entries={props?.entries ?? []}
        category={props?.category ?? 'score'}
        timeFilter={props?.timeFilter ?? 'today'}
        onCategoryChange={mockOnCategoryChange}
        onTimeFilterChange={mockOnTimeFilterChange}
        onBack={mockOnBack}
      />,
    );
  }

  it('renders header with title and back button', () => {
    renderLeaderboard();

    expect(screen.getByText('学习排行榜')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
  });

  it('category tab switching calls onCategoryChange', () => {
    renderLeaderboard();

    fireEvent.click(screen.getByTestId('category-tab-accuracy'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('accuracy');

    fireEvent.click(screen.getByTestId('category-tab-speed'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('speed');
  });

  it('time filter switching calls onTimeFilterChange', () => {
    renderLeaderboard();

    fireEvent.click(screen.getByTestId('time-tab-today'));
    expect(mockOnTimeFilterChange).toHaveBeenCalledWith('today');

    fireEvent.click(screen.getByTestId('time-tab-week'));
    expect(mockOnTimeFilterChange).toHaveBeenCalledWith('week');

    fireEvent.click(screen.getByTestId('time-tab-all'));
    expect(mockOnTimeFilterChange).toHaveBeenCalledWith('all');
  });

  it('top-3 medal rendering', () => {
    const entries = [
      createMockEntry({ rank: 1, sessionId: 's1', dictionaryName: 'CET-4' }),
      createMockEntry({ rank: 2, sessionId: 's2', dictionaryName: 'CET-6' }),
      createMockEntry({ rank: 3, sessionId: 's3', dictionaryName: 'IELTS' }),
      createMockEntry({ rank: 4, sessionId: 's4', dictionaryName: 'TOEFL' }),
      createMockEntry({ rank: 5, sessionId: 's5', dictionaryName: 'GRE' }),
    ];

    renderLeaderboard({ entries });

    expect(screen.getByTestId('medal-rank-1')).toBeInTheDocument();
    expect(screen.getByTestId('medal-rank-2')).toBeInTheDocument();
    expect(screen.getByTestId('medal-rank-3')).toBeInTheDocument();

    expect(screen.queryByTestId('medal-rank-4')).not.toBeInTheDocument();
    expect(screen.queryByTestId('medal-rank-5')).not.toBeInTheDocument();
  });

  it('entry list rendering with correct names and score display', () => {
    const entries = [
      createMockEntry({ rank: 1, sessionId: 's1', dictionaryName: 'CET-4', score: 120 }),
      createMockEntry({ rank: 2, sessionId: 's2', dictionaryName: 'CET-6', score: 95 }),
      createMockEntry({ rank: 3, sessionId: 's3', dictionaryName: 'IELTS', score: 88 }),
      createMockEntry({ rank: 4, sessionId: 's4', dictionaryName: 'TOEFL', score: 76 }),
      createMockEntry({ rank: 5, sessionId: 's5', dictionaryName: 'GRE', score: 60 }),
    ];

    renderLeaderboard({ entries, category: 'score' });

    for (const entry of entries) {
      expect(
        screen.getByTestId(`leaderboard-entry-${entry.rank}`),
      ).toBeInTheDocument();
      expect(screen.getByText(entry.dictionaryName)).toBeInTheDocument();
    }

    expect(screen.getByText('120分')).toBeInTheDocument();
    expect(screen.getByText('95分')).toBeInTheDocument();
    expect(screen.getByText('88分')).toBeInTheDocument();
    expect(screen.getByText('76分')).toBeInTheDocument();
    expect(screen.getByText('60分')).toBeInTheDocument();
  });

  it('empty state shows when entries is empty', () => {
    renderLeaderboard({ entries: [] });

    expect(screen.getByTestId('leaderboard-empty')).toBeInTheDocument();
    expect(screen.getByText('暂无记录')).toBeInTheDocument();
    expect(
      screen.getByText('完成练习后将在这里显示排行榜数据'),
    ).toBeInTheDocument();
  });

  it('back navigation calls onBack', () => {
    renderLeaderboard();

    fireEvent.click(screen.getByTestId('back-button'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
