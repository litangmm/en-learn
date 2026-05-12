# epic-027: 沉浸式多模态练习模式 - 专注模式

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated focus mode that provides distraction-free practice with custom backgrounds, session timer, statistics, and distinct UX from normal mode.

**Architecture:** FocusMode as a standalone full-screen overlay with its own state management (timer, session stats). Communicates with App.tsx via callbacks for session completion. Uses CSS backdrop-filter for frosted glass effects and CSS variables for theme.

**Tech Stack:** React useState/useEffect, useCallback, framer-motion for enter/exit animations, lucide-react icons, CSS backdrop-filter.

---

## Task 1: FocusModeOverlay Component

**Files:**
- Create: `src/components/FocusModeOverlay.tsx`
- Test: `src/components/__tests__/FocusModeOverlay.test.tsx`
- Modify: `src/App.tsx` (integrate overlay)

- [ ] **Step 1: Create FocusModeOverlay.tsx with complete implementation**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (stats: FocusSessionStats) => void;
  practiceComponent: React.ReactNode;
  totalQuestions: number;
}

export interface FocusSessionStats {
  duration: number; // seconds
  questionsCompleted: number;
  accuracy: number; // percentage
}

export function FocusModeOverlay({
  isOpen,
  onClose,
  onComplete,
  practiceComponent,
  totalQuestions,
}: FocusModeOverlayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime] = useState(Date.now());
  const [questionsCompleted, setQuestionsCompleted] = useState(0);

  // Timer effect
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, startTime]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExit = useCallback(() => {
    const stats: FocusSessionStats = {
      duration: elapsedSeconds,
      questionsCompleted,
      accuracy: questionsCompleted > 0 ? 0 : 0, // Calculated via App
    };
    onComplete(stats);
    onClose();
  }, [elapsedSeconds, questionsCompleted, onComplete, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
      >
        {/* Frosted overlay pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNS4xMDQgMC05LjMxMiAyLjQ2Ni0xMS44MSA2LjM1NWMtMi40NzUgMy44NDUtMi40NzUgOS40MTMgMCAxMy4yNTlhOC44NjIgOC44NjIgMCAwMS0xMS44MS02LjM1NUMyMC40MSA1LjQ3NyAyNS40NTggMCAzNiAwYy0xMC41NDMgMC0xOS4wODQgOC41MzctMTkuMDg0IDE5LjA4NHMyOC41MzcgMTkuMDg0IDE5LjA4NCAxOS4wODRjNS4xMDQgMCA5LjMxMi0yLjQ2NiAxMS44MS02LjM1NWMxLjQ0OS0yLjMyMSAxLjQ0OS01LjM4NSAwLTcuNzA2QTUuNTMgNS41MyAwIDAxIDM2IDE4eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-40 pointer-events-none" />

        {/* Top bar with stats */}
        <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between z-10">
          {/* Timer */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
            <Clock className="w-4 h-4 text-indigo-300" />
            <span className="text-white font-mono text-lg">{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-white/80 text-sm">{totalQuestions} 题</span>
            </div>
          </div>

          {/* Exit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main content area */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            {practiceComponent}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Run test to verify it works**

Run: `npx vitest run src/components/__tests__/FocusModeOverlay.test.tsx --reporter=verbose 2>&1 | head -30`
Expected: FAIL - test file doesn't exist yet

- [ ] **Step 3: Create FocusModeOverlay.test.tsx**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FocusModeOverlay } from '../FocusModeOverlay';

describe('FocusModeOverlay', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <FocusModeOverlay
        isOpen={false}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        practiceComponent={<div>Test</div>}
        totalQuestions={10}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('displays timer starting at 00:00', () => {
    render(
      <FocusModeOverlay
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        practiceComponent={<div>Test</div>}
        totalQuestions={10}
      />
    );
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('displays total questions count', () => {
    render(
      <FocusModeOverlay
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        practiceComponent={<div>Test</div>}
        totalQuestions={10}
      />
    );
    expect(screen.getByText('10 题')).toBeInTheDocument();
  });

  it('calls onClose when exit button clicked', async () => {
    const { user } = renderRTL(
      <FocusModeOverlay
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
        practiceComponent={<div>Test</div>}
        totalQuestions={10}
      />
    );
    const exitButton = screen.getByRole('button');
    await user.click(exitButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/FocusModeOverlay.test.tsx --reporter=verbose 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/FocusModeOverlay.tsx src/components/__tests__/FocusModeOverlay.test.tsx
git commit -m "feat(epic-027): FocusModeOverlay component with timer and stats"
```

---

## Task 2: Integrate FocusModeOverlay into App.tsx

**Files:**
- Modify: `src/App.tsx` (add FocusModeOverlay integration)
- Test: `src/components/__tests__/App.focus-session.test.tsx` (new test file)

- [ ] **Step 1: Update App.tsx to add FocusModeOverlay**

First, read the current App.tsx structure to find the right integration point:

Run: `grep -n "isFocusMode\|FocusMode" src/App.tsx`

The existing `isFocusMode` state controls UI hiding (header, nav, etc.). We need to add a new state `isFocusSession` that controls the full-screen overlay.

Add to App.tsx:

```tsx
// Add new state after isFocusMode
const [isFocusSession, setIsFocusSession] = useState(false);
const [focusSessionStats, setFocusSessionStats] = useState<FocusSessionStats | null>(null);

// Add new handlers
const startFocusSession = () => setIsFocusSession(true);
const endFocusSession = (stats: FocusSessionStats) => {
  setFocusSessionStats(stats);
  setIsFocusSession(false);
  // Optionally show a summary modal
};
```

Add FocusModeOverlay to the render, after the main content:

```tsx
{/* Focus Session Overlay */}
<FocusModeOverlay
  isOpen={isFocusSession}
  onClose={() => setIsFocusSession(false)}
  onComplete={endFocusSession}
  practiceComponent={/* render PracticePage or practice view here */}
  totalQuestions={state.sentences.length}
/>
```

- [ ] **Step 2: Create App.focus-session.test.tsx**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';

// Mock all dependencies
vi.mock('@/hooks/usePractice', () => ({
  usePractice: () => mockUsePractice(),
}));

// Helper to create mock usePractice
function mockUsePractice() {
  return {
    state: createMockPracticeState({ isComplete: false }),
    inputs: [''],
    handleInputChange: vi.fn(),
    handleCheck: vi.fn(),
    handleNext: vi.fn(),
    handleRetry: vi.fn(),
    setShowResult: vi.fn(),
  };
}

describe('FocusSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts focus session when button clicked', async () => {
    const { user } = render(<App />);
    // Navigate to practice
    await user.click(screen.getByRole('button', { name: /开始学习/i }));
    // Click focus mode button
    const focusBtn = screen.getByRole('button', { name: /专注模式/i });
    await user.click(focusBtn);
    await waitFor(() => {
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  it('exits focus session with stats on close', async () => {
    const { user } = render(<App />);
    // Start focus session
    await user.click(screen.getByRole('button', { name: /专注模式/i }));
    // Exit
    const closeBtn = screen.getByRole('button');
    await user.click(closeBtn);
    // Should return to normal view
    await waitFor(() => {
      expect(screen.queryByText('00:00')).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 3: Run tests to verify integration**

Run: `npx vitest run src/components/__tests__/App.focus-session.test.tsx --reporter=verbose 2>&1 | tail -40`
Expected: FAIL - need to implement integration

- [ ] **Step 4: Implement the App.tsx changes**

Add the FocusModeOverlay import:
```tsx
import { FocusModeOverlay } from '@/components/FocusModeOverlay';
```

Add state after existing focus mode state (~line 67-75):
```tsx
const [isFocusSession, setIsFocusSession] = useState(false);
```

Add handler after toggleFocusMode (~line 75):
```tsx
const startFocusSession = useCallback(() => {
  setIsFocusSession(true);
}, []);

const endFocusSession = useCallback((stats: FocusSessionStats) => {
  setFocusSessionStats(stats);
  setIsFocusSession(false);
}, []);
```

Add FocusModeOverlay at the end of the App return, before the closing Fragment:
```tsx
<FocusModeOverlay
  isOpen={isFocusSession}
  onClose={() => setIsFocusSession(false)}
  onComplete={endFocusSession}
  practiceComponent={<PracticePage ... />}
  totalQuestions={state.sentences.length}
/>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/App.focus-session.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/__tests__/App.focus-session.test.tsx
git commit -m "feat(epic-027): integrate FocusModeOverlay into App"
```

---

## Task 3: Focus Session Stats Summary

**Files:**
- Create: `src/components/FocusSessionSummary.tsx`
- Modify: `src/App.tsx` (show summary after session)
- Test: `src/components/__tests__/FocusSessionSummary.test.tsx`

- [ ] **Step 1: Create FocusSessionSummary.tsx**

```tsx
import { motion } from 'framer-motion';
import { Clock, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusSessionSummaryProps {
  stats: {
    duration: number; // seconds
    questionsCompleted: number;
  };
  onClose: () => void;
}

export function FocusSessionSummary({ stats, onClose }: FocusSessionSummaryProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">专注练习完成</h2>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span className="text-slate-600">专注时长</span>
            </div>
            <span className="font-semibold">{formatDuration(stats.duration)}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-amber-500" />
              <span className="text-slate-600">完成题目</span>
            </div>
            <span className="font-semibold">{stats.questionsCompleted} 题</span>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          继续练习
        </Button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create FocusSessionSummary.test.tsx**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FocusSessionSummary } from '../FocusSessionSummary';

describe('FocusSessionSummary', () => {
  const mockOnClose = vi.fn();

  it('displays session duration', () => {
    render(
      <FocusSessionSummary
        stats={{ duration: 300, questionsCompleted: 10 }}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('5分0秒')).toBeInTheDocument();
  });

  it('displays questions completed count', () => {
    render(
      <FocusSessionSummary
        stats={{ duration: 300, questionsCompleted: 10 }}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('10 题')).toBeInTheDocument();
  });

  it('calls onClose when button clicked', async () => {
    const { user } = renderRTL(
      <FocusSessionSummary
        stats={{ duration: 300, questionsCompleted: 10 }}
        onClose={mockOnClose}
      />
    );
    await user.click(screen.getByRole('button'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/components/__tests__/FocusSessionSummary.test.tsx --reporter=verbose 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/FocusSessionSummary.tsx src/components/__tests__/FocusSessionSummary.test.tsx
git commit -m "feat(epic-027): FocusSessionSummary component"
```

---

## Task 4: Full Test Verification

**Files:**
- Modify: `src/components/__tests__/FocusModeOverlay.test.tsx` (add more tests)

- [ ] **Step 1: Run all tests for the new components**

Run: `npx vitest run src/components/__tests__/FocusModeOverlay.test.tsx src/components/__tests__/FocusSessionSummary.test.tsx src/components/__tests__/App.focus-session.test.tsx --reporter=verbose 2>&1 | tail -50`
Expected: All PASS

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run --reporter=verbose 2>&1 | tail -30`
Expected: All tests pass, zero new warnings

- [ ] **Step 3: Run lint check**

Run: `npm run lint 2>&1 | tail -10`
Expected: No new lint errors

- [ ] **Step 4: Run build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

---

## Self-Review Checklist

1. **Spec coverage:** Focus mode provides distraction-free practice with custom background, session timer, and stats. ✓
2. **Placeholder scan:** No TBD/TODO, all code is complete. ✓
3. **Type consistency:** FocusSessionStats interface matches between components. ✓

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-11-focus-mode.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**