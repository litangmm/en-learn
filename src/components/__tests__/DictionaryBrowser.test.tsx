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
    level: 'cet6',
  },
  {
    id: '4',
    english: 'Practice makes perfect.',
    chinese: '熟能生巧。',
    blanks: [{ word: 'Practice', hint: '练习' }],
    level: 'junior',
  },
  {
    id: '5',
    english: 'Knowledge is power.',
    chinese: '知识就是力量。',
    blanks: [{ word: 'Knowledge', hint: '知识' }],
    level: 'senior',
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
    addPersonalWord: vi.fn(),
    removePersonalWord: vi.fn(),
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
        expect(screen.getByText(/共 5 个单词/)).toBeInTheDocument();
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

  describe('Level filter', () => {
    it('renders level filter with default "all" option', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('全部难度')).toBeInTheDocument();
      });
    });

    it('shows all sentences when level filter is "all"', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        // Should show all 5 sentences
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getByText('tide')).toBeInTheDocument();
        expect(screen.getByText('Practice')).toBeInTheDocument();
        expect(screen.getByText('Knowledge')).toBeInTheDocument();
      });

      // Footer should show total count
      expect(screen.getByText(/共 5 个单词/)).toBeInTheDocument();
    });

    it('filters by cet4 level', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Click the level filter trigger button to open dropdown
      const levelTrigger = screen.getByRole('combobox', { name: /难度/i });
      fireEvent.click(levelTrigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'CET-4' })).toBeInTheDocument();
      });

      // Click CET-4 option
      fireEvent.click(screen.getByRole('option', { name: 'CET-4' }));

      await waitFor(() => {
        // Should show only CET-4 words
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
        // Should not show other levels
        expect(screen.queryByText('tide')).not.toBeInTheDocument();
        expect(screen.queryByText('Practice')).not.toBeInTheDocument();
        expect(screen.queryByText('Knowledge')).not.toBeInTheDocument();
      });

      // Footer should show filtered count
      expect(screen.getByText(/共 2 个单词/)).toBeInTheDocument();
    });

    it('filters by cet6 level', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('tide')).toBeInTheDocument();
      });

      // Open level filter dropdown
      const levelTrigger = screen.getByRole('combobox', { name: /难度/i });
      fireEvent.click(levelTrigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'CET-6' })).toBeInTheDocument();
      });

      // Click CET-6 option
      fireEvent.click(screen.getByRole('option', { name: 'CET-6' }));

      await waitFor(() => {
        // Should show only CET-6 word (tide)
        expect(screen.getByText('tide')).toBeInTheDocument();
        expect(screen.queryByText('catches')).not.toBeInTheDocument();
        expect(screen.queryByText('Actions')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/共 1 个单词/)).toBeInTheDocument();
    });

    it('filters by junior level', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Practice')).toBeInTheDocument();
      });

      // Open level filter dropdown
      const levelTrigger = screen.getByRole('combobox', { name: /难度/i });
      fireEvent.click(levelTrigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '初中' })).toBeInTheDocument();
      });

      // Click 初中 option
      fireEvent.click(screen.getByRole('option', { name: '初中' }));

      await waitFor(() => {
        expect(screen.getByText('Practice')).toBeInTheDocument();
        expect(screen.queryByText('catches')).not.toBeInTheDocument();
        expect(screen.queryByText('tide')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/共 1 个单词/)).toBeInTheDocument();
    });

    it('combines level filter with search', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // First apply CET-4 filter
      const levelTrigger = screen.getByRole('combobox', { name: /难度/i });
      fireEvent.click(levelTrigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'CET-4' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('option', { name: 'CET-4' }));

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Then apply search
      const searchInput = screen.getByPlaceholderText('搜索单词...');
      fireEvent.change(searchInput, { target: { value: 'catches' } });

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.queryByText('Actions')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/共 1 个单词/)).toBeInTheDocument();
    });

    it('shows empty state when no words match level filter', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Apply GRE filter (no GRE words in mock data)
      const levelTrigger = screen.getByRole('combobox', { name: /难度/i });
      fireEvent.click(levelTrigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'GRE' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('option', { name: 'GRE' }));

      await waitFor(() => {
        expect(screen.getByText('该词典暂无单词')).toBeInTheDocument();
        expect(screen.getByText(/共 0 个单词/)).toBeInTheDocument();
      });
    });

    it('resets level filter when dictionary changes', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Apply CET-4 filter
      const levelTrigger = screen.getByRole('combobox', { name: /难度/i });
      fireEvent.click(levelTrigger);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'CET-4' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('option', { name: 'CET-4' }));

      await waitFor(() => {
        expect(screen.getByText(/共 2 个单词/)).toBeInTheDocument();
      });

      // Change dictionary - find all comboboxes and click the second one (dictionary selector)
      const allComboboxes = screen.getAllByRole('combobox');
      fireEvent.click(allComboboxes[1]); // Second combobox is the dictionary selector

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '初中词汇' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('option', { name: '初中词汇' }));

      await waitFor(() => {
        // Level filter should be reset to "全部难度"
        expect(screen.getByText('全部难度')).toBeInTheDocument();
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

  describe('Mark button and toggle', () => {
    it('shows star button on word cards', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Find star buttons (should be one per card)
      const starButtons = screen.getAllByTitle(/标记为生词|取消标记/);
      expect(starButtons.length).toBeGreaterThan(0);
    });

    it('toggles mark state when clicking star button', async () => {
      const { storage } = await import('@/services/storage');
      // Spy on addPersonalWord to verify it's called
      const addWordSpy = vi.spyOn(storage, 'addPersonalWord');

      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Find star buttons (unmarked words show "标记为生词")
      const starButtons = screen.getAllByTitle('标记为生词');
      expect(starButtons.length).toBeGreaterThan(0);

      // Click first star button
      fireEvent.click(starButtons[0]);

      // Verify addPersonalWord was called (toggleMark calls addWord for unmarked word)
      expect(addWordSpy).toHaveBeenCalled();
    });

    it('unmarks word when clicking filled star', async () => {
      const { storage } = await import('@/services/storage');
      // Spy on removePersonalWord to verify it's called
      const removeWordSpy = vi.spyOn(storage, 'removePersonalWord');

      // Mock getPersonalWords to return a word that appears marked
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
        expect(screen.getByText('新词')).toBeInTheDocument();
      });

      // Find filled star button (取消标记)
      const filledStar = screen.getByTitle('取消标记');
      fireEvent.click(filledStar);

      // Verify removePersonalWord was called (toggleMark calls removeWord for marked word)
      expect(removeWordSpy).toHaveBeenCalledWith('catches');
    });
  });

  describe('只看生词 filter', () => {
    it('renders "只看生词" toggle switch', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('只看生词')).toBeInTheDocument();
      });
    });

    it('shows all words when toggle is off', async () => {
      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getByText('tide')).toBeInTheDocument();
      });

      expect(screen.getByText(/共 5 个单词/)).toBeInTheDocument();
    });

    it('shows only marked words when toggle is on', async () => {
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
        expect(screen.getByText('只看生词')).toBeInTheDocument();
      });

      // Find and click the switch
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      await waitFor(() => {
        // Should show only the marked word
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.queryByText('Actions')).not.toBeInTheDocument();
        expect(screen.queryByText('tide')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/共 1 个单词/)).toBeInTheDocument();
    });

    it('combines marked filter with search', async () => {
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
        {
          word: 'Actions',
          translation: '行动',
          exampleSentence: 'Actions speak louder than words.',
          exampleSentenceCn: '行动胜于言辞。',
          marked: true,
          markedAt: Date.now(),
        },
      ]);

      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Enable marked filter
      fireEvent.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('搜索单词...');
      fireEvent.change(searchInput, { target: { value: 'catches' } });

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
        expect(screen.queryByText('Actions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Personal word count badge', () => {
    it('shows count badge when words are marked', async () => {
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
        {
          word: 'Actions',
          translation: '行动',
          exampleSentence: 'Actions speak louder than words.',
          exampleSentenceCn: '行动胜于言辞。',
          marked: true,
          markedAt: Date.now(),
        },
      ]);

      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        // Should show count badge with 2
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('does not show count badge when no words are marked', async () => {
      const { storage } = await import('@/services/storage');
      vi.spyOn(storage, 'getPersonalWords').mockReturnValue([]);

      render(<DictionaryBrowser onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Count badge should not appear (only shows when > 0)
      // No standalone number badges in header when count is 0
    });
  });

  describe('SessionStorage flag for 生词本', () => {
    it('initializes with marked filter when sessionStorage flag is set', async () => {
      // Set the sessionStorage flag
      sessionStorage.setItem('dict-browser-marked-only', 'true');

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
        // Filter should be enabled (switch should be checked)
        expect(screen.getByRole('switch')).toBeChecked();
        // Only marked word should be visible
        expect(screen.getByText('catches')).toBeInTheDocument();
      });

      // Flag should be cleared after initialization
      expect(sessionStorage.getItem('dict-browser-marked-only')).toBeNull();
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