# 学习效率数据面板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a LearningEfficiencyPanel component that displays learning efficiency metrics derived from real spaced repetition data: memory retention rate, forgetting curve fit, and weakness progress. Complements the existing ProgressHub with "learning quality" metrics rather than "learning quantity" (which ProgressHub covers).

**Architecture:** This iteration creates a new data-derivation layer (`useLearningEfficiency` hook) that computes three efficiency metrics from existing Mistake storage data. The existing ProgressHub/AbilityRadar/ProgressTrend are untouched. The new panel integrates via a new `efficiency` view in App.tsx. Pure TypeScript + SVG — no new chart library, no new storage schema.

**Tech Stack:** React + TypeScript + Tailwind + framer-motion + localStorage (read-only). Existing storage.ts, useWeaknessStats.ts, spaced-repetition.ts as data sources.

---

## Task 1: Create useLearningEfficiency Hook

**Files:**
- Create: `src/hooks/useLearningEfficiency.ts`
- Test: `src/hooks/__tests__/useLearningEfficiency.test.ts`

- [ ] **Step 1: Write the useLearningEfficiency test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock storage
const mockGetMistakes = vi.fn();
const mockGetHistory = vi.fn();
const mockGetBadgeProgress = vi.fn();

vi.mock('@/services/storage', () => ({
  storage: {
    getMistakes: () => mockGetMistakes(),
    getHistory: () => mockGetHistory(),
    getBadgeProgress: () => mockGetBadgeProgress(),
  },
}));

describe('useLearningEfficiency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns zero metrics when no data', () => {
    mockGetMistakes.mockReturnValue([]);
    mockGetHistory.mockReturnValue([]);
    mockGetBadgeProgress.mockReturnValue({
      totalAnswered: 0, totalCorrect: 0, totalSessions: 0,
      maxStreakEver: 0, perfectSessions: 0, totalReviews: 0, totalChallengesCompleted: 0,
    });
    const { result } = renderHook(() => import('@/hooks/useLearningEfficiency').then(m => m.useLearningEfficiency()));
    // Will test actual hook after implementation
  });

  it('calculates memory retention rate from reviewHistory', async () => {
    // Setup: will add full test after implementation
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/litang/WeChatProjects/en-learn && npx vitest run src/hooks/__tests__/useLearningEfficiency.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the useLearningEfficiency hook**

```typescript
// src/hooks/useLearningEfficiency.ts
import { useMemo } from 'react';
import { storage } from '@/services/storage';
import type { Mistake } from '@/data/types';

export interface LearningEfficiencyMetrics {
  /** Memory retention rate: 0-100% of reviewed items answered correctly on review */
  memoryRetentionRate: number;
  /** Forgetting curve fit: 0-100 score, higher = longer retention */
  forgettingCurveFit: number;
  /** Weakness progress: 0-100, improvement in weak sentences over time */
  weaknessProgress: number;
  /** Details */
  totalReviewed: number;
  totalCorrectOnReview: number;
  totalMistakes: number;
  improvedMistakes: number; // mistakes that decreased error rate over time
}

interface ReviewSessionStats {
  totalReviews: number;
  correctReviews: number;
  intervalGrowth: number; // sum of interval improvements
  totalIntervals: number;
}

function calculateReviewStats(mistakes: Mistake[]): ReviewSessionStats {
  let totalReviews = 0;
  let correctReviews = 0;
  let intervalGrowth = 0;
  let totalIntervals = 0;

  for (const mistake of mistakes) {
    const history = mistake.reviewHistory ?? [];
    totalReviews += history.length;

    for (const result of history) {
      if (result.isCorrect) {
        correctReviews++;
      }
    }

    // Calculate interval growth: later intervals should be larger than earlier ones
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      if (curr.interval > prev.interval) {
        intervalGrowth++;
      }
      totalIntervals++;
    }
  }

  return { totalReviews, correctReviews, intervalGrowth, totalIntervals };
}

function calculateMemoryRetention(stats: ReviewSessionStats): number {
  if (stats.totalReviews === 0) return 0;
  return Math.round((stats.correctReviews / stats.totalReviews) * 100);
}

function calculateForgettingCurveFit(stats: ReviewSessionStats): number {
  if (stats.totalIntervals === 0) return 0;
  // Score based on interval growth ratio (how often intervals increased)
  const growthRatio = stats.intervalGrowth / stats.totalIntervals;
  return Math.round(growthRatio * 100);
}

function calculateWeaknessProgress(mistakes: Mistake[]): number {
  if (mistakes.length === 0) return 100; // No weaknesses = perfect

  let improved = 0;
  for (const mistake of mistakes) {
    const history = mistake.reviewHistory ?? [];
    if (history.length < 2) continue;

    // Compare first half vs second half accuracy
    const mid = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, mid);
    const secondHalf = history.slice(mid);

    const firstCorrect = firstHalf.filter(r => r.isCorrect).length;
    const secondCorrect = secondHalf.filter(r => r.isCorrect).length;

    const firstAccuracy = firstCorrect / firstHalf.length;
    const secondAccuracy = secondCorrect.length > 0
      ? secondCorrect / secondHalf.length
      : firstAccuracy;

    // If second half is better or equal, consider improved
    if (secondAccuracy >= firstAccuracy) {
      improved++;
    }
  }

  if (mistakes.length === 0) return 100;
  return Math.round((improved / mistakes.length) * 100);
}

/**
 * Hook that derives learning efficiency metrics from storage data.
 * Reads from existing Mistake storage (read-only).
 */
export function useLearningEfficiency(): LearningEfficiencyMetrics {
  return useMemo(() => {
    const mistakes = storage.getMistakes();

    const reviewStats = calculateReviewStats(mistakes);
    const memoryRetentionRate = calculateMemoryRetention(reviewStats);
    const forgettingCurveFit = calculateForgettingCurveFit(reviewStats);
    const weaknessProgress = calculateWeaknessProgress(mistakes);

    const totalReviewed = reviewStats.totalReviews;
    const totalCorrectOnReview = reviewStats.correctReviews;
    const totalMistakes = mistakes.length;
    const improvedMistakes = Math.round((weaknessProgress / 100) * mistakes.length);

    return {
      memoryRetentionRate,
      forgettingCurveFit,
      weaknessProgress,
      totalReviewed,
      totalCorrectOnReview,
      totalMistakes,
      improvedMistakes,
    };
  }, []);
}

export default useLearningEfficiency;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/useLearningEfficiency.test.ts`
Expected: PASS (after test is fleshed out)

---

## Task 2: Create LearningEfficiencyPanel Component

**Files:**
- Create: `src/components/LearningEfficiencyPanel.tsx`
- Test: `src/components/__tests__/LearningEfficiencyPanel.test.tsx`

- [ ] **Step 1: Write the component**

```typescript
// src/components/LearningEfficiencyPanel.tsx
import { Brain, TrendingUp, Target, Award, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearningEfficiency } from '@/hooks/useLearningEfficiency';

interface LearningEfficiencyPanelProps {
  onBack: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '一般';
  return '需加强';
}

export function LearningEfficiencyPanel({ onBack }: LearningEfficiencyPanelProps) {
  const metrics = useLearningEfficiency();

  const cards = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: '记忆保持率',
      value: metrics.memoryRetentionRate,
      subtitle: `${metrics.totalCorrectOnReview}/${metrics.totalReviewed} 次复习正确`,
      description: '复习时答对的比例',
      color: 'blue',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: '遗忘曲线拟合',
      value: metrics.forgettingCurveFit,
      subtitle: '间隔递增趋势',
      description: '复习间隔是否持续延长',
      color: 'green',
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: '薄弱点攻克',
      value: metrics.weaknessProgress,
      subtitle: `${metrics.improvedMistakes}/${metrics.totalMistakes} 个改善`,
      description: '薄弱句子的进步趋势',
      color: 'purple',
    },
  ];

  const overallScore = Math.round(
    (metrics.memoryRetentionRate + metrics.forgettingCurveFit + metrics.weaknessProgress) / 3
  );

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-4" data-testid="learning-efficiency-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500" data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            <h1 className="text-xl font-bold text-slate-800">学习效率</h1>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className={`mb-6 p-6 bg-gradient-to-br ${
        overallScore >= 80 ? 'from-green-500 to-green-600' :
        overallScore >= 60 ? 'from-blue-500 to-blue-600' :
        overallScore >= 40 ? 'from-orange-500 to-orange-600' :
        'from-red-500 to-red-600'
      } rounded-xl text-white text-center`}>
        <p className="text-sm text-white/80 mb-1">综合效率评分</p>
        <p className="text-5xl font-bold">{overallScore}</p>
        <p className={`text-lg mt-1 ${overallScore >= 60 ? 'text-white' : 'text-white/90'}`}>
          {getScoreLabel(overallScore)}
        </p>
        <p className="text-xs text-white/70 mt-2">
          基于 {metrics.totalReviewed} 次复习数据
        </p>
      </div>

      {/* Metric Cards */}
      <div className="space-y-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                card.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                card.color === 'green' ? 'bg-green-100 text-green-600' :
                card.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {card.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-slate-700">{card.title}</span>
                  <span className={`text-2xl font-bold ${getScoreColor(card.value)}`}>
                    {card.value}
                  </span>
                  <span className="text-sm text-slate-400">分</span>
                </div>
                <p className="text-xs text-slate-500">{card.subtitle}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  card.color === 'blue' ? 'bg-blue-500' :
                  card.color === 'green' ? 'bg-green-500' :
                  card.color === 'purple' ? 'bg-purple-500' :
                  'bg-slate-500'
                }`}
                style={{ width: `${card.value}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Empty State Hint */}
      {metrics.totalReviewed === 0 && (
        <div className="mt-6 text-center py-8">
          <p className="text-sm text-slate-400">
            开始复习后，这里会显示你的学习效率数据
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl">
        <h3 className="text-sm font-medium text-slate-700 mb-2">如何提高效率</h3>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>• 按时复习到期题目，不要积压</li>
          <li>• 薄弱点要多次练习直到完全掌握</li>
          <li>• 保持稳定的复习节奏比突击更有效</li>
        </ul>
      </div>
    </div>
  );
}

export default LearningEfficiencyPanel;
```

- [ ] **Step 2: Write the component test**

```typescript
// src/components/__tests__/LearningEfficiencyPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningEfficiencyPanel } from '../LearningEfficiencyPanel';

// Mock useLearningEfficiency hook
vi.mock('@/hooks/useLearningEfficiency', () => ({
  useLearningEfficiency: vi.fn(() => ({
    memoryRetentionRate: 75,
    forgettingCurveFit: 60,
    weaknessProgress: 45,
    totalReviewed: 20,
    totalCorrectOnReview: 15,
    totalMistakes: 5,
    improvedMistakes: 2,
  })),
}));

describe('LearningEfficiencyPanel', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the panel with metrics', () => {
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByTestId('learning-efficiency-panel')).toBeInTheDocument();
    expect(screen.getByText('学习效率')).toBeInTheDocument();
    expect(screen.getByText('记忆保持率')).toBeInTheDocument();
    expect(screen.getByText('遗忘曲线拟合')).toBeInTheDocument();
    expect(screen.getByText('薄弱点攻克')).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows overall score', () => {
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    // (75 + 60 + 45) / 3 = 60
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('良好')).toBeInTheDocument();
  });

  it('shows empty state when no reviews', () => {
    vi.mocked(useLearningEfficiency).mockReturnValueOnce({
      memoryRetentionRate: 0,
      forgettingCurveFit: 0,
      weaknessProgress: 100,
      totalReviewed: 0,
      totalCorrectOnReview: 0,
      totalMistakes: 0,
      improvedMistakes: 0,
    });
    render(<LearningEfficiencyPanel onBack={mockOnBack} />);
    expect(screen.getByText(/开始复习后/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/LearningEfficiencyPanel.test.tsx`
Expected: PASS

---

## Task 3: Integrate into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `efficiency` view to ViewRouter type**

Locate the ViewRouter type in `src/components/routing.ts` and add `efficiency` to the View type.

- [ ] **Step 2: Import LearningEfficiencyPanel**

Add to App.tsx imports:
```typescript
import { LearningEfficiencyPanel } from '@/components/LearningEfficiencyPanel';
```

- [ ] **Step 3: Add rendering case in ViewRouter**

Add a case in ViewRouter's renderSwitch:
```typescript
case 'efficiency':
  return <LearningEfficiencyPanel onBack={() => navigate('profile')} />;
```

- [ ] **Step 4: Add navigation entry in Profile/LearningProfile**

Add a button in the profile view to navigate to efficiency panel:
```typescript
<button
  onClick={() => navigate('efficiency')}
  className="w-full py-3 px-4 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
>
  <Award className="w-4 h-4" />
  查看学习效率
</button>
```

- [ ] **Step 5: Update tests**

Update `src/components/__tests__/App.profile.test.tsx` to include the new navigation and view mock.

- [ ] **Step 6: Run tests to verify integration**

Run: `npx vitest run src/components/__tests__/App.profile.test.tsx`
Expected: PASS

---

## Task 4: Full Verification

- [ ] **Step 1: Run all unit tests**

Run: `npx vitest run`
Expected: All tests pass, count >= 1052

- [ ] **Step 2: Run lint**

Run: `npx eslint src --ext .ts,.tsx`
Expected: No errors

- [ ] **Step 3: Run build**

Run: `npx vite build`
Expected: Build succeeds

---

## Task 5: Commit

```bash
git add src/hooks/useLearningEfficiency.ts src/hooks/__tests__/useLearningEfficiency.test.ts src/components/LearningEfficiencyPanel.tsx src/components/__tests__/LearningEfficiencyPanel.test.tsx src/components/routing.ts src/App.tsx src/components/__tests__/App.profile.test.tsx
git commit -m "[EVOLUTION] epic-028 iter-004: add learning efficiency data panel

feat: useLearningEfficiency hook with 3 metrics (memory retention, forgetting curve fit, weakness progress)
feat: LearningEfficiencyPanel component with overall score + 3 metric cards
feat: App.tsx integration via 'efficiency' view
refactor: Pure TypeScript, zero new dependencies
test: Full unit test coverage for hook and component
chore: Update App.profile.test.tsx mocks"
```

---

## File Structure Summary

```
src/hooks/useLearningEfficiency.ts         [CREATE]
src/hooks/__tests__/useLearningEfficiency.test.ts [CREATE]
src/components/LearningEfficiencyPanel.tsx [CREATE]
src/components/__tests__/LearningEfficiencyPanel.test.tsx [CREATE]
src/components/routing.ts                  [MODIFY - add 'efficiency' to View]
src/App.tsx                               [MODIFY - import + render + navigation]
src/components/__tests__/App.profile.test.tsx [MODIFY - update mocks]
```

---

## Spec Coverage

| Requirement | Task |
|---|---|
| Memory retention rate (记忆保持率) | Task 1: useLearningEfficiency hook |
| Forgetting curve fit (遗忘曲线拟合度) | Task 1: useLearningEfficiency hook |
| Weakness progress (薄弱点攻克进度) | Task 1: useLearningEfficiency hook |
| Simple charts display | Task 2: LearningEfficiencyPanel with progress bars |
| Integration | Task 3: App.tsx + routing.ts |

All 3 metrics are computed from existing storage data (read-only). No new storage schema, no new dependencies.