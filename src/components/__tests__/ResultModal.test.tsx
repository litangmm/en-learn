import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultModal } from '../ResultModal';

describe('ResultModal', () => {
  const mockOnRestart = vi.fn();

  it('renders score, accuracy, and correct count', () => {
    render(
      <ResultModal
        score={85}
        totalQuestions={3}
        userAnswers={[
          { sentenceId: '1', answers: ['catches'], isCorrect: true, attempts: 1 },
          { sentenceId: '2', answers: ['Actions', 'words'], isCorrect: true, attempts: 1 },
          { sentenceId: '3', answers: ['wrong'], isCorrect: false, attempts: 2 },
        ]}
        onRestart={mockOnRestart}
      />,
    );

    expect(screen.getByText('练习完成!')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument(); // 2/3 = 67%
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('shows "优秀" grade for accuracy >= 90%', () => {
    render(
      <ResultModal
        score={100}
        totalQuestions={10}
        userAnswers={Array.from({ length: 9 }, (_, i) => ({
          sentenceId: String(i + 1),
          answers: ['word'],
          isCorrect: true,
          attempts: 1,
        }))}
        onRestart={mockOnRestart}
      />,
    );

    expect(screen.getByText('优秀')).toBeInTheDocument();
  });

  it('shows "良好" grade for accuracy >= 70% and < 90%', () => {
    render(
      <ResultModal
        score={75}
        totalQuestions={10}
        userAnswers={[
          { sentenceId: '1', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '2', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '3', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '4', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '5', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '6', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '7', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '8', answers: ['wrong'], isCorrect: false, attempts: 1 },
          { sentenceId: '9', answers: ['wrong'], isCorrect: false, attempts: 1 },
        ]}
        onRestart={mockOnRestart}
      />,
    );

    expect(screen.getByText('良好')).toBeInTheDocument();
  });

  it('shows "及格" grade for accuracy >= 50% and < 70%', () => {
    render(
      <ResultModal
        score={50}
        totalQuestions={10}
        userAnswers={[
          { sentenceId: '1', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '2', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '3', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '4', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '5', answers: ['word'], isCorrect: true, attempts: 1 },
          { sentenceId: '6', answers: ['wrong'], isCorrect: false, attempts: 1 },
          { sentenceId: '7', answers: ['wrong'], isCorrect: false, attempts: 1 },
        ]}
        onRestart={mockOnRestart}
      />,
    );

    expect(screen.getByText('及格')).toBeInTheDocument();
  });

  it('shows "继续加油" grade for accuracy < 50%', () => {
    render(
      <ResultModal
        score={20}
        totalQuestions={10}
        userAnswers={[
          { sentenceId: '1', answers: ['wrong'], isCorrect: false, attempts: 1 },
          { sentenceId: '2', answers: ['wrong'], isCorrect: false, attempts: 1 },
          { sentenceId: '3', answers: ['wrong'], isCorrect: false, attempts: 1 },
        ]}
        onRestart={mockOnRestart}
      />,
    );

    expect(screen.getByText('继续加油')).toBeInTheDocument();
  });

  it('renders answer review list', () => {
    render(
      <ResultModal
        score={30}
        totalQuestions={10}
        userAnswers={[
          { sentenceId: '1', answers: ['catches'], isCorrect: true, attempts: 1 },
          { sentenceId: '2', answers: ['wrong'], isCorrect: false, attempts: 2 },
        ]}
        onRestart={mockOnRestart}
      />,
    );

    expect(screen.getByText('答题回顾')).toBeInTheDocument();
    expect(screen.getByText('第 1 题')).toBeInTheDocument();
    expect(screen.getByText('第 2 题')).toBeInTheDocument();
    expect(screen.getByText('答案: catches · 1 次')).toBeInTheDocument();
    expect(screen.getByText('答案: wrong · 2 次')).toBeInTheDocument();
  });

  it('calls onRestart when button is clicked', () => {
    mockOnRestart.mockClear();

    render(
      <ResultModal
        score={30}
        totalQuestions={10}
        userAnswers={[
          { sentenceId: '1', answers: ['catches'], isCorrect: true, attempts: 1 },
        ]}
        onRestart={mockOnRestart}
      />,
    );

    const restartButton = screen.getByText('再来一组');
    fireEvent.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalledOnce();
  });

  it('handles empty userAnswers', () => {
    render(
      <ResultModal
        score={0}
        totalQuestions={10}
        userAnswers={[]}
        onRestart={mockOnRestart}
      />,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0/10')).toBeInTheDocument();
    expect(screen.getByText('继续加油')).toBeInTheDocument();
  });
});
