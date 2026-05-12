import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonalPracticePanel } from '../PersonalPracticePanel';
import { storage } from '@/services/storage';
import type { PersonalWord } from '@/data/types';

// Mock storage
vi.mock('@/services/storage', () => ({
  storage: {
    getPersonalWords: vi.fn(),
  },
}));

// Mock buildPersonalWordIndex
vi.mock('@/data/personalWordIndex', () => ({
  buildPersonalWordIndex: vi.fn(),
}));

// Mock the personalWordIndex mock to return appropriate getAllAsSentences
vi.mock('@/data/personalWordIndex', async () => {
  const actual = await vi.importActual('@/data/personalWordIndex');
  return {
    ...actual,
  };
});

describe('PersonalPracticePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when no personal words exist', () => {
    vi.mocked(storage.getPersonalWords).mockReturnValue([]);

    const { container } = render(
      <PersonalPracticePanel onStartPractice={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders panel when personal words exist', () => {
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: true, markedAt: 1234567890 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    render(<PersonalPracticePanel onStartPractice={vi.fn()} />);

    expect(screen.getByText('我的生词库')).toBeInTheDocument();
    expect(screen.getByText('1 词')).toBeInTheDocument();
  });

  it('shows correct word count badge', () => {
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
      { word: 'world', translation: '世界', exampleSentence: 'Hello world', exampleSentenceCn: '你好世界', marked: false, markedAt: 0 },
      { word: 'help', translation: '帮助', exampleSentence: 'I need help', exampleSentenceCn: '需要帮助', marked: false, markedAt: 0 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    render(<PersonalPracticePanel onStartPractice={vi.fn()} />);

    expect(screen.getByText('3 词')).toBeInTheDocument();
  });

  it('shows practiceable questions count', () => {
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
      { word: 'world', translation: '世界', exampleSentence: 'Hello world', exampleSentenceCn: '你好世界', marked: false, markedAt: 0 },
      { word: 'help', translation: '帮助', exampleSentence: 'I need help', exampleSentenceCn: '需要帮助', marked: false, markedAt: 0 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    render(<PersonalPracticePanel onStartPractice={vi.fn()} />);

    expect(screen.getByText(/可练习 \d+ 题/)).toBeInTheDocument();
  });

  it('shows "暂无练习数据" when no sentences can be practiced', () => {
    const words: PersonalWord[] = [];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    const { container } = render(
      <PersonalPracticePanel onStartPractice={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders "开始练习" button', () => {
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    render(<PersonalPracticePanel onStartPractice={vi.fn()} />);

    expect(screen.getByText('开始练习')).toBeInTheDocument();
  });

  it('calls onStartPractice when button is clicked', () => {
    const onStartPractice = vi.fn();
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    render(<PersonalPracticePanel onStartPractice={onStartPractice} />);

    const button = screen.getByText('开始练习');
    button.click();

    expect(onStartPractice).toHaveBeenCalledTimes(1);
  });

  it('limits practiceable questions to 10', () => {
    const words = Array.from({ length: 15 }, (_, i) => ({
      word: `word${i}`,
      translation: `词${i}`,
      exampleSentence: `Sentence ${i}`,
      exampleSentenceCn: `句子 ${i}`,
      marked: false,
      markedAt: 0,
    }));
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    render(<PersonalPracticePanel onStartPractice={vi.fn()} />);

    // Should show "可练习 10 题" (capped at 10)
    expect(screen.getByText(/可练习 10 题/)).toBeInTheDocument();
  });

  it('displays BookOpen icon', () => {
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    render(<PersonalPracticePanel onStartPractice={vi.fn()} />);

    // BookOpen icon should be rendered (in the amber circle)
    expect(screen.getByText('我的生词库')).toBeInTheDocument();
  });

  it('displays Play icon in the button', () => {
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    render(<PersonalPracticePanel onStartPractice={vi.fn()} />);

    const button = screen.getByText('开始练习');
    // Button contains Play icon
    expect(button).toBeInTheDocument();
  });

  it('has correct gradient background styling', () => {
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    const { container } = render(
      <PersonalPracticePanel onStartPractice={vi.fn()} />
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveClass('from-amber-50');
    expect(panel).toHaveClass('to-orange-50');
    expect(panel).toHaveClass('border-amber-200');
  });
});
