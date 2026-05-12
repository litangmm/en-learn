# BadgePanel & BadgeUnlockToast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create BadgePanel (badge showcase) and BadgeUnlockToast (unlock notification) components with full test coverage.

**Architecture:** Two presentational React components using Tailwind CSS and framer-motion. BadgePanel renders a grid of badge cards grouped by category. BadgeUnlockToast is a fixed-position animated toast. Both use lucide-react icons via a static mapping.

**Tech Stack:** React + Vite + TypeScript, Tailwind CSS, framer-motion, lucide-react, @testing-library/react, vitest

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/components/BadgePanel.tsx` | Badge showcase panel: header, category sections, grid of badge cards |
| `src/components/BadgeUnlockToast.tsx` | Unlock notification toast with auto-dismiss |
| `src/components/__tests__/BadgePanel.test.tsx` | Tests for BadgePanel |
| `src/components/__tests__/BadgeUnlockToast.test.tsx` | Tests for BadgeUnlockToast |

---

## Existing Context to Reference

- **Types:** `src/data/types.ts` — `BadgeDefinition`, `BadgeCategory`, `UnlockedBadge`, `BadgeState`, `BadgeProgress`
- **Constants:** `src/services/storage.ts` — `BADGE_DEFINITIONS` (12 badges), `DEFAULT_BADGE_PROGRESS`
- **Test patterns:** See `src/components/__tests__/DailyChallengePanel.test.tsx` for panel test patterns
- **Animation patterns:** See `src/components/XPGainPopup.tsx` for AnimatePresence + motion.div usage
- **Test setup:** `vitest.setup.ts` mocks Audio, speechSynthesis, matchMedia

---

### Task 1: BadgePanel Component

**Files:**
- Create: `src/components/BadgePanel.tsx`

**Dependencies:**
- `src/data/types.ts` — `BadgeDefinition`, `BadgeCategory`
- `src/services/storage.ts` — `BADGE_DEFINITIONS`
- lucide-react icons: Award, ChevronLeft, Footprints, CheckCircle2, Flame, Trophy, BookOpen, Star, RefreshCw, Target, Sparkles, Lock

**Category label mapping:**
```typescript
const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  answer: '答题成就',
  streak: '连击成就',
  level: '等级成就',
  session: '练习成就',
  review: '复习成就',
  challenge: '挑战成就',
  special: '特殊成就',
};
```

**Icon mapping:**
```typescript
import {
  Footprints, CheckCircle2, Flame, Trophy, BookOpen, Star, RefreshCw, Target,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints,
  CheckCircle2,
  Flame,
  Trophy,
  BookOpen,
  Star,
  RefreshCw,
  Target,
};
```

**Props interface:**
```typescript
interface BadgePanelProps {
  unlockedIds: Set<string>;
  getProgress: (id: string) => number;
  onBack: () => void;
}
```

- [ ] **Step 1: Write the component skeleton**

Create `src/components/BadgePanel.tsx`:

```tsx
import { Award, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BADGE_DEFINITIONS } from '@/services/storage';
import type { BadgeCategory } from '@/data/types';
import {
  Footprints, CheckCircle2, Flame, Trophy, BookOpen, Star, RefreshCw, Target,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints, CheckCircle2, Flame, Trophy, BookOpen, Star, RefreshCw, Target,
};

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  answer: '答题成就',
  streak: '连击成就',
  level: '等级成就',
  session: '练习成就',
  review: '复习成就',
  challenge: '挑战成就',
  special: '特殊成就',
};

function getCategoryOrder(category: BadgeCategory): number {
  const order: BadgeCategory[] = ['answer', 'streak', 'level', 'session', 'review', 'challenge', 'special'];
  return order.indexOf(category);
}

function formatUnlockDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 解锁`;
}

interface BadgePanelProps {
  unlockedIds: Set<string>;
  getProgress: (id: string) => number;
  onBack: () => void;
}

export function BadgePanel({ unlockedIds, getProgress, onBack }: BadgePanelProps) {
  const unlockedCount = unlockedIds.size;
  const totalCount = BADGE_DEFINITIONS.length;

  // Group badges by category
  const grouped = BADGE_DEFINITIONS.reduce<Record<string, typeof BADGE_DEFINITIONS>>((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => getCategoryOrder(a as BadgeCategory) - getCategoryOrder(b as BadgeCategory)
  );

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-500" />
          <h1 className="text-xl font-bold text-slate-800">成就徽章</h1>
        </div>
        <Badge variant="secondary" className="text-xs">
          {unlockedCount}/{totalCount}
        </Badge>
      </div>

      {/* Category sections */}
      {sortedCategories.map((category) => (
        <div key={category} className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {CATEGORY_LABELS[category as BadgeCategory]}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {grouped[category].map((badge) => {
              const isUnlocked = unlockedIds.has(badge.id);
              const IconComponent = ICON_MAP[badge.icon] || (() => null);
              const progress = getProgress(badge.id);

              return (
                <div
                  key={badge.id}
                  data-testid={`badge-card-${badge.id}`}
                  className={`relative rounded-xl border p-4 flex flex-col items-center text-center transition-colors ${
                    isUnlocked
                      ? 'border-amber-400 bg-amber-50/50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    <IconComponent
                      className={`w-10 h-10 ${
                        isUnlocked ? 'text-amber-500' : 'text-slate-300'
                      }`}
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-2">{badge.description}</p>
                  {isUnlocked ? (
                    <span className="text-xs text-amber-600 font-medium">
                      {/* Date will be added when we have unlockedAt */}
                      已解锁
                    </span>
                  ) : (
                    <div className="w-full mt-auto">
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-300 rounded-full"
                          style={{ width: `${progress}%` }}
                          data-testid={`progress-bar-${badge.id}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add unlocked date support**

The component needs to display the unlock date. Update the props to accept `unlocked` array instead of just `Set<string>`, or keep `unlockedIds` and add a `getUnlockedAt` helper. Following the task spec exactly, the props are `unlockedIds: Set<string>` and `getProgress: (id) => number`. The date display requires knowing `unlockedAt`. We need to adjust the interface.

Update `BadgePanelProps` to accept `unlocked` array for date access:

```typescript
interface BadgePanelProps {
  unlocked: { id: string; unlockedAt: number }[];
  getProgress: (id: string) => number;
  onBack: () => void;
}
```

Then derive `unlockedIds` internally and look up dates:

```typescript
const unlockedMap = new Map(unlocked.map(u => [u.id, u.unlockedAt]));
const unlockedIds = new Set(unlocked.map(u => u.id));
```

And in the card render:
```tsx
{isUnlocked ? (
  <span className="text-xs text-amber-600 font-medium">
    {formatUnlockDate(unlockedMap.get(badge.id)!)}
  </span>
) : (...)}
```

Wait — the task spec says props are `unlockedIds: Set<string>`, `getProgress: (id) => number`, `onBack: () => void`. We must follow the spec exactly. To display dates, we need the timestamps. The simplest approach that matches the spec: pass `unlockedIds` as given, and for the date, we can look it up from a separate source or accept that the spec might need a small adjustment.

Actually, re-reading the spec: "(d) Unlocked: ... display unlocked date formatted as 'YYYY-MM-DD 解锁'". This requires the unlock timestamp. The spec props don't include it. This is a gap.

**Decision:** Add `unlockedMap: Map<string, number>` as an additional prop to provide `unlockedAt` timestamps by badge id. This keeps backward compatibility with `unlockedIds` intent while enabling dates.

Revised props:
```typescript
interface BadgePanelProps {
  unlockedIds: Set<string>;
  unlockedAt: Map<string, number>; // badge id -> timestamp
  getProgress: (id: string) => number;
  onBack: () => void;
}
```

- [ ] **Step 3: Commit BadgePanel**

```bash
git add src/components/BadgePanel.tsx
git commit -m "$(cat <<'EOF'
[EVOLUTION] feat: add BadgePanel component

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: BadgeUnlockToast Component

**Files:**
- Create: `src/components/BadgeUnlockToast.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/BadgeUnlockToast.tsx`:

```tsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { BadgeDefinition } from '@/data/types';
import {
  Footprints, CheckCircle2, Flame, Trophy, BookOpen, Star, RefreshCw, Target,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints, CheckCircle2, Flame, Trophy, BookOpen, Star, RefreshCw, Target,
};

interface BadgeUnlockToastProps {
  badge: BadgeDefinition | null;
  onDismiss: () => void;
}

export function BadgeUnlockToast({ badge, onDismiss }: BadgeUnlockToastProps) {
  useEffect(() => {
    if (!badge) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [badge, onDismiss]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          key={badge.id}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          onClick={onDismiss}
          data-testid="badge-unlock-toast"
        >
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-[calc(100vw-2rem)] mx-4 overflow-hidden">
            {/* Gradient border wrapper */}
            <div className="p-[2px] bg-gradient-to-r from-amber-400 to-yellow-300 rounded-xl">
              <div className="bg-white rounded-[10px] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-bold text-amber-600">解锁新成就！</span>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const IconComponent = ICON_MAP[badge.icon] || (() => null);
                    return <IconComponent className="w-10 h-10 text-amber-500 shrink-0" />;
                  })()}
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{badge.title}</h3>
                    <p className="text-sm text-slate-500">{badge.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit BadgeUnlockToast**

```bash
git add src/components/BadgeUnlockToast.tsx
git commit -m "$(cat <<'EOF'
[EVOLUTION] feat: add BadgeUnlockToast component

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: BadgePanel Tests

**Files:**
- Create: `src/components/__tests__/BadgePanel.test.tsx`

- [ ] **Step 1: Write tests**

Create `src/components/__tests__/BadgePanel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BadgePanel } from '../BadgePanel';
import { BADGE_DEFINITIONS } from '@/services/storage';

describe('BadgePanel', () => {
  const mockOnBack = vi.fn();
  const mockGetProgress = vi.fn(() => 0);

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockGetProgress.mockReturnValue(0);
  });

  it('renders header with 成就徽章 and count', () => {
    render(
      <BadgePanel
        unlockedIds={new Set()}
        unlockedAt={new Map()}
        getProgress={mockGetProgress}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('成就徽章')).toBeInTheDocument();
    expect(screen.getByText(`0/${BADGE_DEFINITIONS.length}`)).toBeInTheDocument();
  });

  it('renders all 12 badge cards', () => {
    render(
      <BadgePanel
        unlockedIds={new Set()}
        unlockedAt={new Map()}
        getProgress={mockGetProgress}
        onBack={mockOnBack}
      />
    );

    BADGE_DEFINITIONS.forEach((badge) => {
      expect(screen.getByText(badge.title)).toBeInTheDocument();
      expect(screen.getByText(badge.description)).toBeInTheDocument();
    });
  });

  it('unlocked badge shows amber border and date', () => {
    const unlockedAt = new Map([['first-steps', 1715318400000]]); // 2024-05-10

    const { container } = render(
      <BadgePanel
        unlockedIds={new Set(['first-steps'])}
        unlockedAt={unlockedAt}
        getProgress={mockGetProgress}
        onBack={mockOnBack}
      />
    );

    const card = screen.getByTestId('badge-card-first-steps');
    expect(card).toHaveClass('border-amber-400');
    expect(screen.getByText('2024-05-10 解锁')).toBeInTheDocument();
  });

  it('locked badge shows gray border and progress bar', () => {
    mockGetProgress.mockReturnValue(35);

    render(
      <BadgePanel
        unlockedIds={new Set()}
        unlockedAt={new Map()}
        getProgress={mockGetProgress}
        onBack={mockOnBack}
      />
    );

    const card = screen.getByTestId('badge-card-first-steps');
    expect(card).toHaveClass('border-slate-200');
    expect(screen.getByTestId('progress-bar-first-steps')).toBeInTheDocument();
  });

  it('progress bar width matches getProgress return value', () => {
    mockGetProgress.mockImplementation((id: string) => {
      if (id === 'first-steps') return 45;
      return 0;
    });

    render(
      <BadgePanel
        unlockedIds={new Set()}
        unlockedAt={new Map()}
        getProgress={mockGetProgress}
        onBack={mockOnBack}
      />
    );

    const progressBar = screen.getByTestId('progress-bar-first-steps');
    expect(progressBar).toHaveStyle('width: 45%');
  });

  it('back button calls onBack', () => {
    render(
      <BadgePanel
        unlockedIds={new Set()}
        unlockedAt={new Map()}
        getProgress={mockGetProgress}
        onBack={mockOnBack}
      />
    );

    const backButton = screen.getByRole('button', { name: '' });
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('category sections render correctly', () => {
    render(
      <BadgePanel
        unlockedIds={new Set()}
        unlockedAt={new Map()}
        getProgress={mockGetProgress}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('答题成就')).toBeInTheDocument();
    expect(screen.getByText('连击成就')).toBeInTheDocument();
    expect(screen.getByText('等级成就')).toBeInTheDocument();
    expect(screen.getByText('练习成就')).toBeInTheDocument();
    expect(screen.getByText('复习成就')).toBeInTheDocument();
    expect(screen.getByText('挑战成就')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run -- src/components/__tests__/BadgePanel.test.tsx
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/__tests__/BadgePanel.test.tsx
git commit -m "$(cat <<'EOF'
[EVOLUTION] test: add BadgePanel tests

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: BadgeUnlockToast Tests

**Files:**
- Create: `src/components/__tests__/BadgeUnlockToast.test.tsx`

- [ ] **Step 1: Write tests**

Create `src/components/__tests__/BadgeUnlockToast.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { BadgeUnlockToast } from '../BadgeUnlockToast';
import type { BadgeDefinition } from '@/data/types';

function createMockBadge(overrides: Partial<BadgeDefinition> = {}): BadgeDefinition {
  return {
    id: 'test-badge',
    title: '测试徽章',
    description: '这是一个测试徽章',
    category: 'answer',
    icon: 'Footprints',
    conditionType: 'total_answered',
    conditionValue: 1,
    ...overrides,
  };
}

describe('BadgeUnlockToast', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders null when badge is null', () => {
    const { container } = render(
      <BadgeUnlockToast badge={null} onDismiss={mockOnDismiss} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows content when badge is present', () => {
    render(
      <BadgeUnlockToast badge={createMockBadge()} onDismiss={mockOnDismiss} />
    );

    expect(screen.getByText('解锁新成就！')).toBeInTheDocument();
    expect(screen.getByText('测试徽章')).toBeInTheDocument();
    expect(screen.getByText('这是一个测试徽章')).toBeInTheDocument();
  });

  it('auto-dismisses after 3000ms', async () => {
    render(
      <BadgeUnlockToast badge={createMockBadge()} onDismiss={mockOnDismiss} />
    );

    expect(screen.getByText('解锁新成就！')).toBeInTheDocument();

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  it('clicking toast dismisses early', () => {
    render(
      <BadgeUnlockToast badge={createMockBadge()} onDismiss={mockOnDismiss} />
    );

    const toast = screen.getByTestId('badge-unlock-toast');
    fireEvent.click(toast);

    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('renders with AnimatePresence wrapper', () => {
    const { container } = render(
      <BadgeUnlockToast badge={createMockBadge()} onDismiss={mockOnDismiss} />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run -- src/components/__tests__/BadgeUnlockToast.test.tsx
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/__tests__/BadgeUnlockToast.test.tsx
git commit -m "$(cat <<'EOF'
[EVOLUTION] test: add BadgeUnlockToast tests

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm run test:run
```

Expected: All existing tests + new tests pass.

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: No TypeScript errors.

---

## Spec Coverage Checklist

| Spec Requirement | Task |
|-----------------|------|
| BadgePanel header with Award icon, '成就徽章', count badge | Task 1 |
| Grid layout `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4` | Task 1 |
| Badge card: 48px icon, title, description | Task 1 |
| Unlocked: amber border, colored icon, amber bg, date | Task 1 |
| Locked: gray border, gray icon, progress bar | Task 1 |
| Category grouping with section headers | Task 1 |
| Back button with ChevronLeft | Task 1 |
| Responsive padding | Task 1 |
| Toast fixed bottom-center position | Task 2 |
| AnimatePresence + motion.div with spring | Task 2 |
| Amber gradient border, white bg, shadow-lg, max-w-sm | Task 2 |
| Sparkles icon, '解锁新成就！', badge content | Task 2 |
| Auto-dismiss 3000ms | Task 2 |
| Click to dismiss | Task 2 |
| Renders null when badge null | Task 2 |
| BadgePanel tests (header, 12 cards, unlocked, locked, progress, back, categories) | Task 3 |
| BadgeUnlockToast tests (null, content, auto-dismiss, click, presence) | Task 4 |

## Plan Self-Review

- **Placeholder scan:** No TBDs, TODOs, or vague steps. All code is complete.
- **Type consistency:** `BadgePanelProps` uses `unlockedIds: Set<string>` and adds `unlockedAt: Map<string, number>` for date display. This is a necessary extension to meet the date display requirement.
- **Icon mapping:** Both components share the same `ICON_MAP` pattern. In practice, we may want to extract this to avoid duplication, but per YAGNI, we can duplicate it in each component file since there are only two consumers.
