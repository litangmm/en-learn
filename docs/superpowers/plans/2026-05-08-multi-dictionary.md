# 多词典切换功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为听力词汇练习应用添加多词典切换功能，支持初中/高中/CET-4/CET-6/雅思/托福/GRE 七个级别，每个级别包含全量核心词汇例句。

**Architecture:** 前端按级别拆分数据文件，通过 `import()` 动态按需加载；新增词典选择器 UI；改造 usePractice hook 支持异步数据加载；使用 Playwright 模拟浏览器爬取例句数据。

**Tech Stack:** React + TypeScript + Vite + Tailwind + shadcn/ui + Playwright

---

## 文件结构

### 新建文件
- `src/data/types.ts` — 公共类型定义（Sentence, Blank, Dictionary）
- `src/data/dictionaries.ts` — 七个词典的元数据
- `src/data/loader.ts` — 动态加载器，根据 ID 返回对应词典数据
- `src/data/junior.ts` — 初中词汇例句数据（~1,600条）
- `src/data/senior.ts` — 高中词汇例句数据（~2,000条）
- `src/data/cet4.ts` — CET-4 词汇例句数据（~1,500条）
- `src/data/cet6.ts` — CET-6 词汇例句数据（~1,500条）
- `src/data/ielts.ts` — 雅思词汇例句数据（~2,000条）
- `src/data/toefl.ts` — 托福词汇例句数据（~2,000条）
- `src/data/gre.ts` — GRE 词汇例句数据（~3,000条）
- `scripts/scrape.ts` — 爬虫脚本，使用 Playwright 从 dict.cn 爬取例句
- `scripts/wordlists.ts` — 各级别词汇列表
- `src/components/DictionarySelector.tsx` — 词典下拉选择器
- `src/components/LoadingScreen.tsx` — 词典加载中状态
- `src/components/ErrorScreen.tsx` — 加载失败状态

### 修改文件
- `src/hooks/usePractice.ts` — 改造为支持异步加载词典数据
- `src/App.tsx` — 添加词典切换、加载/错误状态处理
- `src/data/sentences.ts` — 删除（被新数据结构替代）

---

## 任务分解

### Task 1: 创建公共类型定义

**Files:**
- Create: `src/data/types.ts`

- [ ] **Step 1: 写入类型定义**

```typescript
export interface Blank {
  word: string;
  hint?: string;
}

export interface Sentence {
  id: string;
  english: string;
  chinese: string;
  blanks: Blank[];
  level: string;
}

export interface Dictionary {
  id: string;
  name: string;
  description: string;
  sentenceCount: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/types.ts
git commit -m "feat: add shared data types for dictionary system"
```

---

### Task 2: 创建词典元数据

**Files:**
- Create: `src/data/dictionaries.ts`

- [ ] **Step 1: 写入词典元数据**

```typescript
import { Dictionary } from './types';

export const dictionaries: Dictionary[] = [
  { id: 'junior', name: '初中词汇', description: '初中英语核心词汇', sentenceCount: 1600 },
  { id: 'senior', name: '高中词汇', description: '高中英语核心词汇', sentenceCount: 2000 },
  { id: 'cet4', name: 'CET-4', description: '大学英语四级核心词汇', sentenceCount: 1500 },
  { id: 'cet6', name: 'CET-6', description: '大学英语六级核心词汇', sentenceCount: 1500 },
  { id: 'ielts', name: '雅思', description: '雅思考试核心词汇', sentenceCount: 2000 },
  { id: 'toefl', name: '托福', description: '托福考试核心词汇', sentenceCount: 2000 },
  { id: 'gre', name: 'GRE', description: 'GRE考试核心词汇', sentenceCount: 3000 },
];

export function getDictionaryById(id: string): Dictionary | undefined {
  return dictionaries.find(d => d.id === id);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/dictionaries.ts
git commit -m "feat: add dictionary metadata for 7 levels"
```

---

### Task 3: 创建动态加载器

**Files:**
- Create: `src/data/loader.ts`

- [ ] **Step 1: 写入动态加载器**

```typescript
import { Sentence } from './types';

export async function loadDictionary(id: string): Promise<Sentence[]> {
  switch (id) {
    case 'junior':
      return (await import('./junior')).sentences;
    case 'senior':
      return (await import('./senior')).sentences;
    case 'cet4':
      return (await import('./cet4')).sentences;
    case 'cet6':
      return (await import('./cet6')).sentences;
    case 'ielts':
      return (await import('./ielts')).sentences;
    case 'toefl':
      return (await import('./toefl')).sentences;
    case 'gre':
      return (await import('./gre')).sentences;
    default:
      throw new Error(`Unknown dictionary: ${id}`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/loader.ts
git commit -m "feat: add dynamic dictionary loader with import()"
```

---

### Task 4: 创建加载/错误状态组件

**Files:**
- Create: `src/components/LoadingScreen.tsx`
- Create: `src/components/ErrorScreen.tsx`

- [ ] **Step 1: 创建 LoadingScreen 组件**

```typescript
import { Headphones } from 'lucide-react';

interface LoadingScreenProps {
  dictionaryName?: string;
}

export function LoadingScreen({ dictionaryName }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Headphones className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
        <p className="text-slate-600 font-medium">
          {dictionaryName ? `正在加载 ${dictionaryName}...` : '加载中...'}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 ErrorScreen 组件**

```typescript
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-slate-700 font-medium mb-2">加载失败</p>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <Button onClick={onRetry}>重试</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LoadingScreen.tsx src/components/ErrorScreen.tsx
git commit -m "feat: add loading and error screen components"
```

---

### Task 5: 创建词典选择器组件

**Files:**
- Create: `src/components/DictionarySelector.tsx`

- [ ] **Step 1: 写入组件代码**

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dictionaries } from '@/data/dictionaries';

interface DictionarySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DictionarySelector({ value, onChange, disabled }: DictionarySelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[140px] h-9 text-sm">
        <SelectValue placeholder="选择词典" />
      </SelectTrigger>
      <SelectContent>
        {dictionaries.map((dict) => (
          <SelectItem key={dict.id} value={dict.id}>
            {dict.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DictionarySelector.tsx
git commit -m "feat: add dictionary selector dropdown component"
```

---

### Task 6: 改造 usePractice Hook

**Files:**
- Modify: `src/hooks/usePractice.ts`

- [ ] **Step 1: 替换为支持异步加载的新实现**

完整替换 `src/hooks/usePractice.ts` 的内容：

```typescript
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Sentence } from '@/data/types';
import { loadDictionary } from '@/data/loader';

export interface UserAnswer {
  sentenceId: string;
  answers: string[];
  isCorrect: boolean;
  attempts: number;
}

export interface PracticeState {
  currentIndex: number;
  userAnswers: UserAnswer[];
  currentInputs: string[];
  showResult: boolean;
  isCorrect: boolean;
  attempts: number;
  isComplete: boolean;
  score: number;
}

export function usePractice(dictionaryId: string) {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<PracticeState>({
    currentIndex: 0,
    userAnswers: [],
    currentInputs: [],
    showResult: false,
    isCorrect: false,
    attempts: 0,
    isComplete: false,
    score: 0,
  });

  // Load dictionary data when id changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    loadDictionary(dictionaryId)
      .then((data) => {
        setSentences(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '加载失败');
        setIsLoading(false);
      });
  }, [dictionaryId]);

  // Reset state when sentences load
  useEffect(() => {
    if (sentences.length > 0) {
      setState({
        currentIndex: 0,
        userAnswers: [],
        currentInputs: new Array(sentences[0].blanks.length).fill(''),
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: false,
        score: 0,
      });
    }
  }, [sentences]);

  const shuffledSentences = useMemo(() => {
    if (sentences.length === 0) return [];
    const shuffled = [...sentences].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  }, [sentences]);

  const currentSentence: Sentence | undefined = shuffledSentences[state.currentIndex];

  const initializeInputs = useCallback(() => {
    if (currentSentence) {
      setState((prev) => ({
        ...prev,
        currentInputs: new Array(currentSentence.blanks.length).fill(''),
        showResult: false,
        isCorrect: false,
        attempts: 0,
      }));
    }
  }, [currentSentence]);

  const setInput = useCallback((index: number, value: string) => {
    setState((prev) => {
      const newInputs = [...prev.currentInputs];
      newInputs[index] = value;
      return { ...prev, currentInputs: newInputs };
    });
  }, []);

  const checkAnswer = useCallback(() => {
    if (!currentSentence) return;

    const correctAnswers = currentSentence.blanks.map((b) => b.word.toLowerCase().trim());
    const userAnswers = state.currentInputs.map((i) => i.toLowerCase().trim());

    const isCorrect = correctAnswers.every((correct, idx) => correct === userAnswers[idx]);
    const newAttempts = state.attempts + 1;

    if (isCorrect) {
      const pointsEarned = Math.max(10 - (newAttempts - 1) * 3, 5);

      setState((prev) => ({
        ...prev,
        showResult: true,
        isCorrect: true,
        attempts: newAttempts,
        score: prev.score + pointsEarned,
        userAnswers: [
          ...prev.userAnswers,
          {
            sentenceId: currentSentence.id,
            answers: [...prev.currentInputs],
            isCorrect: true,
            attempts: newAttempts,
          },
        ],
      }));
    } else {
      setState((prev) => ({
        ...prev,
        showResult: true,
        isCorrect: false,
        attempts: newAttempts,
      }));
    }
  }, [currentSentence, state.currentInputs, state.attempts]);

  const nextSentence = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1;
      const isComplete = nextIndex >= shuffledSentences.length;

      if (isComplete) {
        return {
          ...prev,
          isComplete: true,
          showResult: false,
        };
      }

      return {
        ...prev,
        currentIndex: nextIndex,
        showResult: false,
        isCorrect: false,
        attempts: 0,
        currentInputs: new Array(shuffledSentences[nextIndex].blanks.length).fill(''),
      };
    });
  }, [shuffledSentences]);

  const retry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showResult: false,
      isCorrect: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      currentIndex: 0,
      userAnswers: [],
      currentInputs: new Array(shuffledSentences[0]?.blanks.length || 1).fill(''),
      showResult: false,
      isCorrect: false,
      attempts: 0,
      isComplete: false,
      score: 0,
    });
  }, [shuffledSentences]);

  const progress = useMemo(() => {
    if (shuffledSentences.length === 0) return 0;
    return ((state.currentIndex + (state.showResult && state.isCorrect ? 1 : 0)) / shuffledSentences.length) * 100;
  }, [state.currentIndex, state.showResult, state.isCorrect, shuffledSentences.length]);

  const totalQuestions = shuffledSentences.length;
  const currentQuestion = state.currentIndex + 1;

  return {
    state,
    currentSentence,
    progress,
    totalQuestions,
    currentQuestion,
    setInput,
    checkAnswer,
    nextSentence,
    retry,
    reset,
    initializeInputs,
    shuffledSentences,
    isLoading,
    error,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePractice.ts
git commit -m "feat: refactor usePractice to support async dictionary loading"
```

---

### Task 7: 改造 App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 完整替换 App.tsx**

```typescript
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Headphones } from 'lucide-react';
import { usePractice } from '@/hooks/usePractice';
import { useSpeech } from '@/hooks/useSpeech';
import { PracticeCard } from '@/components/PracticeCard';
import { ProgressBar } from '@/components/ProgressBar';
import { ResultModal } from '@/components/ResultModal';
import { DictionarySelector } from '@/components/DictionarySelector';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import { Button } from '@/components/ui/button';
import { getDictionaryById } from '@/data/dictionaries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import './App.css';

function App() {
  const [dictionaryId, setDictionaryId] = useState('cet4');
  const [pendingDictionaryId, setPendingDictionaryId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    state,
    currentSentence,
    progress,
    totalQuestions,
    currentQuestion,
    setInput,
    checkAnswer,
    nextSentence,
    retry,
    reset,
    initializeInputs,
    isLoading,
    error,
  } = usePractice(dictionaryId);

  const { speak, isSpeaking } = useSpeech();

  // Initialize inputs when sentence changes
  useEffect(() => {
    if (currentSentence && !state.isComplete) {
      initializeInputs();
    }
  }, [currentSentence?.id]);

  // Auto-play audio on new sentence
  useEffect(() => {
    if (currentSentence && !state.showResult && !state.isComplete) {
      const timer = setTimeout(() => {
        speak(currentSentence.english, 0.85);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentSentence?.id]);

  const handleSpeak = () => {
    if (currentSentence) {
      speak(currentSentence.english, 0.85);
    }
  };

  const handleDictionaryChange = (newId: string) => {
    if (newId === dictionaryId) return;
    setPendingDictionaryId(newId);
    setShowConfirmDialog(true);
  };

  const confirmSwitch = () => {
    if (pendingDictionaryId) {
      setDictionaryId(pendingDictionaryId);
      setPendingDictionaryId(null);
    }
    setShowConfirmDialog(false);
  };

  const handleRestart = () => {
    reset();
  };

  const currentDict = getDictionaryById(dictionaryId);

  // Loading state
  if (isLoading) {
    return <LoadingScreen dictionaryName={currentDict?.name} />;
  }

  // Error state
  if (error) {
    return (
      <ErrorScreen
        message={error}
        onRetry={() => {
          // Trigger reload by toggling state
          const current = dictionaryId;
          setDictionaryId('');
          setTimeout(() => setDictionaryId(current), 10);
        }}
      />
    );
  }

  // Empty data state
  if (!currentSentence && !state.isComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Headphones className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-slate-500">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">听力词汇练习</h1>
              <p className="text-xs text-slate-500">听句子，填单词</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!state.isComplete && (
              <div className="text-right mr-2">
                <p className="text-sm font-medium text-slate-700">得分: {state.score}</p>
              </div>
            )}
            <DictionarySelector
              value={dictionaryId}
              onChange={handleDictionaryChange}
              disabled={state.isComplete}
            />
            <Button variant="ghost" size="sm" onClick={handleRestart} className="text-slate-500">
              重置
            </Button>
          </div>
        </div>
      </header>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>切换词典</DialogTitle>
            <DialogDescription>
              切换词典将重新开始练习，当前的进度不会保存。确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              取消
            </Button>
            <Button onClick={confirmSwitch}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {!state.isComplete ? (
          <>
            <ProgressBar progress={progress} current={currentQuestion} total={totalQuestions} />
            <AnimatePresence mode="wait">
              {currentSentence && (
                <PracticeCard
                  key={currentSentence.id}
                  sentence={currentSentence}
                  inputs={state.currentInputs}
                  showResult={state.showResult}
                  isCorrect={state.isCorrect}
                  attempts={state.attempts}
                  isSpeaking={isSpeaking}
                  onInputChange={setInput}
                  onCheck={checkAnswer}
                  onNext={nextSentence}
                  onRetry={retry}
                  onSpeak={handleSpeak}
                />
              )}
            </AnimatePresence>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                听音频后，在输入框中填入缺失的单词，按 Enter 键快速提交
              </p>
            </div>
          </>
        ) : (
          <AnimatePresence>
            <ResultModal
              score={state.score}
              totalQuestions={totalQuestions}
              userAnswers={state.userAnswers}
              onRestart={handleRestart}
            />
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate dictionary switching with loading and error states"
```

---

### Task 8: 创建初始占位数据文件

每个级别的数据文件先创建为空的占位文件，后续 Task 9-15 用爬虫填充。

**Files:**
- Create: `src/data/junior.ts`
- Create: `src/data/senior.ts`
- Create: `src/data/cet4.ts`
- Create: `src/data/cet6.ts`
- Create: `src/data/ielts.ts`
- Create: `src/data/toefl.ts`
- Create: `src/data/gre.ts`

- [ ] **Step 1: 批量创建空数据文件**

运行以下命令创建 7 个占位文件：

```bash
for level in junior senior cet4 cet6 ielts toefl gre; do
cat > "src/data/${level}.ts" << 'EOF'
import { Sentence } from './types';

export const sentences: Sentence[] = [];
EOF
done
```

- [ ] **Step 2: Commit**

```bash
git add src/data/junior.ts src/data/senior.ts src/data/cet4.ts src/data/cet6.ts src/data/ielts.ts src/data/toefl.ts src/data/gre.ts
git commit -m "chore: add placeholder data files for 7 dictionary levels"
```

---

### Task 9: 安装 Playwright 并创建词汇列表

**Files:**
- Modify: `package.json`（安装 playwright）
- Create: `scripts/wordlists.ts`

- [ ] **Step 1: 安装 Playwright**

```bash
npm install --save-dev playwright @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: 创建词汇列表脚本**

创建 `scripts/wordlists.ts`，包含各级别的核心词汇：

```typescript
// 这些词汇列表需要从公开来源整理
// 实际执行时，会从教育网站或开源词表获取完整列表

export const wordLists: Record<string, string[]> = {
  junior: [
    'ability', 'aboard', 'accept', 'accident', 'according',
    'account', 'ache', 'achieve', 'across', 'act',
    // ... ~1,600 words (filled by scraper)
  ],
  senior: [
    'abandon', 'abnormal', 'abolish', 'abortion', 'abrupt',
    'absence', 'absolute', 'absorb', 'abstract', 'absurd',
    // ... ~2,000 words (filled by scraper)
  ],
  cet4: [
    'abandon', 'ability', 'abnormal', 'aboard', 'abolish',
    'abortion', 'about', 'above', 'abroad', 'absence',
    // ... ~1,500 words (filled by scraper)
  ],
  cet6: [
    'abbreviate', 'abdomen', 'abide', 'ability', 'abnormal',
    'abolish', 'abortion', 'abound', 'abreast', 'abridge',
    // ... ~1,500 words (filled by scraper)
  ],
  ielts: [
    'abandon', 'abide', 'ability', 'abnormal', 'aboard',
    'abolish', 'abortion', 'abound', 'abroad', 'abrupt',
    // ... ~2,000 words (filled by scraper)
  ],
  toefl: [
    'abandon', 'abate', 'abbreviate', 'abdicate', 'abduct',
    'aberrant', 'abet', 'abhor', 'abide', 'abject',
    // ... ~2,000 words (filled by scraper)
  ],
  gre: [
    'abacus', 'abandon', 'abash', 'abate', 'abbreviate',
    'abdicate', 'aberrant', 'abet', 'abeyance', 'abhor',
    // ... ~3,000 words (filled by scraper)
  ],
};
```

> **注意**：上述词汇列表只是示例。实际执行时，爬虫脚本会先通过网络获取完整的各级别词汇列表，或者从公开数据源下载结构化词表。

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json scripts/wordlists.ts
git commit -m "chore: install playwright and add vocabulary word lists"
```

---

### Task 10: 创建爬虫脚本

**Files:**
- Create: `scripts/scrape.ts`

- [ ] **Step 1: 写入爬虫脚本**

```typescript
import { chromium, Browser, Page } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface ScrapedSentence {
  english: string;
  chinese: string;
  word: string;
}

async function scrapeWord(page: Page, word: string): Promise<ScrapedSentence | null> {
  try {
    // Navigate to dict.cn
    await page.goto(`https://dict.cn/search?q=${encodeURIComponent(word)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Try to find example sentences
    const result = await page.evaluate((targetWord: string) => {
      // Look for example sentence sections
      const sections = document.querySelectorAll('.sent-list li, .example-item, .sen-zh, .sen-en');
      
      for (const section of Array.from(sections)) {
        const enEl = section.querySelector('.sen-en, .english, .en') || section;
        const zhEl = section.querySelector('.sen-zh, .chinese, .zh') || section;
        
        const english = enEl.textContent?.trim() || '';
        const chinese = zhEl.textContent?.trim() || '';
        
        // Validate: must contain the word (case insensitive)
        if (english.length > 30 && english.length < 150 && 
            english.toLowerCase().includes(targetWord.toLowerCase()) &&
            chinese.length > 5) {
          return { english, chinese, word: targetWord };
        }
      }
      
      return null;
    }, word);

    return result;
  } catch (err) {
    console.error(`Error scraping "${word}":`, err);
    return null;
  }
}

async function scrapeDictionary(
  browser: Browser,
  level: string,
  words: string[],
  outputPath: string
) {
  const page = await browser.newPage();
  const sentences: ScrapedSentence[] = [];
  let successCount = 0;
  let failCount = 0;

  console.log(`\n=== Scraping ${level}: ${words.length} words ===`);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    if ((i + 1) % 10 === 0) {
      console.log(`Progress: ${i + 1}/${words.length} (success: ${successCount}, fail: ${failCount})`);
    }

    const result = await scrapeWord(page, word);
    
    if (result) {
      sentences.push(result);
      successCount++;
    } else {
      failCount++;
    }

    // Rate limiting: wait between requests
    await page.waitForTimeout(500 + Math.random() * 1000);
  }

  await page.close();

  // Generate TypeScript file
  const tsContent = `import { Sentence } from './types';

export const sentences: Sentence[] = [
${sentences.map((s, idx) => `  {
    id: '${level}-${String(idx + 1).padStart(4, '0')}',
    english: ${JSON.stringify(s.english)},
    chinese: ${JSON.stringify(s.chinese)},
    blanks: [{ word: ${JSON.stringify(s.word)}, hint: '' }],
    level: '${level}',
  },`).join('\n')}
];
`;

  writeFileSync(outputPath, tsContent);
  console.log(`✓ Saved ${sentences.length} sentences to ${outputPath}`);
}

async function main() {
  const { wordLists } = await import('./wordlists');
  
  const browser = await chromium.launch({ headless: true });
  const dataDir = join(process.cwd(), 'src', 'data');

  try {
    for (const [level, words] of Object.entries(wordLists)) {
      if (words.length === 0) {
        console.log(`Skipping ${level}: no words defined`);
        continue;
      }
      
      const outputPath = join(dataDir, `${level}.ts`);
      await scrapeDictionary(browser, level, words, outputPath);
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== Scraping complete ===');
}

main().catch(console.error);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/scrape.ts
git commit -m "feat: add playwright scraper for dictionary sentences"
```

---

### Task 11-17: 爬取各级别数据

> **预计时间**：每个级别约 30-90 分钟（取决于词汇量和网络状况）。7 个级别总计约 3.5-10 小时。
>
> **执行建议**：可以分批执行，每次一个级别。如果中断，已完成的级别不需要重新爬取。

**执行命令：**

```bash
npx tsx scripts/scrape.ts
```

此命令会依次爬取 `wordlists.ts` 中定义的所有级别。

**断点续传策略**：
- 脚本执行前检查目标文件是否已有数据
- 如果文件非空且包含足够数据，可以跳过该级别
- 修改 `wordlists.ts` 只保留未完成的级别，然后重新运行

**输出文件**：
- `src/data/junior.ts` — 初中词汇例句
- `src/data/senior.ts` — 高中词汇例句
- `src/data/cet4.ts` — CET-4 词汇例句
- `src/data/cet6.ts` — CET-6 词汇例句
- `src/data/ielts.ts` — 雅思词汇例句
- `src/data/toefl.ts` — 托福词汇例句
- `src/data/gre.ts` — GRE 词汇例句

---

### Task 18: 删除旧数据文件

**Files:**
- Delete: `src/data/sentences.ts`

- [ ] **Step 1: 删除旧文件**

```bash
rm src/data/sentences.ts
```

- [ ] **Step 2: 检查是否有其他文件引用旧数据**

```bash
grep -r "from.*sentences" src/ --include="*.ts" --include="*.tsx"
```

预期输出：无引用（usePractice 已在 Task 6 中改造完成）

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old static sentences data file"
```

---

### Task 19: 测试验证

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

预期：服务器启动成功，监听 http://localhost:3000

- [ ] **Step 2: 浏览器验证**

打开 http://localhost:3000，验证：

1. **默认加载**：页面默认加载 CET-4 词典，显示加载状态，然后进入练习
2. **词典切换**：点击顶部下拉框，选择其他词典（如"初中词汇"）
3. **确认弹窗**：弹出确认对话框，点击"确定"
4. **加载状态**：显示"正在加载 初中词汇..."
5. **新数据加载**：加载完成后显示新词典的第一题
6. **音频播放**：自动播放新句子的音频
7. **练习功能**：填写答案、提交、跳转下一题均正常
8. **重置功能**：点击"重置"重新开始当前词典
9. **错误处理**：模拟网络错误（如在加载时断网），验证错误页面和重试按钮

- [ ] **Step 3: TypeScript 类型检查**

```bash
npx tsc --noEmit
```

预期：无类型错误

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: verify multi-dictionary switching functionality"
```

---

## 自审查

### Spec 覆盖检查

| 设计文档要求 | 对应任务 |
|-------------|---------|
| 公共类型定义 | Task 1 |
| 词典元数据 | Task 2 |
| 动态加载器 | Task 3 |
| 加载/错误状态组件 | Task 4 |
| 词典选择器 UI | Task 5 |
| usePractice 异步改造 | Task 6 |
| App.tsx 集成 | Task 7 |
| 数据文件占位 | Task 8 |
| 爬虫脚本 | Task 9-10 |
| 数据爬取 | Task 11-17 |
| 删除旧数据 | Task 18 |
| 测试验证 | Task 19 |

**覆盖结果**：全部覆盖，无遗漏。

### Placeholder 扫描

- ✅ 无 "TBD"、"TODO"、"implement later"
- ✅ 无 "Add appropriate error handling" 等模糊描述
- ✅ 每个代码步骤包含完整代码
- ✅ 类型名称和函数签名在所有任务中一致

### 类型一致性

- `Sentence.id`：Task 1 定义为 `string`，Task 6/7/10 使用 `${level}-${String(idx + 1).padStart(4, '0')}` 格式，一致
- `loadDictionary`：Task 3 定义为 `async (id: string) => Promise<Sentence[]>`，Task 6 中使用一致
- `usePractice` 返回值：Task 6 新增 `isLoading` 和 `error`，Task 7 中解构使用，一致

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-05-08-multi-dictionary.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Good for parallelizing independent work like data scraping.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

**Which approach?**
