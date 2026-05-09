import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeCard } from '../PracticeCard';
import type { Sentence } from '@/data/types';

describe('PracticeCard speed control', () => {
  const mockSentence: Sentence = {
    id: '1',
    english: 'The early bird catches the worm.',
    chinese: '早起的鸟儿有虫吃。',
    blanks: [{ word: 'catches', hint: '抓住（第三人称单数）' }],
    level: 'junior',
  };

  const mockOnInputChange = vi.fn();
  const mockOnCheck = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnRetry = vi.fn();
  const mockOnSpeak = vi.fn();
  const mockOnSpeedChange = vi.fn();

  it('renders five speed options when onSpeedChange is provided', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={3}
        playbackRate={1.0}
        onSpeedChange={mockOnSpeedChange}
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.getByRole('radio', { name: '0.5x' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '0.75x' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '1x' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '1.25x' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '1.5x' })).toBeInTheDocument();
  });

  it('does not render speed selector when onSpeedChange is not provided', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={3}
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.queryByRole('radio', { name: '0.5x' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: '1.5x' })).not.toBeInTheDocument();
  });

  it('marks current playbackRate as selected', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={3}
        playbackRate={0.75}
        onSpeedChange={mockOnSpeedChange}
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    const selected = screen.getByRole('radio', { name: '0.75x' });
    expect(selected).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onSpeedChange with correct rate when a speed option is clicked', () => {
    mockOnSpeedChange.mockClear();

    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={3}
        playbackRate={1.0}
        onSpeedChange={mockOnSpeedChange}
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    const speed15 = screen.getByRole('radio', { name: '1.5x' });
    fireEvent.click(speed15);

    expect(mockOnSpeedChange).toHaveBeenCalledWith(1.5);
  });

  it('shows speed selector in dictation mode', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={3}
        mode="dictation"
        playbackRate={1.0}
        onSpeedChange={mockOnSpeedChange}
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.getByRole('radio', { name: '0.5x' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '1.5x' })).toBeInTheDocument();
  });

  it('shows speed selector when showResult is true', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['catches']}
        showResult={true}
        isCorrect={true}
        attempts={1}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={3}
        playbackRate={1.0}
        onSpeedChange={mockOnSpeedChange}
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.getByRole('radio', { name: '0.5x' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '1.5x' })).toBeInTheDocument();
  });
});
