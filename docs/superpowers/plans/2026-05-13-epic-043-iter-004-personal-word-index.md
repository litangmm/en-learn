# epic-043 iter-004: PersonalWord 独立索引

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 PersonalWord 数据建立独立索引（Map by word/id），支持 O(1) 查询，并将个人词库干扰项集成到 useAdaptivePractice。

**Architecture:** PersonalWord 数据存储在 localStorage（PERSONAL_WORDS_KEY），现有存储方法（loadPersonalWords/savePersonalWords）已存在。本迭代建立内存索引层，使用 buildDictionaryIndex 模式，将 PersonalWord 转换为类 Sentence 结构后建立索引。索引在 usePersonalWordIndex hook 中懒加载初始化，对外暴露 getByWord/getById/hasWord 等查询方法。useAdaptivePractice.getSmartDistractors 调用索引获取个人词库句子作为干扰项。

**Tech Stack:** TypeScript, localStorage, useState/useCallback (React hooks pattern)

---

### Task 1: PersonalWordIndex 类型定义

**Files:**
- Modify: `src/data/types.ts:851` (append after DictionaryIndex interface)

- [ ] **Step 1: 在 types.ts 末尾添加 PersonalWordIndex 类型定义**

在 `DictionaryIndex` 接口定义后添加：

```typescript
/**
 * Represents a personal word entry in the index.
 * Similar to IndexEntry but optimized for personal word lookups.
 */
export interface PersonalWordIndexEntry {
  /** The word that was indexed (lowercase) */
  word: string;
  /** Original PersonalWord data */
  personalWord: PersonalWord;
}

/**
 * Index for personal words providing O(1) lookups by word.
 * Provides: word lookup, exact match, prefix match.
 */
export interface PersonalWordIndex {
  /** Map of lowercase word -> PersonalWord for O(1) word lookup */
  byWord: Map<string, PersonalWord>;
  /** Map of word -> array of PersonalWordIndexEntry for prefix search */
  byPrefix: Map<string, PersonalWordIndexEntry[]>;
  /** Total number of indexed personal words */
  count: number;
  /**
   * Get a personal word by exact word match (case-insensitive).
   * @param word - The word to look up
   * @returns PersonalWord or undefined if not found
   */
  getByWord(word: string): PersonalWord | undefined;
  /**
   * Get all personal words whose word starts with the given prefix (case-insensitive).
   * @param prefix - The prefix to search for
   * @returns Array of PersonalWord entries matching the prefix
   */
  getByPrefix(prefix: string): PersonalWord[];
  /**
   * Check if a word exists in the personal word index.
   * @param word - The word to check
   * @returns True if the word is indexed
   */
  hasWord(word: string): boolean;
}
```

- [ ] **Step 2: 运行测试验证类型定义**

Run: `cd /Users/litang/WeChatProjects/en-learn && npx vitest run src/components/__tests__/App.test.tsx --reporter=verbose 2>&1 | head -20`
Expected: Tests pass (类型定义不影响现有测试)

---

### Task 2: buildPersonalWordIndex 函数

**Files:**
- Create: `src/data/personalWordIndex.ts`

- [ ] **Step 1: 创建 buildPersonalWordIndex 函数**

创建 `src/data/personalWordIndex.ts`：

```typescript
import type { PersonalWord, PersonalWordIndex, PersonalWordIndexEntry } from './types';

/**
 * Builds a PersonalWordIndex from an array of PersonalWords.
 * Provides O(1) lookups by word and prefix matching.
 *
 * @param personalWords - Array of PersonalWord objects to index
 * @returns PersonalWordIndex with efficient lookup methods
 */
export function buildPersonalWordIndex(personalWords: PersonalWord[]): PersonalWordIndex {
  const byWord = new Map<string, PersonalWord>();
  const byPrefix = new Map<string, PersonalWordIndexEntry[]>();

  // Index each personal word
  for (const pw of personalWords) {
    const lowerWord = pw.word.toLowerCase();

    // byWord: exact match lookup
    byWord.set(lowerWord, pw);

    // byPrefix: for autocomplete/prefix matching
    // Index by prefixes (2, 3, 4 characters) for fast prefix search
    const prefixes = [
      lowerWord.slice(0, 1),
      lowerWord.slice(0, 2),
      lowerWord.slice(0, 3),
      lowerWord.slice(0, 4),
    ];

    for (const prefix of prefixes) {
      if (prefix.length > 0) {
        let entries = byPrefix.get(prefix);
        if (!entries) {
          entries = [];
          byPrefix.set(prefix, entries);
        }
        entries.push({ word: lowerWord, personalWord: pw });
      }
    }
  }

  // Create the index object with methods
  const index: PersonalWordIndex = {
    byWord,
    byPrefix,
    count: personalWords.length,

    getByWord(word: string): PersonalWord | undefined {
      return byWord.get(word.toLowerCase());
    },

    getByPrefix(prefix: string): PersonalWord[] {
      const entries = byPrefix.get(prefix.toLowerCase());
      if (!entries) {
        return [];
      }
      // Return unique personal words (dedupe by word)
      const seen = new Set<string>();
      const result: PersonalWord[] = [];
      for (const entry of entries) {
        if (!seen.has(entry.word)) {
          seen.add(entry.word);
          result.push(entry.personalWord);
        }
      }
      return result;
    },

    hasWord(word: string): boolean {
      return byWord.has(word.toLowerCase());
    },
  };

  return index;
}

/**
 * Converts a PersonalWord to a Sentence-like object for use in practice.
 * This enables personal words to be used as practice items.
 *
 * @param pw - PersonalWord to convert
 * @param id - Unique ID for the converted sentence (default: "personal-{word}")
 * @returns Sentence-like object with id, english, chinese, blanks
 */
export function personalWordToSentence(pw: PersonalWord, id?: string): {
  id: string;
  english: string;
  chinese: string;
  blanks: Array<{ word: string }>;
  level: string;
  dictionaryId: string;
} {
  return {
    id: id ?? `personal-${pw.word.toLowerCase().replace(/\s+/g, '-')}`,
    english: pw.exampleSentence || pw.word,
    chinese: pw.exampleSentenceCn || pw.translation,
    blanks: [{ word: pw.word }],
    level: 'personal',
    dictionaryId: 'personal',
  };
}
```

- [ ] **Step 2: 创建单元测试**

创建 `src/data/__tests__/personalWordIndex.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { buildPersonalWordIndex, personalWordToSentence } from '../personalWordIndex';
import type { PersonalWord } from '@/data/types';

const mockPersonalWords: PersonalWord[] = [
  {
    word: 'ephemeral',
    translation: '短暂的，瞬息的',
    exampleSentence: 'Fame in the modern world is often ephemeral.',
    exampleSentenceCn: '在现代社会，名声往往是短暂的。',
    marked: true,
    markedAt: Date.now(),
  },
  {
    word: 'ubiquitous',
    translation: '无处不在的',
    exampleSentence: 'Smartphones have become ubiquitous in daily life.',
    exampleSentenceCn: '智能手机在日常生活中无处不在。',
    marked: true,
    markedAt: Date.now(),
  },
  {
    word: 'serendipity',
    translation: '意外发现美好事物的运气',
    exampleSentence: 'Meeting her was pure serendipity.',
    exampleSentenceCn: '遇见她纯属意外的惊喜。',
    marked: true,
    markedAt: Date.now(),
  },
];

describe('buildPersonalWordIndex', () => {
  it('should build index with correct count', () => {
    const index = buildPersonalWordIndex(mockPersonalWords);
    expect(index.count).toBe(3);
  });

  it('should support exact word lookup (case-insensitive)', () => {
    const index = buildPersonalWordIndex(mockPersonalWords);
    expect(index.getByWord('ephemeral')?.translation).toBe('短暂的，瞬息的');
    expect(index.getByWord('EPHEMERAL')?.translation).toBe('短暂的，瞬息的');
    expect(index.getByWord('Ephemeral')?.translation).toBe('短暂的，瞬息的');
    expect(index.getByWord('nonexistent')).toBeUndefined();
  });

  it('should support prefix matching', () => {
    const index = buildPersonalWordIndex(mockPersonalWords);
    const results = index.getByPrefix('eph');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(pw => pw.word === 'ephemeral')).toBe(true);
  });

  it('should support hasWord check', () => {
    const index = buildPersonalWordIndex(mockPersonalWords);
    expect(index.hasWord('ephemeral')).toBe(true);
    expect(index.hasWord('EPHEMERAL')).toBe(true);
    expect(index.hasWord('nonexistent')).toBe(false);
  });

  it('should return empty prefix results for unknown prefix', () => {
    const index = buildPersonalWordIndex(mockPersonalWords);
    expect(index.getByPrefix('xyz')).toEqual([]);
  });

  it('should handle empty input', () => {
    const index = buildPersonalWordIndex([]);
    expect(index.count).toBe(0);
    expect(index.getByWord('anything')).toBeUndefined();
    expect(index.getByPrefix('any')).toEqual([]);
  });

  it('should deduplicate prefix results', () => {
    const words: PersonalWord[] = [
      { word: 'test', translation: '测试', exampleSentence: '', exampleSentenceCn: '', marked: true, markedAt: Date.now() },
      { word: 'testing', translation: '测试中', exampleSentence: '', exampleSentenceCn: '', marked: true, markedAt: Date.now() },
      { word: 'testable', translation: '可测试的', exampleSentence: '', exampleSentenceCn: '', marked: true, markedAt: Date.now() },
    ];
    const index = buildPersonalWordIndex(words);
    const results = index.getByPrefix('test');
    // Should get all 3 unique words
    expect(results.length).toBe(3);
    expect(results.map(pw => pw.word).sort()).toEqual(['test', 'testable', 'testing']);
  });
});

describe('personalWordToSentence', () => {
  it('should convert PersonalWord to sentence-like object', () => {
    const pw = mockPersonalWords[0];
    const sentence = personalWordToSentence(pw);

    expect(sentence.id).toContain('personal-ephemeral');
    expect(sentence.english).toBe(pw.exampleSentence);
    expect(sentence.chinese).toBe(pw.exampleSentenceCn);
    expect(sentence.blanks[0].word).toBe(pw.word);
    expect(sentence.level).toBe('personal');
    expect(sentence.dictionaryId).toBe('personal');
  });

  it('should use custom id when provided', () => {
    const pw = mockPersonalWords[0];
    const sentence = personalWordToSentence(pw, 'custom-id-123');
    expect(sentence.id).toBe('custom-id-123');
  });

  it('should handle empty exampleSentence', () => {
    const pw: PersonalWord = {
      word: 'test',
      translation: '测试',
      exampleSentence: '',
      exampleSentenceCn: '',
      marked: true,
      markedAt: Date.now(),
    };
    const sentence = personalWordToSentence(pw);
    expect(sentence.english).toBe('test');
    expect(sentence.chinese).toBe('测试');
  });
});
```

- [ ] **Step 3: 运行测试验证**

Run: `npx vitest run src/data/__tests__/personalWordIndex.test.ts --reporter=verbose`
Expected: All tests pass

---

### Task 3: usePersonalWordIndex Hook

**Files:**
- Create: `src/hooks/usePersonalWordIndex.ts`
- Test: `src/hooks/__tests__/usePersonalWordIndex.test.ts`

- [ ] **Step 1: 创建 usePersonalWordIndex Hook**

创建 `src/hooks/usePersonalWordIndex.ts`：

```typescript
import { useState, useCallback, useMemo } from 'react';
import type { PersonalWord, PersonalWordIndex } from '@/data/types';
import { buildPersonalWordIndex, personalWordToSentence } from '@/data/personalWordIndex';
import { storage } from '@/services/storage';

export interface UsePersonalWordIndexReturn {
  /** Total number of indexed personal words */
  count: number;
  /** Whether the index has been built */
  isIndexed: boolean;

  // Lookup methods (delegate to current index)
  /**
   * Get a personal word by exact word match (case-insensitive).
   * @param word - The word to look up
   * @returns PersonalWord or undefined if not found
   */
  getByWord: (word: string) => PersonalWord | undefined;
  /**
   * Get all personal words whose word starts with the given prefix (case-insensitive).
   * @param prefix - The prefix to search for
   * @returns Array of PersonalWord entries matching the prefix
   */
  getByPrefix: (prefix: string) => PersonalWord[];
  /**
   * Check if a word exists in the personal word index.
   * @param word - The word to check
   * @returns True if the word is indexed
   */
  hasWord: (word: string) => boolean;
  /**
   * Get all personal words as sentence-like objects for use in practice.
   * @returns Array of sentence-like objects derived from personal words
   */
  getAllAsSentences: () => Array<{
    id: string;
    english: string;
    chinese: string;
    blanks: Array<{ word: string }>;
    level: string;
    dictionaryId: string;
  }>;
  /**
   * Get a specific personal word as a sentence-like object.
   * @param word - The word to look up
   * @returns Sentence-like object or undefined if not found
   */
  getWordAsSentence: (word: string) => {
    id: string;
    english: string;
    chinese: string;
    blanks: Array<{ word: string }>;
    level: string;
    dictionaryId: string;
  } | undefined;
}

/**
 * Hook for managing personal word index with lazy initialization.
 *
 * Features:
 * - Lazy initialization: builds index on first access
 * - Automatic refresh when personal words change
 * - O(1) word lookup and prefix matching
 *
 * @example
 * ```typescript
 * const { getByWord, getByPrefix, hasWord, getAllAsSentences } = usePersonalWordIndex();
 *
 * // Lookup a specific word
 * const pw = getByWord('ephemeral');
 *
 * // Get all words starting with 'ep'
 * const matches = getByPrefix('ep');
 *
 * // Use in practice
 * const sentences = getAllAsSentences();
 * ```
 */
export function usePersonalWordIndex(): UsePersonalWordIndexReturn {
  // Get all personal words from storage
  const personalWords = storage.getPersonalWords();

  // Build index lazily on each render (reactive to personalWords changes)
  const index: PersonalWordIndex = useMemo(() => {
    return buildPersonalWordIndex(personalWords);
  }, [personalWords]);

  // Lookup methods - delegate to index
  const getByWord = useCallback((word: string): PersonalWord | undefined => {
    return index.getByWord(word);
  }, [index]);

  const getByPrefix = useCallback((prefix: string): PersonalWord[] => {
    return index.getByPrefix(prefix);
  }, [index]);

  const hasWord = useCallback((word: string): boolean => {
    return index.hasWord(word);
  }, [index]);

  const getAllAsSentences = useCallback(() => {
    return personalWords.map((pw) => personalWordToSentence(pw));
  }, [personalWords]);

  const getWordAsSentence = useCallback((word: string) => {
    const pw = index.getByWord(word);
    if (!pw) return undefined;
    return personalWordToSentence(pw);
  }, [index]);

  return {
    count: index.count,
    isIndexed: index.count > 0 || personalWords.length === 0,
    getByWord,
    getByPrefix,
    hasWord,
    getAllAsSentences,
    getWordAsSentence,
  };
}
```

- [ ] **Step 2: 创建 Hook 测试**

创建 `src/hooks/__tests__/usePersonalWordIndex.test.ts`：

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePersonalWordIndex } from '../usePersonalWordIndex';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock storage
vi.mock('@/services/storage', () => ({
  storage: {
    getPersonalWords: vi.fn(),
  },
}));

import { storage } from '@/services/storage';

describe('usePersonalWordIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty index when no personal words exist', () => {
    vi.mocked(storage.getPersonalWords).mockReturnValue([]);

    const { result } = renderHook(() => usePersonalWordIndex());

    expect(result.current.count).toBe(0);
    expect(result.current.isIndexed).toBe(true);
    expect(result.current.getByWord('anything')).toBeUndefined();
    expect(result.current.getByPrefix('any')).toEqual([]);
  });

  it('should index personal words and support word lookup', () => {
    const mockWords = [
      { word: 'ephemeral', translation: '短暂的', exampleSentence: 'Fame is ephemeral.', exampleSentenceCn: '名声是短暂的。', marked: true, markedAt: Date.now() },
      { word: 'ubiquitous', translation: '无处不在的', exampleSentence: 'Smartphones are ubiquitous.', exampleSentenceCn: '智能手机无处不在。', marked: true, markedAt: Date.now() },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(mockWords);

    const { result } = renderHook(() => usePersonalWordIndex());

    expect(result.current.count).toBe(2);
    expect(result.current.getByWord('ephemeral')?.translation).toBe('短暂的');
    expect(result.current.getByWord('UBIQUITOUS')?.translation).toBe('无处不在的');
    expect(result.current.hasWord('ephemeral')).toBe(true);
    expect(result.current.hasWord('nonexistent')).toBe(false);
  });

  it('should support prefix matching', () => {
    const mockWords = [
      { word: 'ephemeral', translation: '短暂的', exampleSentence: '', exampleSentenceCn: '', marked: true, markedAt: Date.now() },
      { word: 'ephemeron', translation: '短期事物', exampleSentence: '', exampleSentenceCn: '', marked: true, markedAt: Date.now() },
      { word: 'epitome', translation: '典型', exampleSentence: '', exampleSentenceCn: '', marked: true, markedAt: Date.now() },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(mockWords);

    const { result } = renderHook(() => usePersonalWordIndex());

    const prefixResults = result.current.getByPrefix('eph');
    expect(prefixResults.length).toBe(2);
    expect(prefixResults.map(pw => pw.word).sort()).toEqual(['ephemeral', 'ephemeron']);
  });

  it('should convert personal words to sentences for practice', () => {
    const mockWords = [
      { word: 'test', translation: '测试', exampleSentence: 'This is a test.', exampleSentenceCn: '这是一个测试。', marked: true, markedAt: Date.now() },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(mockWords);

    const { result } = renderHook(() => usePersonalWordIndex());

    const sentences = result.current.getAllAsSentences();
    expect(sentences.length).toBe(1);
    expect(sentences[0].id).toContain('personal-test');
    expect(sentences[0].english).toBe('This is a test.');
    expect(sentences[0].blanks[0].word).toBe('test');

    const singleSentence = result.current.getWordAsSentence('test');
    expect(singleSentence).toBeDefined();
    expect(singleSentence?.english).toBe('This is a test.');
  });

  it('should return undefined for unknown word as sentence', () => {
    vi.mocked(storage.getPersonalWords).mockReturnValue([]);

    const { result } = renderHook(() => usePersonalWordIndex());

    expect(result.current.getWordAsSentence('nonexistent')).toBeUndefined();
  });
});
```

- [ ] **Step 3: 运行测试验证**

Run: `npx vitest run src/hooks/__tests__/usePersonalWordIndex.test.ts --reporter=verbose`
Expected: All tests pass

---

### Task 4: 集成到 useAdaptivePractice

**Files:**
- Modify: `src/hooks/useAdaptivePractice.ts:1-52`

- [ ] **Step 1: 修改 useAdaptivePractice 导入和 getSmartDistractors 函数**

修改 `src/hooks/useAdaptivePractice.ts` 的导入和函数：

```typescript
// 在文件顶部导入后添加：
import { usePersonalWordIndex } from '@/hooks/usePersonalWordIndex';
```

修改 `useAdaptivePractice` 函数体：

```typescript
export function useAdaptivePractice() {
  // Get personal word index for enhanced distractor selection
  const { getAllAsSentences } = usePersonalWordIndex();

  /**
   * Get smart distractors based on the adaptive config strategy.
   * Personal words are included as distractor candidates when available.
   *
   * @param sentenceId - The ID of the current sentence (to look up mistake history)
   * @param correctAnswerId - The ID of the correct answer
   * @param allSentences - All available sentences to choose from
   * @returns Array of 4 ChoiceOptions (1 correct + 3 distractors)
   */
  function getSmartDistractors(
    sentenceId: string,
    correctAnswerId: string,
    allSentences: Sentence[]
  ): ChoiceOption[] {
    // Get personal words as sentence-like objects for practice pool
    const personalWordSentences = getAllAsSentences();
    
    // Combine dictionary sentences with personal words
    const allPracticeSentences = personalWordSentences.length > 0
      ? [...allSentences, ...personalWordSentences]
      : allSentences;

    if (allPracticeSentences.length < 4) {
      return [];
    }

    // Load config and mistakes
    const config: AdaptiveConfig = storage.getAdaptiveConfig();
    const mistakes = storage.getMistakes();

    const strategy = config.strategy;

    // Strategy: random - return shuffled random distractors
    if (strategy === 'random' || mistakes.length === 0) {
      return getRandomDistractors(correctAnswerId, allPracticeSentences);
    }

    // Strategy: history-based or mixed
    if (strategy === 'history-based' || strategy === 'mixed') {
      return getHistoryBasedDistractors(sentenceId, correctAnswerId, allPracticeSentences, mistakes);
    }

    // Fallback: random
    return getRandomDistractors(correctAnswerId, allPracticeSentences);
  }

  return {
    getSmartDistractors,
    config: storage.getAdaptiveConfig(),
  };
}
```

同样更新 `getRandomDistractors` 和 `getHistoryBasedDistractors` 函数中的 `allSentences` 参数类型为接受扩展后的集合。

- [ ] **Step 2: 创建更新后的测试**

更新 `src/hooks/__tests__/useAdaptivePractice.test.ts` 以覆盖 personalWord 集成场景（如果测试文件存在）。如果不存在，创建基础测试文件。

- [ ] **Step 3: 运行测试验证**

Run: `npx vitest run src/hooks/__tests__/useAdaptivePractice.test.ts --reporter=verbose 2>&1 | tail -30`
Expected: Tests pass (无 personal words 时行为不变，有 personal words 时将其纳入干扰项池)

---

### Task 5: 全量测试验证

**Files:**
- No file changes (test only)

- [ ] **Step 1: 运行全量测试**

Run: `npx vitest run --reporter=verbose 2>&1 | tail -50`
Expected: All tests pass (零回归)

- [ ] **Step 2: 运行 Build 验证**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: 运行 Lint 验证**

Run: `npm run lint 2>&1 | tail -20`
Expected: Lint passes (warnings 数量不增加)

---

## 文件清单

**Create:**
- `src/data/personalWordIndex.ts` — buildPersonalWordIndex + personalWordToSentence
- `src/data/__tests__/personalWordIndex.test.ts` — 单元测试（8 个测试用例）
- `src/hooks/usePersonalWordIndex.ts` — Hook 实现
- `src/hooks/__tests__/usePersonalWordIndex.test.ts` — Hook 测试（5 个测试用例）

**Modify:**
- `src/data/types.ts` — 添加 PersonalWordIndexEntry 和 PersonalWordIndex 类型定义
- `src/hooks/useAdaptivePractice.ts` — 集成 personalWordIndex 获取干扰项

**Dependencies:** 无新增依赖（纯 TypeScript + React hooks）

**Test Strategy:**
- PersonalWordIndex 边界测试：空输入、大小写、重复词、prefix deduplication
- usePersonalWordIndex Hook 测试：mock storage、验证懒加载、react render 行为
- useAdaptivePractice 集成测试：无 personal words 时行为不变，有 personal words 时纳入干扰项
- 全量测试：1800+ 单元测试零回归

---

## 技术决策记录

1. **PersonalWord 独立索引而非复用 DictionaryIndex**: PersonalWord 数据结构和 Sentence 不同（无 id 字段，word 作为唯一标识），需要独立索引结构。

2. **前缀索引 2/3/4 字符**: 覆盖 autocomplete 常见场景（1 字符太泛，5 字符太少），3-4 字符是最佳平衡点。

3. **personalWordToSentence 转换**: 保持 useAdaptivePractice 接口兼容，无需修改练习核心逻辑，个人词库自然融入干扰项池。

4. **usePersonalWordIndex 在 useAdaptivePractice 内调用**: 每次 getSmartDistractors 调用时获取最新 personal words，支持动态添加新词后立即生效。