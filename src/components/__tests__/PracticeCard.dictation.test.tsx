import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PracticeCard } from '../PracticeCard';
import type { Sentence } from '@/data/types';

describe('PracticeCard dictation mode', () => {
  const mockSentence: Sentence = {
    id: '1',
    english: 'The early bird catches the worm.',
    chinese: '早起的鸟儿有虫吃。',
    blanks: [{ word: 'catches', hint: '抓住（第三人称单数）' }],
    level: 'junior',
  };

  const baseProps = {
    sentence: mockSentence,
    inputs: [''],
    showResult: false,
    isCorrect: false,
    attempts: 0,
    isSpeaking: false,
    currentQuestion: 1,
    totalQuestions: 3,
    onInputChange: vi.fn(),
    onCheck: vi.fn(),
    onNext: vi.fn(),
    onRetry: vi.fn(),
    onSpeak: vi.fn(),
  };

  it('does not render chinese translation in dictation mode before result', () => {
    render(<PracticeCard {...baseProps} mode="dictation" />);
    expect(screen.queryByText('早起的鸟儿有虫吃。')).not.toBeInTheDocument();
  });

  it('does not render english sentence text in dictation mode before result', () => {
    render(<PracticeCard {...baseProps} mode="dictation" />);
    expect(screen.queryByText(/The early bird/)).not.toBeInTheDocument();
  });

  it('renders input boxes in dictation mode', () => {
    render(<PracticeCard {...baseProps} mode="dictation" />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('shows dictation mode instruction text', () => {
    render(<PracticeCard {...baseProps} mode="dictation" />);
    expect(screen.getByText('请听音频，在输入框中填写听到的单词')).toBeInTheDocument();
  });

  it('shows chinese translation when showResult is true in dictation mode', () => {
    render(
      <PracticeCard
        {...baseProps}
        mode="dictation"
        showResult={true}
        isCorrect={true}
        attempts={1}
        inputs={['catches']}
      />,
    );
    expect(screen.getByText('早起的鸟儿有虫吃。')).toBeInTheDocument();
  });

  it('shows english sentence when showResult is true in dictation mode', () => {
    render(
      <PracticeCard
        {...baseProps}
        mode="dictation"
        showResult={true}
        isCorrect={true}
        attempts={1}
        inputs={['catches']}
      />,
    );
    expect(screen.getByText(/The early bird/)).toBeInTheDocument();
  });

  it('shows correct answer when answer is wrong in dictation mode', () => {
    render(
      <PracticeCard
        {...baseProps}
        mode="dictation"
        showResult={true}
        isCorrect={false}
        attempts={1}
        inputs={['wrong']}
      />,
    );
    expect(screen.getByText('catches')).toBeInTheDocument();
  });

  it('renders fill-in-blanks mode with all content visible', () => {
    render(<PracticeCard {...baseProps} mode="fill-in-blanks" />);
    expect(screen.getByText('早起的鸟儿有虫吃。')).toBeInTheDocument();
    expect(screen.getByText(/The early bird/)).toBeInTheDocument();
  });

  it('does not show dictation instruction in fill-in-blanks mode', () => {
    render(<PracticeCard {...baseProps} mode="fill-in-blanks" />);
    expect(
      screen.queryByText('请听音频，在输入框中填写听到的单词'),
    ).not.toBeInTheDocument();
  });

  it('hides hints in dictation mode', () => {
    render(<PracticeCard {...baseProps} mode="dictation" />);
    expect(screen.queryByText(/空1: 抓住/)).not.toBeInTheDocument();
  });

  it('shows hints in fill-in-blanks mode', () => {
    render(<PracticeCard {...baseProps} mode="fill-in-blanks" />);
    expect(screen.getByText(/空1: 抓住/)).toBeInTheDocument();
  });
});
