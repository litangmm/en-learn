# 动态提示级别 (Adaptive Hint Levels) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 根据用户答题状态（连续对/连续错）动态调整首字母提示显示概率，填空/听写/填空三种模式均可适配。

**Architecture:**
- 新增 `HintLevel` 类型定义（none/low/medium/high）和 `HintConfig` 配置存储
- 创建 `useHintLevel` hook 追踪连续正确/错误次数，基于阈值自动升降 hint level
- HintConfig 通过 storage 持久化，用户可手动选择 hint level
- `DictationMode` 和 `FillInBlanksMode` 接收 hint level prop，控制首字母提示显示概率

**Tech Stack:** React hooks, storage service, Tailwind CSS

---

## File Structure

| 职责 | 文件 |
|------|------|
| Hint 类型定义 | `src/data/types.ts` |
| Hint 配置存储 | `src/services/storage.ts` |
| Hint level hook | `src/hooks/useHintLevel.ts` (新建) |
| Hook 单元测试 | `src/hooks/__tests__/useHintLevel.test.ts` (新建) |
| DictationMode 更新 | `src/components/practice/modes/DictationMode.tsx` |
| FillInBlanksMode 更新 | `src/components/practice/modes/FillInBlanksMode.tsx` |
| usePractice 更新 | `src/hooks/usePractice.ts` |

---

## Task 1: Add Hint Types to types.ts

**Files:** Modify: `src/data/types.ts:260-270`

- [ ] **Step 1: Add HintLevel type and HintConfig interface**

Add after the existing `AdaptiveConfig` definition (around line 259):

```typescript
/**
 * Hint display level for practice modes.
 * Controls how much help users get when answering questions.
 * - 'none': No hints shown (hardest)
 * - 'low': Hints shown 30% of the time
 * - 'medium': Hints shown 60% of the time
 * - 'high': Hints shown 100% of the time (easiest)
 */
export type HintLevel = 'none' | 'low' | 'medium' | 'high';

/**
 * Configuration for adaptive hint level display.
 */
export interface HintConfig {
  /** Current hint level */
  level: HintLevel;
  /** Manual override: if true, ignore adaptive calculation */
  manualOverride: boolean;
  /** User's consecutive correct answers */
  streakCorrect: number;
  /** User's consecutive incorrect answers */
  streakIncorrect: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/types.ts
git commit -m "[EVOLUTION] epic-010 iter-002: add HintLevel and HintConfig types"
```

---

## Task 2: Add Hint Storage to storage.ts

**Files:** Modify: `src/services/storage.ts`

- [ ] **Step 1: Read storage.ts to find adaptive config section**

Find where `ADAPTIVE_CONFIG_KEY` is defined.

- [ ] **Step 2: Add HINT_CONFIG_KEY constant and validator**

Add after `ADAPTIVE_CONFIG_KEY` definition:

```typescript
const HINT_CONFIG_KEY = 'en-learn:hint-config';
```

- [ ] **Step 3: Add getHintConfig, saveHintConfig, getDefaultHintConfig**

Add after `getAdaptiveConfig` / `saveAdaptiveConfig`:

```typescript
export function getHintConfig(): HintConfig {
  try {
    const stored = localStorage.getItem(HINT_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidHintConfig(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return getDefaultHintConfig();
}

export function saveHintConfig(config: HintConfig): void {
  localStorage.setItem(HINT_CONFIG_KEY, JSON.stringify(config));
}

export function getDefaultHintConfig(): HintConfig {
  return {
    level: 'medium',
    manualOverride: false,
    streakCorrect: 0,
    streakIncorrect: 0,
  };
}

function isValidHintConfig(obj: unknown): obj is HintConfig {
  if (typeof obj !== 'object' || obj === null) return false;
  const c = obj as Record<string, unknown>;
  return (
    ['none', 'low', 'medium', 'high'].includes(c.level as string) &&
    typeof c.manualOverride === 'boolean' &&
    typeof c.streakCorrect === 'number' &&
    typeof c.streakIncorrect === 'number'
  );
}
```

- [ ] **Step 4: Add resetHintStreak helper**

Add after `isValidHintConfig`:

```typescript
export function resetHintStreak(): void {
  const config = getHintConfig();
  if (!config.manualOverride) {
    saveHintConfig({ ...config, streakCorrect: 0, streakIncorrect: 0 });
  }
}
```

- [ ] **Step 5: Run tests to verify storage still works**

Run: `cd /Users/litang/WeChatProjects/en-learn && npx vitest run src/services/__tests__/storage.test.ts`
Expected: PASS (existing tests should not be broken)

- [ ] **Step 6: Commit**

```bash
git add src/services/storage.ts
git commit -m "[EVOLUTION] epic-010 iter-002: add hint config storage with streak tracking"
```

---

## Task 3: Create useHintLevel Hook

**Files:** Create: `src/hooks/useHintLevel.ts`

- [ ] **Step 1: Write failing test**

Create `src/hooks/__tests__/useHintLevel.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useHintLevel } from '../useHintLevel';
import { storage } from '@/services/storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useHintLevel', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Reset to default config
    const defaultConfig = {
      level: 'medium',
      manualOverride: false,
      streakCorrect: 0,
      streakIncorrect: 0,
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultConfig));
  });

  it('should return default medium level on mount', () => {
    const { result } = renderHook(() => useHintLevel());
    expect(result.current.hintLevel).toBe('medium');
    expect(result.current.isManualOverride).toBe(false);
  });

  it('should return high level after 5 consecutive correct answers', () => {
    const { result } = renderHook(() => useHintLevel());

    // Simulate 5 correct answers
    for (let i = 0; i < 5; i++) {
      act(() => { result.current.recordAnswer(true); });
    }

    expect(result.current.hintLevel).toBe('high');
  });

  it('should return none level after 3 consecutive incorrect answers', () => {
    const { result } = renderHook(() => useHintLevel());

    // Simulate 3 incorrect answers
    for (let i = 0; i < 3; i++) {
      act(() => { result.current.recordAnswer(false); });
    }

    expect(result.current.hintLevel).toBe('none');
  });

  it('should reset streak and return medium when switching to manual override', () => {
    const { result } = renderHook(() => useHintLevel());

    // Get some streak going
    act(() => { result.current.recordAnswer(true); });
    act(() => { result.current.recordAnswer(true); });

    // Switch to manual
    act(() => { result.current.setManualOverride(true, 'low'); });

    expect(result.current.hintLevel).toBe('low');
    expect(result.current.isManualOverride).toBe(true);
  });

  it('should return hint probability based on level', () => {
    const { result } = renderHook(() => useHintLevel());

    expect(result.current.getHintProbability()).toBe(0.6); // medium = 60%

    act(() => { result.current.setManualOverride(true, 'high'); });
    expect(result.current.getHintProbability()).toBe(1.0); // high = 100%

    act(() => { result.current.setManualOverride(true, 'low'); });
    expect(result.current.getHintProbability()).toBe(0.3); // low = 30%

    act(() => { result.current.setManualOverride(true, 'none'); });
    expect(result.current.getHintProbability()).toBe(0.0); // none = 0%
  });

  it('should persist config to storage on changes', () => {
    const { result } = renderHook(() => useHintLevel());

    act(() => { result.current.recordAnswer(true); });
    act(() => { result.current.recordAnswer(true); });

    expect(localStorageMock.setItem).toHaveBeenCalled();
    const lastCall = localStorageMock.setItem.mock.calls.at(-1);
    const savedConfig = JSON.parse(lastCall?.[1] as string);
    expect(savedConfig.streakCorrect).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useHintLevel.test.ts`
Expected: FAIL with "useHintLevel is not a function"

- [ ] **Step 3: Write minimal implementation**

Create `src/hooks/useHintLevel.ts`:

```typescript
import { useState, useCallback, useMemo } from 'react';
import type { HintLevel, HintConfig } from '@/data/types';
import { storage } from '@/services/storage';

// Hint level thresholds
const CORRECT_THRESHOLD = 5; // 5 consecutive correct → high
const INCORRECT_THRESHOLD = 3; // 3 consecutive incorrect → none

// Hint probability per level
const HINT_PROBABILITIES: Record<HintLevel, number> = {
  none: 0,
  low: 0.3,
  medium: 0.6,
  high: 1.0,
};

export function useHintLevel() {
  const [config, setConfig] = useState<HintConfig>(() => storage.getHintConfig());

  // Calculate hint level based on streak (only when not manual override)
  const hintLevel = useMemo<HintLevel>(() => {
    if (config.manualOverride) {
      return config.level;
    }

    // High level: 5+ consecutive correct
    if (config.streakCorrect >= CORRECT_THRESHOLD) {
      return 'high';
    }

    // None level: 3+ consecutive incorrect
    if (config.streakIncorrect >= INCORRECT_THRESHOLD) {
      return 'none';
    }

    // Medium level: default
    return 'medium';
  }, [config.manualOverride, config.level, config.streakCorrect, config.streakIncorrect]);

  // Record an answer and update streaks
  const recordAnswer = useCallback((isCorrect: boolean) => {
    setConfig((prev) => {
      if (prev.manualOverride) return prev;

      const newConfig: HintConfig = { ...prev };

      if (isCorrect) {
        newConfig.streakCorrect = prev.streakCorrect + 1;
        newConfig.streakIncorrect = 0;
      } else {
        newConfig.streakIncorrect = prev.streakIncorrect + 1;
        newConfig.streakCorrect = 0;
      }

      storage.saveHintConfig(newConfig);
      return newConfig;
    });
  }, []);

  // Set manual override
  const setManualOverride = useCallback((enabled: boolean, level?: HintLevel) => {
    setConfig((prev) => {
      const newConfig: HintConfig = {
        ...prev,
        manualOverride: enabled,
        level: level ?? prev.level,
        streakCorrect: enabled ? 0 : prev.streakCorrect,
        streakIncorrect: enabled ? 0 : prev.streakIncorrect,
      };
      storage.saveHintConfig(newConfig);
      return newConfig;
    });
  }, []);

  // Get hint display probability for current level
  const getHintProbability = useCallback((): number => {
    return HINT_PROBABILITIES[hintLevel];
  }, [hintLevel]);

  // Check if hint should be shown (probabilistic based on level)
  const shouldShowHint = useCallback((): boolean => {
    if (hintLevel === 'none') return false;
    if (hintLevel === 'high') return true;

    const probability = HINT_PROBABILITIES[hintLevel];
    return Math.random() < probability;
  }, [hintLevel]);

  return {
    hintLevel,
    isManualOverride: config.manualOverride,
    recordAnswer,
    setManualOverride,
    getHintProbability,
    shouldShowHint,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/useHintLevel.test.ts`
Expected: PASS (all 6 tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useHintLevel.ts src/hooks/__tests__/useHintLevel.test.ts
git commit -m "[EVOLUTION] epic-010 iter-002: add useHintLevel hook with streak-based adaptive hints"
```

---

## Task 4: Integrate useHintLevel into usePractice

**Files:** Modify: `src/hooks/usePractice.ts`

- [ ] **Step 1: Import useHintLevel**

Add import at top of file:

```typescript
import { useHintLevel } from '@/hooks/useHintLevel';
```

- [ ] **Step 2: Add useHintLevel to the hook**

In the `usePractice` function body (around line 39):

```typescript
// Hint level tracking for adaptive hints
const { recordAnswer: recordHintAnswer } = useHintLevel();
```

- [ ] **Step 3: Call recordHintAnswer in checkAnswer when answer is correct**

In the `checkAnswer` function, after setting state with `isCorrect: true` (around line 292 for multiple-choice, line 336 for fill-in-blanks, line 382 for fill-in-blanks points):

Call `recordHintAnswer(true)` right after setting state. Find all 3 `isCorrect: true` branches and add:

```typescript
recordHintAnswer(true);
```

In the incorrect branches (3 places with `isCorrect: false`), add:

```typescript
recordHintAnswer(false);
```

**IMPORTANT:** Only call `recordHintAnswer` ONCE per `checkAnswer` invocation, not inside each if-branch. The best place is to call it right at the start of `checkAnswer` or after determining isCorrect. Since `isCorrect` is determined locally in all modes, add the call at the beginning of the function body:

```typescript
const checkAnswer = useCallback((param?: string | string[]) => {
  // Record hint answer at the start (before state changes)
  recordHintAnswer(/* will be called after isCorrect is determined */);
```

Actually, since `isCorrect` is determined inside each mode branch, the cleanest approach is to call `recordHintAnswer(isCorrect)` just before returning from the function. But that would require refactoring. The simplest approach:

Add right before the function's internal logic:

```typescript
const checkAnswer = useCallback((param?: string | string[]) => {
  if (!currentSentence) return;
```

Then at the end of the function, before `}, [...])`:
We need to call `recordHintAnswer` with the correct answer result. Since the isCorrect determination is complex and spans multiple code paths, the cleanest approach is to add it inside each correct/incorrect branch. Let me refine:

After line 281 (`if (!currentSentence) return;`), add:

```typescript
// Flag to track if we've already recorded
let recordedHint = false;
```

Then in each `setState({ ... isCorrect: true ... })` block, add `recordedHint = true;` after the setState.

Then at the end of the function (around line 432), after the fill-in-blanks setState calls, add:

```typescript
// Record hint answer based on the isCorrect flag set in each branch
// This needs to be added carefully since isCorrect is determined per-mode
// The safest approach: call after all setState calls complete
```

**Refined approach:** Instead of complicating checkAnswer, call `recordHintAnswer` from the ResultModal component when the user sees the result, or from App.tsx when `showResult` changes. But the cleanest for this iteration is to track it directly in checkAnswer.

Since `isCorrect` is determined inside each branch, let's add `recordHintAnswer(isCorrect)` at the very end of the function body, just before the final `}, [...])` closure. The variable `isCorrect` will be the last value set. But this is fragile.

**Best approach for this iteration:** Add `recordHintAnswer` call in each of the 3 correct and 3 incorrect branches. The duplication is acceptable for now since each branch has distinct logic.

Locate each `isCorrect: true` setState block and add `recordHintAnswer(true)` inside it. Locate each `isCorrect: false` setState block and add `recordHintAnswer(false)` inside it.

- [ ] **Step 4: Export hint level info from usePractice**

Add to the return object (around line 494-515):

```typescript
// Import useHintLevel at top
import { useHintLevel } from '@/hooks/useHintLevel';
```

Then in the return (around line 494), add:

```typescript
const { hintLevel, shouldShowHint, getHintProbability } = useHintLevel();

return {
  // ... existing fields ...
  hintLevel,
  shouldShowHint,
  getHintProbability,
```

Wait - we already initialized useHintLevel in the hook. We should expose it from the return. But importing it twice (once for side effects, once for export) is problematic. Let me restructure:

Instead of calling `useHintLevel()` at the top level of usePractice, just expose the hook's return value. The `recordAnswer` will be called from the result components.

Actually, `useHintLevel` doesn't have side effects - it just tracks state. The `recordAnswer` is the important function. Let's expose it through usePractice:

```typescript
// At top of usePractice function body
const hintLevelHook = useHintLevel();

// Call recordAnswer in checkAnswer for each correct/incorrect result
// Expose via return
const { hintLevel, shouldShowHint, getHintProbability } = hintLevelHook;
```

But we need to make sure `recordAnswer` is called. Let me look at the checkAnswer function again and add calls there.

Actually, since we want the hint level to be available in PracticeCard without deep prop drilling, we can call `recordAnswer` from the `ResultModal` or App.tsx when the user sees the result. But for now, let's add it to checkAnswer.

After careful analysis, add `recordHintAnswer` calls inside each setState branch of checkAnswer.

- [ ] **Step 5: Run tests to verify**

Run: `npx vitest run src/hooks/__tests__/usePractice.test.ts`
Expected: PASS (existing tests should not be broken)

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePractice.ts
git commit -m "[EVOLUTION] epic-010 iter-002: integrate useHintLevel into usePractice hook"
```

---

## Task 5: Update PracticeCard to Accept and Pass Hint Props

**Files:** Modify: `src/components/practice/modes/DictationMode.tsx`, `src/components/practice/modes/FillInBlanksMode.tsx`

- [ ] **Step 1: Read practice/types.ts to understand mode config types**

Run: `cat src/components/practice/types.ts`

- [ ] **Step 2: Add hintLevel and shouldShowHint props to mode configs**

Add to `DictationModeConfig` and `FillInBlanksModeConfig` interfaces:

```typescript
/** Hint level from useHintLevel */
hintLevel?: HintLevel;
/** Function to check if hint should be shown (probabilistic) */
shouldShowHint?: () => boolean;
```

- [ ] **Step 3: Update DictationMode to use hint probability**

In `DictationMode.tsx`, update the component props:

```typescript
export function DictationMode({
  sentence,
  inputs,
  showResult,
  isCorrect,
  isFocusMode = false,
  showHints = true,
  hintLevel = 'medium',
  shouldShowHint = () => true, // default to show always
  onInputChange,
  onCheck,
}: DictationModeProps) {
```

Update the hint display section (around line 77-81):

```typescript
{showHints && !showResult && (
  <span className="block text-xs text-slate-400 font-medium mt-1">
    {hintLevel === 'none' ? '(无提示)' : `提示: ${blank.word.charAt(0)}...`}
  </span>
)}
```

Wait, the hint should be conditionally shown based on probability, not just level. Let me update:

```typescript
{showHints && !showResult && hintLevel !== 'none' && (
  <span className="block text-xs text-slate-400 font-medium mt-1">
    提示: {blank.word.charAt(0)}...
  </span>
)}
```

Also update the instruction text (line 99-101):

```typescript
{/* Dictation mode label */}
{!showResult && (
  <div className="text-center">
    <p className="text-sm text-slate-400">
      {hintLevel === 'none'
        ? '请听音频填写单词'
        : hintLevel === 'low'
          ? '请听音频，根据中文提示填写单词'
          : '请听音频，根据中文提示和首字母提示填写单词'}
    </p>
  </div>
)}
```

- [ ] **Step 4: Update FillInBlanksMode to use hint level**

In `FillInBlanksMode.tsx`, update the component props:

```typescript
export function FillInBlanksMode({
  sentence,
  inputs,
  showResult,
  isCorrect,
  isFocusMode = false,
  hintLevel = 'medium',
  shouldShowHint = () => true,
  onInputChange,
  onCheck,
}: FillInBlanksModeProps) {
```

Update the hints section (around line 147-163) to only show hints based on level:

```typescript
{/* Hints - only show if hint level allows */}
{!showResult && hintLevel !== 'none' && (
  <div className="flex flex-wrap gap-2 justify-center">
    {sentence.blanks.map((blank, idx) => (
      blank.hint && (
        <Badge
          key={idx}
          variant="outline"
          className="text-xs text-slate-500 bg-slate-50"
        >
          <Lightbulb className="w-3 h-3 mr-1 text-amber-500" />
          空{idx + 1}: {hintLevel === 'high' ? blank.hint : `(提示: ${blank.word.charAt(0)}...)`}
        </Badge>
      )
    ))}
  </div>
)}
```

- [ ] **Step 5: Run component tests**

Run: `npx vitest run src/components/practice/modes/`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/practice/modes/DictationMode.tsx src/components/practice/modes/FillInBlanksMode.tsx
git commit -m "[EVOLUTION] epic-010 iter-002: update mode components to use adaptive hint level"
```

---

## Task 6: Integrate into App.tsx

**Files:** Modify: `src/App.tsx`

- [ ] **Step 1: Import useHintLevel in App.tsx**

Add import:

```typescript
import { useHintLevel } from '@/hooks/useHintLevel';
```

- [ ] **Step 2: Use the hook in App.tsx**

In the App component body:

```typescript
const { hintLevel, shouldShowHint, getHintProbability } = useHintLevel();
```

- [ ] **Step 3: Pass hint props to PracticeCard**

In the practice view rendering (where PracticeCard is used), add:

```typescript
<PracticeCard
  // ... existing props ...
  hintLevel={hintLevel}
  shouldShowHint={shouldShowHint}
  getHintProbability={getHintProbability}
/>
```

Wait, PracticeCard doesn't currently accept hint props. We need to:
1. Add hintLevel/shouldShowHint props to PracticeCard
2. Pass them down to the mode components

In `src/components/PracticeCard.tsx`, add to the interface:

```typescript
import type { HintLevel } from '@/data/types';

interface PracticeCardProps {
  // ... existing fields ...
  hintLevel?: HintLevel;
  shouldShowHint?: () => boolean;
  getHintProbability?: () => number;
  // ...
}
```

Then in the component, add to destructured props, and pass to mode components in `renderModeContent`:

```typescript
const commonProps = {
  sentence,
  inputs,
  showResult,
  isCorrect,
  attempts,
  isSpeaking,
  isFocusMode,
  hintLevel,
  shouldShowHint,
  onInputChange,
  onCheck,
  onNext,
  onRetry,
  onSpeak,
};
```

- [ ] **Step 4: Run App tests**

Run: `npx vitest run src/components/__tests__/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/PracticeCard.tsx
git commit -m "[EVOLUTION] epic-010 iter-002: wire up adaptive hint level in App"
```

---

## Task 7: Full Verification

- [ ] **Step 1: Run vitest unit tests**

Run: `npx vitest run --reporter=verbose`
Expected: ALL PASS, 0 failures

- [ ] **Step 2: Run Playwright e2e tests**

Run: `npx playwright test`
Expected: ALL PASS

- [ ] **Step 3: Run build to verify no type errors**

Run: `npm run build`
Expected: SUCCESS with no type errors

- [ ] **Step 4: Update epic history in state.json**

Update state.json:
- Set `iter-002.status` to `completed`
- Increment `epicHistory.completedIterations` for epic-010

---

## Plan Summary

| Task | Files | Type |
|------|-------|------|
| 1. Hint Types | `src/data/types.ts` | Modify |
| 2. Hint Storage | `src/services/storage.ts` | Modify |
| 3. useHintLevel Hook | `src/hooks/useHintLevel.ts` | Create |
| 4. Hook Integration | `src/hooks/usePractice.ts` | Modify |
| 5. Mode Components | `DictationMode.tsx`, `FillInBlanksMode.tsx` | Modify |
| 6. App Integration | `src/App.tsx`, `PracticeCard.tsx` | Modify |
| 7. Full Verification | All | Verify |

**Hint Level Logic:**
- **5+ consecutive correct** → `high` (100% hints shown, user is doing well so reward them)
- **3+ consecutive incorrect** → `none` (no hints, challenge the user)
- **otherwise** → `medium` (60% hints shown)

**Hint display probability:**
- `none`: 0% (no hints)
- `low`: 30% (occasional hints)
- `medium`: 60% (regular hints)
- `high`: 100% (always show hints)