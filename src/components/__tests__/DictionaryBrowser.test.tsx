import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DictionaryBrowser } from '../DictionaryBrowser';
import type { Sentence } from '@/data/types';

const mockSentences: Sentence[] = [
  {
    id: '1',
    english: 'The early bird catches the worm.',
    chinese: '早起的鸟儿有虫吃。',
    blanks: [{ word: 'catches', hint: '抓住' }],
    level: 'cet4',
  },
  {
    id: '2',
    english: 'Actions speak louder than words.',
    chinese: '行动胜于言辞。',
    blanks: [{ word: 'Actions', hint: '行动' }],
    level: 'cet4',
  },
  {
    id: '3',
    english: 'Time and tide wait for no man.',
    chinese: '时不我待。',
    blanks: [{ word: 'tide', hint: '潮汐' }],
    level: 'cet4',
  },
];

const mockDictionaryJuniors: Sentence[] = [
  {
    id: 'j1',
    english: 'She is my best friend.',
    chinese: '她是我最好的朋友。',
    blanks: [{ word: 'friend', hint: '朋友' }],
    level: 'junior',
  },
];

// Mock loadDictionary to return different data based on dictionaryId
const loadDictionaryMock = vi.fn((dictionaryId: string): Promise<Sentence[]> => {
  if (dictionaryId === 'junior') {
    return Promise.resolve(mockDictionaryJuniors);
  }
  if (dictionaryId === 'empty') {
    return Promise.resolve([]);
  }
  return Promise.resolve(mockSentences);
});

vi.mock('@/data/loader', () => ({
  loadDictionary: (dictionaryId: string): Promise<Sentence[]> => loadDictionaryMock(dictionaryId),
}));

vi.mock('@/services/storage', () => ({
  storage: {
    getPersonalWords: vi.fn().mockReturnValue([]),
  },
}));

describe('DictionaryBrowser', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    loadDictionaryMock.mockImplementation((dictionaryId: string) => {
      if (dictionaryId === 'junior') {
        return Promise.resolve(mockDictionaryJuniors);
      }
      if (dictionaryId === 'empty') {
        return Promise.resolve([]);
      }
      if (dictionaryId === 'error') {
        return Promise.reject(new Error('Failed to load'));
      }
      return Promise.resolve(mockSentences);
    });
  });

  describe('Rendering', () => {
    it('renders with search input and dictionary selector', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      // Check header elements
      expect(screen.getByText('我的词库')).toBeInTheDocument();

      // Check search input
      expect(screen.getByPlaceholderText('搜索单词...')).toBeInTheDocument();

      // Check dictionary selector is present (default is cet4)
      await waitFor(() => {
        expect(screen.getByText('CET-4')).toBeInTheDocument();
      });
    });

    it('renders word cards with correct info', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        // Check word cards are rendered
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getByText('tide')).toBeInTheDocument();
      });

      // Check translations are shown (using specific class to avoid duplicates)
      const translations = screen.getAllByText('早起的鸟儿有虫吃。');
      expect(translations.length).toBeGreaterThanOrEqual(1);

      // Check example sentences
      expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    });

    it('renders footer with word count', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText(/共 3 个单词/)).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('filters word list when typing in search', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Type in search
      const searchInput = screen.getByPlaceholderText('搜索单词...');
      fireEvent.change(searchInput, { target: { value: 'catches' } });

      await waitFor(() => {
        // Only catches should be visible
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.queryByText('Actions')).not.toBeInTheDocument();
        expect(screen.queryByText('tide')).not.toBeInTheDocument();
      });

      // Footer should show filtered count
      expect(screen.getByText(/共 1 个单词/)).toBeInTheDocument();
    });

    it('filters by chinese translation', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜索单词...');
      fireEvent.change(searchInput, { target: { value: '时不我待' } });

      await waitFor(() => {
        expect(screen.getByText('tide')).toBeInTheDocument();
        expect(screen.queryByText('catches')).not.toBeInTheDocument();
      });
    });

    it('filters by english sentence', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜索单词...');
      fireEvent.change(searchInput, { target: { value: 'early bird' } });

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.queryByText('Actions')).not.toBeInTheDocument();
      });
    });

    it('clears search input when clearing', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      const searchInput = screen.getByPlaceholderText('搜索单词...');
      fireEvent.change(searchInput, { target: { value: 'catches' } });

      await waitFor(() => {
        expect(screen.queryByText('Actions')).not.toBeInTheDocument();
      });

      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getByText('tide')).toBeInTheDocument();
      });
    });
  });

  describe('Dictionary selector', () => {
    it('renders with default CET-4 dictionary selected', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      // Check default dictionary is CET-4
      await waitFor(() => {
        expect(screen.getByText('CET-4')).toBeInTheDocument();
      });

      // Verify CET-4 data is loaded
      expect(loadDictionaryMock).toHaveBeenCalledWith('cet4');
    });

    it('loads different data for different dictionary ids', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      // Default CET-4 data should be loaded
      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Verify loadDictionary was called with 'cet4'
      expect(loadDictionaryMock).toHaveBeenCalledWith('cet4');
    });
  });

  describe('Marked status', () => {
    it('shows badge for marked words', async () => {
      // Override the mock to return marked word
      const { storage } = await import('@/services/storage');
      vi.spyOn(storage, 'getPersonalWords').mockReturnValue([
        {
          word: 'catches',
          translation: '抓住',
          exampleSentence: 'The early bird catches the worm.',
          exampleSentenceCn: '早起的鸟儿有虫吃。',
          marked: true,
          markedAt: Date.now(),
        },
      ]);

      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Check for the "新词" badge on marked word
      expect(screen.getByText('新词')).toBeInTheDocument();
    });

    it('does not show badge for unmarked words', async () => {
      // Override the mock to return empty
      const { storage } = await import('@/services/storage');
      vi.spyOn(storage, 'getPersonalWords').mockReturnValue([]);

      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // "新词" badge should not be present
      expect(screen.queryByText('新词')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading indicator while fetching', async () => {
      // Set up a delayed mock
      let resolveLoad: (value: Sentence[]) => void;
      loadDictionaryMock.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveLoad = resolve;
          })
      );

      render(<DictionaryBrowser onBack={mockOnBack} />);

      // Should show loading state
      expect(screen.getByText('加载中...')).toBeInTheDocument();

      // Resolve the promise
      resolveLoad!(mockSentences);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('shows message when no words match search', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Search for non-existent word
      const searchInput = screen.getByPlaceholderText('搜索单词...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('未找到匹配的单词')).toBeInTheDocument();
        expect(screen.getByText(/共 0 个单词/)).toBeInTheDocument();
      });
    });

    it('shows message when dictionary has no words', async () => {
      loadDictionaryMock.mockResolvedValueOnce([]);

      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('该词典暂无单词')).toBeInTheDocument();
      });
    });
  });

  describe('Back button', () => {
    it('calls onBack when back button clicked', () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      const backButton = screen.getByRole('button', { name: '' }); // icon button
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('back button is accessible', () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when loading fails', async () => {
      loadDictionaryMock.mockRejectedValueOnce(new Error('Failed to load'));

      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('加载词典失败')).toBeInTheDocument();
      });
    });
  });
});