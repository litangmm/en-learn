# epic-043 iter-003: 搜索性能优化（debounce + 索引查询集成）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 集成 dictionary index 索引查询到 DictionaryBrowser 搜索流程，配合防抖优化搜索性能，实现 O(1) 单词级别查询替代全量扫描。

**Architecture:**
- `searchByQuery` 函数已实现，支持 `getByWord` 索引查询作为主路径，fallback 到全量扫描
- `DictionaryBrowser` 已有 300ms 防抖逻辑，但需要将 `getByWord` 方法正确传入 `searchByQuery`
- Hook 层 `useDictionaryIndex` 提供 `getByWord` 方法，需确保在 `DictionaryBrowser` 初始化时可用

**Tech Stack:** React Hooks, TypeScript, Vitest

---

## 文件结构

### 需要修改的文件
- `src/components/DictionaryBrowser.tsx` — 集成 searchByQuery + 索引查询
- `src/components/__tests__/DictionaryBrowser.test.tsx` — 更新测试 mock 以验证索引查询

### 需要创建的文件
- `src/data/__tests__/searchByQuery.integration.test.ts` — searchByQuery 集成测试（验证索引查询路径）

---

## Task 1: 验证 searchByQuery 与 index 集成

**Files:**
- Test: `src/data/__tests__/dictionaryIndex.test.ts`

- [ ] **Step 1: Review existing searchByQuery test coverage**

打开 `src/data/__tests__/dictionaryIndex.test.ts` 第 469-600 行，验证 `searchByQuery` 测试覆盖：
- 单 token 英文搜索（索引路径）
- 单 token 中文搜索（fallback 路径）
- 多 token AND 逻辑
- 大小写不敏感
- 特殊字符转义

预期：应有 20+ 测试用例覆盖各路径

- [ ] **Step 2: 添加索引命中 vs 扫描命中区分测试**

在 `src/data/__tests__/dictionaryIndex.test.ts` 的 `searchByQuery` 测试块末尾添加：

```typescript
it('uses index for single English token (O(1) path)', () => {
  // Single English token 'hello' should use getByWord('hello') index lookup
  const getByWord = vi.fn((word: string) => {
    if (word === 'hello') return ['s1', 's2'];
    return [];
  });
  
  const result = searchByQuery('hello', sentences, getByWord);
  expect(getByWord).toHaveBeenCalledWith('hello');
  expect(result).toHaveLength(2);
});

it('falls back to scan when index returns empty for single English token', () => {
  // 'nonexistent' not in index, but still found in scan fallback
  const getByWord = vi.fn(() => []);
  
  const result = searchByQuery('nonexistent', sentences, getByWord);
  expect(getByWord).toHaveBeenCalledWith('nonexistent');
  expect(result).toHaveLength(0); // No sentence contains 'nonexistent'
});

it('intersects multiple English tokens from index', () => {
  // 'hello' in s1,s2; 'world' in s1 only → intersection s1
  const getByWord = vi.fn((word: string) => {
    if (word === 'hello') return ['s1', 's2'];
    if (word === 'world') return ['s1'];
    return [];
  });
  
  const result = searchByQuery('hello world', sentences, getByWord);
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('s1');
});
```

- [ ] **Step 3: Run tests to verify searchByQuery integration**

Run: `cd /Users/litang/WeChatProjects/en-learn && npx vitest run src/data/__tests__/dictionaryIndex.test.ts -t "searchByQuery"`
Expected: All tests pass including new index integration tests

---

## Task 2: 修复 DictionaryBrowser 索引查询集成

**Files:**
- Modify: `src/components/DictionaryBrowser.tsx:59`

- [ ] **Step 1: Verify getByWord is correctly destructured from useDictionaryIndex**

检查 `DictionaryBrowser.tsx` 第 59 行：
```typescript
const { loadDictionary: loadDictionaryIndex, getByWord } = useDictionaryIndex();
```

确认 `getByWord` 方法从 hook 中正确导出。如果缺失，参考 `useDictionaryIndex.ts` 第 257-259 行的实现：
```typescript
const getByWord = useCallback((word: string): string[] => {
  return getCurrentIndex()?.getByWord(word) || [];
}, [getCurrentIndex]);
```

- [ ] **Step 2: Verify searchByQuery receives correct getByWord callback**

检查 `DictionaryBrowser.tsx` 第 135 行：
```typescript
const searchResults = searchByQuery(debouncedSearch, sentences, getByWord);
```

确认：
1. `debouncedSearch` 是防抖后的搜索词
2. `sentences` 是当前词典的完整句子列表
3. `getByWord` 是索引查询函数

- [ ] **Step 3: Verify index preloading happens before search**

检查 `DictionaryBrowser.tsx` 第 90-94 行：
```typescript
useEffect(() => {
  loadDictionaryIndex(selectedDictionaryId).catch(() => {
    // Silent fail - index loading is non-critical
  });
}, [selectedDictionaryId, loadDictionaryIndex]);
```

确认：字典切换时预加载索引，确保搜索时索引已就绪

- [ ] **Step 4: Run DictionaryBrowser tests**

Run: `cd /Users/litang/WeChatProjects/en-learn && npx vitest run src/components/__tests__/DictionaryBrowser.test.tsx`
Expected: All existing tests pass

---

## Task 3: 添加搜索性能基准测试

**Files:**
- Create: `src/data/__tests__/search-performance.benchmark.ts`

- [ ] **Step 1: Create performance benchmark test**

创建 `src/data/__tests__/search-performance.benchmark.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { buildDictionaryIndex, searchByQuery } from '../dictionaryIndex';
import type { Sentence } from '@/data/types';

/**
 * Performance benchmark for searchByQuery with index integration.
 * 
 * This test verifies that search operations complete within acceptable
 * time limits, ensuring O(1) word lookup performance.
 */
describe('searchByQuery Performance', () => {
  // Generate large dataset for performance testing (1000 sentences)
  const largeDataset: Sentence[] = Array.from({ length: 1000 }, (_, i) => ({
    id: `s${i}`,
    english: `This is sentence number ${i} for testing performance.`,
    chinese: `这是第 ${i} 个句子用于性能测试。`,
    blanks: [{ word: `word${i}`, hint: `提示${i}` }],
    level: ['junior', 'senior', 'cet4', 'cet6'][i % 4] as any,
  }));

  const index = buildDictionaryIndex(largeDataset);
  const getByWord = (word: string) => index.getByWord(word);

  it('single word search completes in under 10ms', () => {
    const start = performance.now();
    const result = searchByQuery('word500', largeDataset, getByWord);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(10);
    expect(result).toHaveLength(1);
  });

  it('multiple word search (AND) completes in under 10ms', () => {
    const start = performance.now();
    const result = searchByQuery('sentence number', largeDataset, getByWord);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(10);
  });

  it('empty query returns all in under 10ms', () => {
    const start = performance.now();
    const result = searchByQuery('', largeDataset, getByWord);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(10);
    expect(result).toHaveLength(1000);
  });
});
```

- [ ] **Step 2: Run benchmark test**

Run: `cd /Users/litang/WeChatProjects/en-learn && npx vitest run src/data/__tests__/search-performance.benchmark.ts`
Expected: All performance tests pass (under 10ms threshold)

---

## Task 4: 全量测试验证

- [ ] **Step 1: Run all dictionary-related tests**

Run: `cd /Users/litang/WeChatProjects/en-learn && npx vitest run src/data/__tests__/dictionaryIndex.test.ts src/components/__tests__/DictionaryBrowser.test.tsx src/hooks/__tests__/useDictionaryIndex.test.ts`
Expected: All tests pass

- [ ] **Step 2: Run full test suite**

Run: `cd /Users/litang/WeChatProjects/en-learn && npx vitest run --reporter=dot 2>&1 | tail -5`
Expected: Zero regressions, test count >= 1747

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/litang/WeChatProjects/en-learn && npm run build 2>&1 | tail -10`
Expected: Build successful, no type errors

- [ ] **Step 4: Commit changes**

```bash
git add src/data/__tests__/dictionaryIndex.test.ts src/components/__tests__/DictionaryBrowser.test.tsx src/data/__tests__/search-performance.benchmark.ts
git commit -m "[EVOLUTION] epic-043 iter-003: search performance optimization with index integration"
```

---

## 验证清单

- [ ] `searchByQuery` 支持索引查询（getByWord）作为主路径
- [ ] `searchByQuery` 在索引 miss 时 fallback 到全量扫描
- [ ] `DictionaryBrowser` 正确传入 `getByWord` 回调
- [ ] 300ms 防抖逻辑保持不变
- [ ] 索引预加载在字典切换时正常工作
- [ ] 所有 1747+ 测试零回归通过
- [ ] Build 成功无错误

---

## 依赖关系

- **前置依赖**: epic-043 iter-001（DictionaryIndex 类型定义 + buildDictionaryIndex）
- **并行依赖**: 无
- **后续依赖**: epic-043 iter-004（PersonalWord 独立索引）

---

## 技术决策

1. **索引 miss 时的 fallback 策略**: `searchByQuery` 在所有英文 token 都没有索引命中时，fallback 到扫描所有句子。这个行为是正确的，因为用户搜索的词可能不在当前词典中。

2. **防抖时间 300ms**: 保持现有的 300ms 防抖，平衡响应速度和 API 调用频率。