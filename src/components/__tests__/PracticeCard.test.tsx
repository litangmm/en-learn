import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeCard } from '../PracticeCard';
import type { Sentence } from '@/data/types';

describe('PracticeCard', () => {
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

  it('renders sentence chinese translation', () => {
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

    expect(screen.getByText('早起的鸟儿有虫吃。')).toBeInTheDocument();
  });

  it('renders question badge with current question and total', () => {
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

    expect(screen.getByText('第 1/3 题')).toBeInTheDocument();
  });

  it('renders question badge with sentence id when question props are not provided', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.getByText('第 1 题')).toBeInTheDocument();
  });

  it('shows attempts badge when attempts > 0', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={2}
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

    expect(screen.getByText('尝试 2 次')).toBeInTheDocument();
  });

  it('calls onInputChange when typing in input', () => {
    mockOnInputChange.mockClear();

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

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'catches' } });

    expect(mockOnInputChange).toHaveBeenCalledWith(0, 'catches');
  });

  it('calls onCheck when submit button is clicked', () => {
    mockOnCheck.mockClear();

    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['catches']}
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

    const submitButton = screen.getByText('提交答案');
    fireEvent.click(submitButton);

    expect(mockOnCheck).toHaveBeenCalledOnce();
  });

  it('shows success feedback and next button when answer is correct', () => {
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
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.getByText('回答正确！')).toBeInTheDocument();
    expect(screen.getByText('太棒了，一次就答对了！')).toBeInTheDocument();
    expect(screen.getByText('下一题')).toBeInTheDocument();
  });

  it('shows error feedback and retry button when answer is wrong', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['wrong']}
        showResult={true}
        isCorrect={false}
        attempts={1}
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

    expect(screen.getByText('答案不正确')).toBeInTheDocument();
    expect(screen.getByText('请检查你的拼写，或查看上方显示的正确答案。')).toBeInTheDocument();
    expect(screen.getByText('重新尝试')).toBeInTheDocument();
    expect(screen.getByText('catches')).toBeInTheDocument(); // correct answer shown
  });

  it('calls onNext when next button is clicked', () => {
    mockOnNext.mockClear();

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
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    const nextButton = screen.getByText('下一题');
    fireEvent.click(nextButton);

    expect(mockOnNext).toHaveBeenCalledOnce();
  });

  it('calls onRetry when retry button is clicked', () => {
    mockOnRetry.mockClear();

    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['wrong']}
        showResult={true}
        isCorrect={false}
        attempts={2}
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

    const retryButton = screen.getByText('重新尝试');
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledOnce();
  });

  it('calls onSpeak when play audio button is clicked', () => {
    mockOnSpeak.mockClear();

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

    const speakButton = screen.getByText('播放音频');
    fireEvent.click(speakButton);

    expect(mockOnSpeak).toHaveBeenCalledOnce();
  });

  it('disables input when answer is correct', () => {
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
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('shows hints for blanks', () => {
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

    expect(screen.getByText(/空1: 抓住/)).toBeInTheDocument();
  });

  it('hides hints when showing result', () => {
    const { queryByText } = render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['catches']}
        showResult={true}
        isCorrect={true}
        attempts={1}
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

    expect(queryByText(/空1: 抓住/)).not.toBeInTheDocument();
  });

  it('disables speak button when speaking', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={true}
        onInputChange={mockOnInputChange}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={mockOnRetry}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.getByText('播放中...')).toBeInTheDocument();
  });

  it('shows multi-attempt success message', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['catches']}
        showResult={true}
        isCorrect={true}
        attempts={3}
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

    expect(screen.getByText('尝试了 3 次后答对了！')).toBeInTheDocument();
  });
});
