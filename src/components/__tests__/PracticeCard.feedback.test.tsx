import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PracticeCard } from '../PracticeCard';
import type { Sentence, SentenceToken, ChoiceOption } from '@/data/types';

const mockSentence: Sentence = {
  id: '1',
  english: 'The early bird catches the worm.',
  chinese: '早起的鸟儿有虫吃。',
  blanks: [{ word: 'catches', hint: '抓住（第三人称单数）' }],
  level: 'junior',
};

const mockOptions: ChoiceOption[] = [
  { id: '1', text: 'The early bird catches the worm.' },
  { id: '2', text: 'Actions speak louder than words.' },
  { id: '3', text: 'Practice makes perfect.' },
  { id: '4', text: 'Better late than never.' },
];

const mockTokens: SentenceToken[] = [
  { id: '1-token-0', text: 'The' },
  { id: '1-token-1', text: 'early' },
  { id: '1-token-2', text: 'bird' },
  { id: '1-token-3', text: 'catches' },
  { id: '1-token-4', text: 'the' },
  { id: '1-token-5', text: 'worm.' },
];

const baseProps = {
  sentence: mockSentence,
  inputs: [''],
  showResult: true,
  isCorrect: false,
  attempts: 1,
  isSpeaking: false,
  currentQuestion: 1,
  totalQuestions: 4,
  onInputChange: vi.fn(),
  onCheck: vi.fn(),
  onNext: vi.fn(),
  onRetry: vi.fn(),
  onSpeak: vi.fn(),
};

describe('PracticeCard wrong answer feedback', () => {
  it('shows 3-section feedback for fill-in-blanks mode', () => {
    render(
      <PracticeCard
        {...baseProps}
        mode="fill-in-blanks"
        inputs={['catch']}
      />,
    );

    expect(screen.getByText('你的答案')).toBeInTheDocument();
    expect(screen.getByText('catch')).toBeInTheDocument();
    expect(screen.getByText('正确答案')).toBeInTheDocument();
    expect(screen.getByText('catches')).toBeInTheDocument();
    expect(screen.getByText('解析')).toBeInTheDocument();
    // New explanation includes the target word (catches appears in correct answer section AND explanation section)
    expect(screen.getAllByText(/catches/).length).toBeGreaterThanOrEqual(2);
  });

  it('shows 3-section feedback for dictation mode', () => {
    render(
      <PracticeCard
        {...baseProps}
        mode="dictation"
        inputs={['catsh']}
      />,
    );

    expect(screen.getByText('你的答案')).toBeInTheDocument();
    expect(screen.getByText('catsh')).toBeInTheDocument();
    expect(screen.getByText('正确答案')).toBeInTheDocument();
    expect(screen.getByText('catches')).toBeInTheDocument();
    expect(screen.getByText('解析')).toBeInTheDocument();
    // New explanation includes the target word (catches appears in correct answer section AND explanation section)
    expect(screen.getAllByText(/catches/).length).toBeGreaterThanOrEqual(2);
  });

  it('shows 3-section feedback for multiple-choice mode', () => {
    render(
      <PracticeCard
        {...baseProps}
        mode="multiple-choice"
        options={mockOptions}
        selectedChoiceId="2"
      />,
    );

    expect(screen.getByText('你的答案')).toBeInTheDocument();
    // Option text appears: once in options, once in user answer section
    expect(screen.getAllByText('Actions speak louder than words.').length).toBe(2);
    expect(screen.getByText('正确答案')).toBeInTheDocument();
    // Correct answer text appears: once in options, once in correct answer section
    expect(screen.getAllByText('The early bird catches the worm.').length).toBe(2);
    expect(screen.getByText('解析')).toBeInTheDocument();
    // New explanation includes the target word in it
    expect(screen.getAllByText(/catches/).length).toBeGreaterThanOrEqual(2);
  });

  it('shows 3-section feedback for sentence-reorder mode', () => {
    render(
      <PracticeCard
        {...baseProps}
        mode="sentence-reorder"
        sentenceTokens={mockTokens}
        orderedTokenIds={['1-token-5', '1-token-4', '1-token-3', '1-token-2', '1-token-1', '1-token-0']}
      />,
    );

    expect(screen.getByText('你的答案')).toBeInTheDocument();
    expect(screen.getByText('worm. the catches bird early The')).toBeInTheDocument();
    expect(screen.getByText('正确答案')).toBeInTheDocument();
    expect(screen.getAllByText('The early bird catches the worm.').length).toBe(2);
    expect(screen.getByText('解析')).toBeInTheDocument();
    // New explanation mentions the word meaning
    expect(screen.getByText(/含义|完整句子/)).toBeInTheDocument();
  });

  it('shows empty answer placeholder when inputs are empty in fill-in-blanks', () => {
    render(
      <PracticeCard
        {...baseProps}
        mode="fill-in-blanks"
        inputs={['']}
      />,
    );

    expect(screen.getByText('你的答案')).toBeInTheDocument();
    expect(screen.getByText('(未填写)')).toBeInTheDocument();
  });

  it('shows not-selected placeholder when no choice selected in multiple-choice', () => {
    render(
      <PracticeCard
        {...baseProps}
        mode="multiple-choice"
        options={mockOptions}
        selectedChoiceId={null}
      />,
    );

    expect(screen.getByText('你的答案')).toBeInTheDocument();
    expect(screen.getByText('(未选择)')).toBeInTheDocument();
  });

  it('shows not-arranged placeholder when orderedTokenIds is empty in sentence-reorder', () => {
    render(
      <PracticeCard
        {...baseProps}
        mode="sentence-reorder"
        sentenceTokens={mockTokens}
        orderedTokenIds={[]}
      />,
    );

    expect(screen.getByText('你的答案')).toBeInTheDocument();
    expect(screen.getByText('(未排列)')).toBeInTheDocument();
  });
});
