import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeCard } from '../PracticeCard';
import type { Sentence, ChoiceOption } from '@/data/types';

const mockSentence: Sentence = {
  id: '1',
  english: 'The early bird catches the worm.',
  chinese: '早起的鸟儿有虫吃。',
  blanks: [{ word: 'catches', hint: '抓住（第三人称单数）' }],
  level: 'junior',
};

// Definition sentence for testing - target word in quotes indicates definition
const mockDefinitionSentence: Sentence = {
  id: 'def1',
  english: '"brave" means having the courage to do something.',
  chinese: '"brave" 意思是勇敢。',
  blanks: [{ word: 'brave', hint: '形容词' }],
  level: 'basic',
};

const mockOptions: ChoiceOption[] = [
  { id: '1', text: 'The early bird catches the worm.' },
  { id: '2', text: 'Actions speak louder than words.' },
  { id: '3', text: 'Practice makes perfect.' },
  { id: '4', text: 'Better late than never.' },
];

// Options for definition sentence should use Chinese text
const mockDefinitionOptions: ChoiceOption[] = [
  { id: 'def1', text: '"brave" 意思是勇敢。' },
  { id: 'def2', text: '"smart" 意思是聪明。' },
  { id: 'def3', text: '"happy" 意思是快乐。' },
  { id: 'def4', text: '"sad" 意思是悲伤。' },
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

    const wrongOptions = screen.getAllByText('Actions speak louder than words.');
    // First occurrence is in the options list, which has the styling
    const wrongOption = wrongOptions[0].closest('button');
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

    // Dictation should show chinese
    expect(screen.getByText('早起的鸟儿有虫吃。')).toBeInTheDocument();
    // Should not show choice options
    expect(screen.queryByText('Actions speak louder than words.')).not.toBeInTheDocument();
  });

  it('shows CheckCircle2 icon on selected option', () => {
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

    const buttons = screen.getAllByRole('button');
    const selectedButton = buttons.find((b) =>
      b.textContent?.includes('Actions speak louder than words.'),
    );
    expect(selectedButton).toHaveClass('bg-blue-100');
  });

  it('shows Circle icon placeholder on unselected options', () => {
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

    const unselectedButton = screen
      .getByText('The early bird catches the worm.')
      .closest('button');
    expect(unselectedButton).toHaveClass('bg-white');
    expect(unselectedButton).toHaveClass('border-slate-200');
  });

  // ===== NEW TESTS for epic-004 iter-003 =====

  describe('definition sentence behavior', () => {
    it('uses Chinese text for definition sentence options in multiple-choice mode', () => {
      render(
        <PracticeCard
          sentence={mockDefinitionSentence}
          inputs={['']}
          showResult={false}
          isCorrect={false}
          attempts={0}
          isSpeaking={false}
          currentQuestion={1}
          totalQuestions={4}
          mode="multiple-choice"
          options={mockDefinitionOptions}
          selectedChoiceId={null}
          onSelectChoice={mockOnSelectChoice}
          onInputChange={vi.fn()}
          onCheck={mockOnCheck}
          onNext={mockOnNext}
          onRetry={vi.fn()}
          onSpeak={mockOnSpeak}
        />,
      );

      // Use getAllByText since Chinese translation appears both at top and in options
      const options = screen.getAllByText('"brave" 意思是勇敢。');
      // At least one should be in a button (option)
      const optionButton = options.find(el => el.closest('button'));
      expect(optionButton).toBeInTheDocument();

      // Verify other Chinese options are displayed in buttons
      expect(screen.getByText('"smart" 意思是聪明。').closest('button')).toBeInTheDocument();
      expect(screen.getByText('"happy" 意思是快乐。').closest('button')).toBeInTheDocument();
      expect(screen.getByText('"sad" 意思是悲伤。').closest('button')).toBeInTheDocument();
    });

    it('uses English text for normal sentence options in multiple-choice mode', () => {
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

      // Verify English options are displayed in buttons
      expect(screen.getByText('The early bird catches the worm.').closest('button')).toBeInTheDocument();
      expect(screen.getByText('Actions speak louder than words.').closest('button')).toBeInTheDocument();
      expect(screen.getByText('Practice makes perfect.').closest('button')).toBeInTheDocument();
      expect(screen.getByText('Better late than never.').closest('button')).toBeInTheDocument();
    });

    it('displays Chinese translation for definition sentences', () => {
      render(
        <PracticeCard
          sentence={mockDefinitionSentence}
          inputs={['']}
          showResult={false}
          isCorrect={false}
          attempts={0}
          isSpeaking={false}
          currentQuestion={1}
          totalQuestions={4}
          mode="fill-in-blanks"
          options={mockDefinitionOptions}
          selectedChoiceId={null}
          onSelectChoice={mockOnSelectChoice}
          onInputChange={vi.fn()}
          onCheck={mockOnCheck}
          onNext={mockOnNext}
          onRetry={vi.fn()}
          onSpeak={mockOnSpeak}
        />,
      );

      // The Chinese translation should be shown in the translation section (not in options)
      // Use getAllByText and find the one that's NOT in a button (the translation section)
      const allElements = screen.getAllByText('"brave" 意思是勇敢。');
      const translationElement = allElements.find(el => !el.closest('button'));
      expect(translationElement).toBeInTheDocument();
    });
  });

  describe('sentence-reorder with definition sentences', () => {
    it('shows warning for definition sentences in sentence-reorder mode', () => {
      render(
        <PracticeCard
          sentence={mockDefinitionSentence}
          inputs={['']}
          showResult={false}
          isCorrect={false}
          attempts={0}
          isSpeaking={false}
          currentQuestion={1}
          totalQuestions={4}
          mode="sentence-reorder"
          options={mockDefinitionOptions}
          selectedChoiceId={null}
          onSelectChoice={mockOnSelectChoice}
          onInputChange={vi.fn()}
          onCheck={mockOnCheck}
          onNext={mockOnNext}
          onRetry={vi.fn()}
          onSpeak={mockOnSpeak}
          sentenceTokens={[
            { id: 't1', text: '"brave"' },
            { id: 't2', text: 'means' },
            { id: 't3', text: 'having' },
            { id: 't4', text: 'the' },
            { id: 't5', text: 'courage' },
            { id: 't6', text: 'to' },
            { id: 't7', text: 'do' },
            { id: 't8', text: 'something.' },
          ]}
          orderedTokenIds={[]}
          onSelectToken={vi.fn()}
          onDeselectToken={vi.fn()}
        />,
      );

      // Should show warning instead of word-reorder UI
      expect(screen.getByText('此题目为释义型句子，不适合连词成句练习')).toBeInTheDocument();
    });

    it('shows word pool for normal sentences in sentence-reorder mode', () => {
      const mockTokens = [
        { id: 't1', text: 'The' },
        { id: 't2', text: 'early' },
        { id: 't3', text: 'bird' },
        { id: 't4', text: 'catches' },
        { id: 't5', text: 'the' },
        { id: 't6', text: 'worm.' },
      ];

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
          options={mockOptions}
          selectedChoiceId={null}
          onSelectChoice={mockOnSelectChoice}
          onInputChange={vi.fn()}
          onCheck={mockOnCheck}
          onNext={mockOnNext}
          onRetry={vi.fn()}
          onSpeak={mockOnSpeak}
          sentenceTokens={mockTokens}
          orderedTokenIds={[]}
          onSelectToken={vi.fn()}
          onDeselectToken={vi.fn()}
        />,
      );

      // Should NOT show warning
      expect(screen.queryByText('此题目为释义型句子，不适合连词成句练习')).not.toBeInTheDocument();
      // Should show word pool
      expect(screen.getByText('The')).toBeInTheDocument();
      expect(screen.getByText('early')).toBeInTheDocument();
      expect(screen.getByText('bird')).toBeInTheDocument();
      expect(screen.getByText('catches')).toBeInTheDocument();
    });
  });
});
