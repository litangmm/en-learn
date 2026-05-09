import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeCard } from '../PracticeCard';
import type { Sentence, SentenceToken } from '@/data/types';

const mockSentence: Sentence = {
  id: '1',
  english: 'The early bird catches the worm.',
  chinese: '早起的鸟儿有虫吃。',
  blanks: [{ word: 'catches', hint: '抓住（第三人称单数）' }],
  level: 'junior',
};

const mockTokens: SentenceToken[] = [
  { id: '1-token-0', text: 'The' },
  { id: '1-token-1', text: 'early' },
  { id: '1-token-2', text: 'bird' },
  { id: '1-token-3', text: 'catches' },
  { id: '1-token-4', text: 'the' },
  { id: '1-token-5', text: 'worm.' },
];

const mockOnSelectToken = vi.fn();
const mockOnDeselectToken = vi.fn();
const mockOnCheck = vi.fn();
const mockOnNext = vi.fn();
const mockOnSpeak = vi.fn();

describe('PracticeCard sentence-reorder', () => {
  it('renders word pool and empty answer zone', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={4}
        mode="sentence-reorder"
        sentenceTokens={mockTokens}
        orderedTokenIds={[]}
        onSelectToken={mockOnSelectToken}
        onDeselectToken={mockOnDeselectToken}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    // Word pool should show all tokens
    expect(screen.getByText('The')).toBeInTheDocument();
    expect(screen.getByText('early')).toBeInTheDocument();
    expect(screen.getByText('bird')).toBeInTheDocument();
    expect(screen.getByText('catches')).toBeInTheDocument();
    expect(screen.getByText('the')).toBeInTheDocument();
    expect(screen.getByText('worm.')).toBeInTheDocument();

    // Empty answer zone hint
    expect(screen.getByText('点击下方单词排列句子')).toBeInTheDocument();
  });

  it('moves token to answer zone when clicked', () => {
    mockOnSelectToken.mockClear();

    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={4}
        mode="sentence-reorder"
        sentenceTokens={mockTokens}
        orderedTokenIds={[]}
        onSelectToken={mockOnSelectToken}
        onDeselectToken={mockOnDeselectToken}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    const token = screen.getByText('The');
    fireEvent.click(token);

    expect(mockOnSelectToken).toHaveBeenCalledWith('1-token-0');
  });

  it('returns token to pool when clicked in answer zone', () => {
    mockOnDeselectToken.mockClear();

    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={4}
        mode="sentence-reorder"
        sentenceTokens={mockTokens}
        orderedTokenIds={['1-token-0']}
        onSelectToken={mockOnSelectToken}
        onDeselectToken={mockOnDeselectToken}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    const tokenInAnswer = screen.getByText('The');
    fireEvent.click(tokenInAnswer);

    expect(mockOnDeselectToken).toHaveBeenCalledWith(0);
  });

  it('disables submit button until all tokens selected', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={4}
        mode="sentence-reorder"
        sentenceTokens={mockTokens}
        orderedTokenIds={['1-token-0', '1-token-1']}
        onSelectToken={mockOnSelectToken}
        onDeselectToken={mockOnDeselectToken}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    const submitButton = screen.getByText('提交答案');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when all tokens selected', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={false}
        isCorrect={false}
        attempts={0}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={4}
        mode="sentence-reorder"
        sentenceTokens={mockTokens}
        orderedTokenIds={mockTokens.map((t) => t.id)}
        onSelectToken={mockOnSelectToken}
        onDeselectToken={mockOnDeselectToken}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    const submitButton = screen.getByText('提交答案');
    expect(submitButton).not.toBeDisabled();
  });

  it('shows success feedback and next button on correct answer', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={true}
        isCorrect={true}
        attempts={1}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={4}
        mode="sentence-reorder"
        sentenceTokens={mockTokens}
        orderedTokenIds={mockTokens.map((t) => t.id)}
        onSelectToken={mockOnSelectToken}
        onDeselectToken={mockOnDeselectToken}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.getByText('回答正确！')).toBeInTheDocument();
    expect(screen.getByText('下一题')).toBeInTheDocument();
  });

  it('shows error feedback and correct sentence on wrong answer', () => {
    render(
      <PracticeCard
        sentence={mockSentence}
        inputs={['']}
        showResult={true}
        isCorrect={false}
        attempts={1}
        isSpeaking={false}
        currentQuestion={1}
        totalQuestions={4}
        mode="sentence-reorder"
        sentenceTokens={mockTokens}
        orderedTokenIds={['1-token-5', '1-token-4', '1-token-3', '1-token-2', '1-token-1', '1-token-0']}
        onSelectToken={mockOnSelectToken}
        onDeselectToken={mockOnDeselectToken}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.getByText('答案不正确')).toBeInTheDocument();
    expect(screen.getByText('正确答案：')).toBeInTheDocument();
    expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    expect(screen.getByText('下一题')).toBeInTheDocument();
    expect(screen.queryByText('重新尝试')).not.toBeInTheDocument();
  });
});
