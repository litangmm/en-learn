# useRecallReminder Hook Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `useRecallReminder.ts` hook that analyzes review streak and spaced repetition data to compute reminder status, preventing spam via lastDismissed timestamp.

**Architecture:** Custom hook that combines `useReviewStreak` and `useSpacedRepetition`, storing lastDismissed in localStorage. Status logic follows specific priority rules for idle/due-soon/due-now/streak-at-risk states.

**Tech Stack:** React hooks, TypeScript, localStorage (via storage service)

---

## Task 1: Add lastDismissed storage methods to storage.ts

**Files:**
- Modify: `src/services/storage.ts:34` (add key constant)
- Modify: `src/services/storage.ts:1025-1031` (add hasOnboardingComplete pattern)

- [ ] **Step 1: Add storage key constant**

After line 34 (`const ONBOARDED_KEY = 'en-learn-onboarded';`), add:
```typescript
const RECALL_REMINDER_DISMISSED_KEY = 'en-learn-recall-reminder-dismissed';
```

- [ ] **Step 2: Add getRecallReminderDismissed() method**

After the `setOnboardingComplete()` method (around line 1031), add:
```typescript
getRecallReminderDismissed(): number | null {
  const raw = localStorage.getItem(RECALL_REMINDER_DISMISSED_KEY);
  if (raw === null) return null;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
},
```

- [ ] **Step 3: Add setRecallReminderDismissed() method**

After the `getRecallReminderDismissed()` method, add:
```typescript
setRecallReminderDismissed(timestamp: number): void {
  localStorage.setItem(RECALL_REMINDER_DISMISSED_KEY, timestamp.toString());
},
```

---

## Task 2: Create useRecallReminder.ts hook

**Files:**
- Create: `src/hooks/useRecallReminder.ts`

- [ ] **Step 1: Create the hook file**

Create `src/hooks/useRecallReminder.ts` with:
```typescript
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useReviewStreak } from './useReviewStreak';
import { useSpacedRepetition } from './useSpacedRepetition';
import { storage } from '@/services/storage';

/**
 * Recall reminder status
 */
export type RecallReminderStatus = 'idle' | 'due-soon' | 'due-now' | 'streak-at-risk';

/**
 * State returned by useRecallReminder hook
 */
export interface RecallReminderState {
  /** Current reminder status */
  status: RecallReminderStatus;
  /** Number of items due for review */
  dueCount: number;
  /** Timestamp when reminder was last dismissed, or null */
  lastDismissed: number | null;
  /** Dismiss the reminder (sets lastDismissed to now) */
  dismiss: () => void;
  /** Whether the reminder can be shown (not dismissed within 4 hours) */
  canShow: boolean;
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

/**
 * Hook that analyzes review streak and spaced repetition data to compute
 * reminder status, preventing spam via lastDismissed timestamp.
 */
export function useRecallReminder(): RecallReminderState {
  const { data: streakData } = useReviewStreak();
  const { dueCount } = useSpacedRepetition();

  const [lastDismissed, setLastDismissed] = useState<number | null>(() =>
    storage.getRecallReminderDismissed()
  );

  // Sync lastDismissed from storage on mount
  useEffect(() => {
    setLastDismissed(storage.getRecallReminderDismissed());
  }, []);

  /**
   * Compute whether reminder is still in cooldown period
   */
  const canShow = useMemo(() => {
    if (lastDismissed === null) return true;
    const now = Date.now();
    return now - lastDismissed > FOUR_HOURS_MS;
  }, [lastDismissed]);

  /**
   * Compute reminder status based on rules
   */
  const status = useMemo((): RecallReminderStatus => {
    // Rule 1: If dismissed within last 4 hours, return idle
    if (!canShow) {
      return 'idle';
    }

    // Rule 2: If dueCount === 0, return idle (nothing to review)
    if (dueCount === 0) {
      return 'idle';
    }

    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const lastReviewDate = streakData.lastReviewDate;

    // Rule 3: If streak is active (lastReviewDate === today), return idle
    if (lastReviewDate === today) {
      return 'idle';
    }

    // Rule 4: If lastReviewDate === yesterday AND dueCount > 0, return streak-at-risk
    if (lastReviewDate === yesterday) {
      return 'streak-at-risk';
    }

    // Rule 5: If dueCount > 0 AND (lastReviewDate is older than yesterday OR null), return due-now
    return 'due-now';
  }, [canShow, dueCount, streakData.lastReviewDate]);

  /**
   * Dismiss the reminder (sets lastDismissed to now)
   */
  const dismiss = useCallback(() => {
    const now = Date.now();
    storage.setRecallReminderDismissed(now);
    setLastDismissed(now);
  }, []);

  return {
    status,
    dueCount,
    lastDismissed,
    dismiss,
    canShow,
  };
}

export default useRecallReminder;
```

- [ ] **Step 2: Run TypeScript check**

Run: `cd /Users/litang/WeChatProjects/en-learn && npx tsc --noEmit`
Expected: No errors (or only pre-existing errors)

---

## Self-Review Checklist

After implementation, verify:

1. **All 4 states computed correctly:**
   - `idle`: dismissed within 4h, no due items, or streak active today
   - `due-soon`: documented but not in current rules (intentional - will show idle if streak active, due-now if overdue)
   - `due-now`: lastReviewDate older than yesterday OR null, with dueCount > 0
   - `streak-at-risk`: lastReviewDate === yesterday, dueCount > 0

2. **4-hour spam prevention works:** `lastDismissed` timestamp checked before showing reminder

3. **storage.ts updated correctly:** Following the ONBOARDED_KEY pattern exactly

4. **Types complete:** `RecallReminderStatus`, `RecallReminderState` exported

5. **Code follows existing patterns:** Matches style of other hooks in the codebase