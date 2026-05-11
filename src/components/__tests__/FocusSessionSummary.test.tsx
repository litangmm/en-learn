import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FocusSessionSummary } from '../FocusSessionSummary';

describe('FocusSessionSummary', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays session duration', () => {
    render(
      <FocusSessionSummary
        stats={{ duration: 300, questionsCompleted: 10, accuracy: 0 }}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('5分0秒')).toBeInTheDocument();
  });

  it('displays questions completed count', () => {
    render(
      <FocusSessionSummary
        stats={{ duration: 300, questionsCompleted: 10, accuracy: 0 }}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('10 题')).toBeInTheDocument();
  });

  it('displays 0m0s for 0 seconds', () => {
    render(
      <FocusSessionSummary
        stats={{ duration: 0, questionsCompleted: 0, accuracy: 0 }}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('0分0秒')).toBeInTheDocument();
  });

  it('calls onClose when button clicked', async () => {
    const user = userEvent.setup();
    render(
      <FocusSessionSummary
        stats={{ duration: 300, questionsCompleted: 10, accuracy: 0 }}
        onClose={mockOnClose}
      />
    );
    await user.click(screen.getByRole('button'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays title', () => {
    render(
      <FocusSessionSummary
        stats={{ duration: 300, questionsCompleted: 10, accuracy: 0 }}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('专注练习完成')).toBeInTheDocument();
  });
});