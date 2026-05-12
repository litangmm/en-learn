import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FocusModeOverlay } from '../FocusModeOverlay';

describe('FocusModeOverlay', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <FocusModeOverlay
        isOpen={false}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        practiceComponent={<div>Test</div>}
        totalQuestions={10}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('displays timer starting at 00:00', () => {
    render(
      <FocusModeOverlay
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        practiceComponent={<div>Test</div>}
        totalQuestions={10}
      />
    );
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('displays total questions count', () => {
    render(
      <FocusModeOverlay
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        practiceComponent={<div>Test</div>}
        totalQuestions={10}
      />
    );
    expect(screen.getByText('0/10 题')).toBeInTheDocument();
  });

  it('renders practice component', () => {
    render(
      <FocusModeOverlay
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        practiceComponent={<div data-testid="practice">Practice Content</div>}
        totalQuestions={10}
      />
    );
    expect(screen.getByTestId('practice')).toBeInTheDocument();
  });

  it('calls onClose when exit button clicked', async () => {
    const user = userEvent.setup();
    render(
      <FocusModeOverlay
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        practiceComponent={<div>Test</div>}
        totalQuestions={10}
      />
    );
    const exitButton = screen.getByRole('button', { name: '退出专注模式' });
    await user.click(exitButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onComplete with stats when exit button clicked', async () => {
    const user = userEvent.setup();
    render(
      <FocusModeOverlay
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        practiceComponent={<div>Test</div>}
        totalQuestions={10}
      />
    );
    const exitButton = screen.getByRole('button', { name: '退出专注模式' });
    await user.click(exitButton);
    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: expect.any(Number),
        questionsCompleted: expect.any(Number),
        accuracy: 0,
      })
    );
  });
});
