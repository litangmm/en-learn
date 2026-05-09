import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeCard } from '../PracticeCard';
import type { Sentence } from '@/data/types';

const mockSentence: Sentence = {
  id: '1',
  english: 'The early bird catches the worm.',
  chinese: '早起的鸟儿有虫吃。',
  blanks: [{ word: 'catches', hint: '抓住（第三人称单数）' }],
  level: 'junior',
};

const mockOptions: Sentence[] = [
  mockSentence,
  {
    id: '2',
    english: 'Actions speak louder than words.',
    chinese: '行动胜于言辞。',
    blanks: [{ word: 'Actions', hint: '行动' }],
    level: 'junior',
  },
  {
    id: '3',
    english: 'Practice makes perfect.',
    chinese: '熟能生巧。',
    blanks: [{ word: 'perfect', hint: '完美的' }],
    level: 'junior',
  },
  {
    id: '4',
    english: 'Better late than never.',
    chinese: '迟做总比不做好。',
    blanks: [{ word: 'never', hint: '从不' }],
    level: 'junior',
  },
];

const mockOnSelectChoice = vi.fn();
const mockOnCheck = vi.fn();
const mockOnNext = vi.fn();
const mockOnSpeak = vi.fn();

describe('PracticeCard multiple-choice', () => {
  it('renders 4 choice options in multiple-choice mode', () => {
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
        mode="multiple-choice"
        options={mockOptions}
        selectedChoiceId={null}
        onSelectChoice={mockOnSelectChoice}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    expect(screen.getByText('Actions speak louder than words.')).toBeInTheDocument();
    expect(screen.getByText('Practice makes perfect.')).toBeInTheDocument();
    expect(screen.getByText('Better late than never.')).toBeInTheDocument();
  });

  it('calls onSelectChoice when option is clicked', () => {
    mockOnSelectChoice.mockClear();

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
        mode="multiple-choice"
        options={mockOptions}
        selectedChoiceId={null}
        onSelectChoice={mockOnSelectChoice}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    const option = screen.getByText('Actions speak louder than words.');
    fireEvent.click(option);

    expect(mockOnSelectChoice).toHaveBeenCalledWith('2');
  });

  it('disables submit button before selection', () => {
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
        mode="multiple-choice"
        options={mockOptions}
        selectedChoiceId={null}
        onSelectChoice={mockOnSelectChoice}
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

  it('enables submit button after selection', () => {
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
        mode="multiple-choice"
        options={mockOptions}
        selectedChoiceId="2"
        onSelectChoice={mockOnSelectChoice}
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

  it('highlights correct option in green on showResult', () => {
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
        mode="multiple-choice"
        options={mockOptions}
        selectedChoiceId="1"
        onSelectChoice={mockOnSelectChoice}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    const correctOption = screen.getByText('The early bird catches the worm.').closest('button');
    expect(correctOption).toHaveClass('border-green-500');
    expect(correctOption).toHaveClass('bg-green-50');
  });

  it('highlights wrong selected option in red on showResult', () => {
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
        mode="multiple-choice"
        options={mockOptions}
        selectedChoiceId="2"
        onSelectChoice={mockOnSelectChoice}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    const wrongOption = screen.getByText('Actions speak louder than words.').closest('button');
    expect(wrongOption).toHaveClass('border-red-500');
    expect(wrongOption).toHaveClass('bg-red-50');
  });

  it('shows next button for wrong answer in multiple-choice mode', () => {
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
        mode="multiple-choice"
        options={mockOptions}
        selectedChoiceId="2"
        onSelectChoice={mockOnSelectChoice}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    expect(screen.getByText('下一题')).toBeInTheDocument();
    expect(screen.queryByText('重新尝试')).not.toBeInTheDocument();
  });

  it('unselected options have no special style on showResult', () => {
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
        mode="multiple-choice"
        options={mockOptions}
        selectedChoiceId="2"
        onSelectChoice={mockOnSelectChoice}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    const unselectedOption = screen.getByText('Practice makes perfect.').closest('button');
    expect(unselectedOption).toHaveClass('border-slate-200');
    expect(unselectedOption).toHaveClass('bg-white');
  });

  it('does not affect fill-in-blanks mode rendering', () => {
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
        mode="fill-in-blanks"
        options={mockOptions}
        selectedChoiceId={null}
        onSelectChoice={mockOnSelectChoice}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    // Fill-in-blanks should show input, not choice options
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText('Actions speak louder than words.')).not.toBeInTheDocument();
  });

  it('does not affect dictation mode rendering', () => {
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
        mode="dictation"
        options={mockOptions}
        selectedChoiceId={null}
        onSelectChoice={mockOnSelectChoice}
        onInputChange={vi.fn()}
        onCheck={mockOnCheck}
        onNext={mockOnNext}
        onRetry={vi.fn()}
        onSpeak={mockOnSpeak}
      />,
    );

    // Dictation should hide chinese
    expect(screen.queryByText('早起的鸟儿有虫吃。')).not.toBeInTheDocument();
    // Should not show choice options
    expect(screen.queryByText('Actions speak louder than words.')).not.toBeInTheDocument();
  });
});
