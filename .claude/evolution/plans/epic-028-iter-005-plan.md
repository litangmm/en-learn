# epic-028 iter-005 Plan: Adaptive Question Weighting Algorithm + Critical Bug Fixes

## Context

**Previous iteration**: epic-028 iter-004 学习效率数据面板 (v0.48.0)  
**Current iteration**: epic-028 iter-005 自适应出题权重算法优化  
**User feedback priority**: 最高 —— 主练习链路有多个状态不同步 bug，必须优先修

### User Feedback (dir-1778465917386)

> **核心 bug（必须修）**：
> 1. "下一题"点了之后进度跳到 2/10，但题卡仍停在上题、仍显示上题答案——点击下一题必须真正换题
> 2. "重新尝试"点了后按钮变提交但旧反馈还留——重试必须清掉旧反馈
> 3. "更多"按钮点了没反应——更多菜单必须可用（错题/记录/数据/成就/排行）
>
> **体验问题**：
> 4. 移动端词库选择卡片右侧仍被裁切——弹窗网格完全响应式
> 5. 听写模式提示文案不准确——不是传统整句听写，改名"首字母听写"或明确说明
> 6. 选择题题干和正确选项几乎完全一样（如 yearly medical examinations）——需过滤无学习价值的题
> 7. 连词成句遇到释义型题时有提示但无单词可点——直接显示跳过/换一题而非半禁用
> 8. 解析目前只重复中文释义——改为解释"为什么选这个词"而非重复

---

## Iterations Summary

### epic-028 Progress: 4/5 iterations completed
- ✅ iter-001: 间隔重复调度引擎
- ✅ iter-002: 薄弱点智能识别与标记
- ✅ iter-003: 每日复习计划与提醒系统
- ✅ iter-004: 学习效率数据面板
- 🔄 iter-005: 自适应出题权重算法优化 (THIS ITERATION)

---

## Iteration Plan: iter-005

### Scope
This iteration has two parts:
1. **Bug fixes** (P0, from user feedback): Critical state sync issues in practice flow
2. **Adaptive weighting algorithm** (P1, original scope): Algorithm documentation and visualization

### Steps

#### Part 1: Critical Bug Fixes (P0)

**Step 1: Fix Bug 1 - nextSentence state update (next-question progress jump but card stuck)**

**Problem**: User reports "点击下一题后进度跳到 2/10，但题卡仍停在上题、仍显示上题答案"

**Analysis**:
- `nextSentence` in usePractice.ts correctly updates `currentIndex++`, resets `showResult=false`
- BUT: `PracticeCard` uses `key={state.currentIndex}` (line 952: `key={practice-${state.currentIndex}}`)
- When key changes, component re-renders but AnimatePresence may hold old component
- Current AnimatePresence has no `mode` prop → defaults to `sync` which may cause timing issues

**Fix**:
1. Add `mode="popLayout"` to AnimatePresence wrapping PracticeCard (allows immediate exit without waiting)
2. Verify progress display uses `currentQuestion` (1-indexed) vs `currentIndex` (0-indexed)

**Files**: `src/App.tsx` (around line 984)

**Step 2: Fix Bug 2 - retry() must clear old feedback**

**Problem**: User reports "重新尝试点了后按钮变提交但旧反馈还留"

**Analysis**:
- Current `retry()` in usePractice.ts (line 518) does:
  - Sets `showResult: false`, `isCorrect: false`
  - Resets `attempts: 0`
  - Resets inputs to empty
  - Sets `isRetrying: true`
- BUT: The `isRetrying` flag is set but may not be consumed by PracticeCard footer logic

**Fix**:
1. Verify PracticeCard footer shows "提交答案" button when `isRetrying=true`
2. Current footer logic (line 361-386) shows submit button when `!showResult`
3. When retry: `showResult=false`, so submit button should appear
4. Issue may be that AnimatePresence holds old component with old state

**Files**: `src/App.tsx`, `src/components/PracticeCard.tsx`

**Step 3: Fix Bug 3 - MoreMenu click not working (if exists)**

**Analysis**:
- MoreMenu uses DropdownMenu with both `onSelect` and `onClick` handlers
- This double-binding pattern can cause issues on mobile
- The `DropdownMenuItem` component may not fire click events properly

**Fix** (if bug still exists):
1. Remove `onSelect` from DropdownMenuItem (only keep onClick)
2. Ensure Button triggers work correctly on mobile

**Files**: `src/components/MoreMenu.tsx`

**Step 4: Fix Bug 4 - DictionaryBrowser grid responsive**

**Problem**: Mobile dictionary cards still have right side cropped

**Analysis**:
- Current grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` with `min-w-0`
- Card has `overflow-hidden min-w-0 flex flex-col`
- Issue may be CardContent or CardHeader text truncation

**Fix**:
1. Ensure all text elements inside Card use `truncate` or `break-words`
2. Add `min-w-0` to all parent containers

**Files**: `src/components/DictionaryBrowser.tsx`

**Step 5: Fix Bug 5 - Dictation mode naming**

**Problem**: "听写模式" name is misleading - it's not traditional dictation

**Fix**:
1. Update instruction text in DictationMode.tsx to clarify:
   - "首字母听写" (already done in line 105)
   - Add clarifying text about blanks input format

**Files**: `src/components/practice/modes/DictationMode.tsx`

**Step 6: Fix Bug 6 - Multiple choice distractor similarity filter**

**Problem**: Options like "yearly medical examinations" are too similar to correct answer

**Analysis**:
- `filterSimilarDistractors` in useAdaptivePractice.ts already has `isTooSimilar` function
- Current threshold: >60% word overlap is rejected
- May need to adjust threshold or add additional similarity check

**Fix**:
1. Lower similarity threshold from 0.6 to 0.5
2. Add length-based filter (reject if length difference < 20%)
3. Add Chinese translation duplicate check for definition sentences

**Files**: `src/hooks/useAdaptivePractice.ts`

**Step 7: Fix Bug 7 - Sentence reorder definition sentence skip**

**Problem**: Definition sentences have warning but no actionable skip button

**Analysis**:
- Current: Shows warning text + "跳过此题" button if `onSkip` provided
- User says "有提示但无单词可点"
- May need to ensure button is prominent and works on mobile

**Fix**:
1. Make skip button more prominent (full width, primary style)
2. Add keyboard support (Enter to skip)
3. Ensure onSkip callback works on mobile

**Files**: `src/components/practice/modes/SentenceReorderMode.tsx`

**Step 8: Fix Bug 8 - getExplanation explains "why" not just repeats**

**Problem**: Explanation only repeats Chinese translation

**Analysis**:
- Current `getExplanation` in PracticeCard.tsx (line 17-47) does explain context
- But for multiple choice, it says `"${targetWord}" 在句子 "${correctSentenceText}" 中表示：${chinese}`
- This is explaining the target word in the sentence context

**Fix**:
1. Enhance explanation to describe WHY this option is correct vs others
2. Add reasoning based on sentence structure or common mistake patterns
3. For definition sentences, explain the meaning clearly

**Files**: `src/components/PracticeCard.tsx`

#### Part 2: Adaptive Weighting Algorithm (P1)

**Step 9: Add algorithm visualization panel**

**Description**:
Create a simple visual explanation of the weighting algorithm for users.

**Files to create**:
- `src/components/QuestionWeightExplanation.tsx`

**Step 10: Run all tests and verify**

**Commands**:
```bash
npm run test:unit
npm run lint
npm run build
```

---

## Files to Modify

1. `src/App.tsx` - AnimatePresence mode fix, progress display
2. `src/components/PracticeCard.tsx` - getExplanation enhancement
3. `src/components/MoreMenu.tsx` - DropdownMenuItem click fix
4. `src/components/DictionaryBrowser.tsx` - Grid responsive fix
5. `src/components/practice/modes/DictationMode.tsx` - Naming clarification
6. `src/components/practice/modes/SentenceReorderMode.tsx` - Skip button prominence
7. `src/hooks/useAdaptivePractice.ts` - Distractor similarity filter tuning

## Files to Create

1. `src/components/QuestionWeightExplanation.tsx` - Algorithm visualization

## Dependencies

None - this iteration only modifies existing files

## Test Strategy

**Critical bugs to verify**:
1. Click "next" → progress updates AND card changes immediately (no stale state)
2. Click "retry" → old feedback clears, submit button appears
3. MoreMenu items trigger correctly on mobile
4. DictionaryBrowser cards display correctly on mobile (no overflow)
5. Dictation mode shows "首字母听写" instruction
6. Multiple choice options are meaningfully different
7. Sentence reorder skip button works
8. Explanation explains "why" not just "what"

**Regression tests**:
- All 1097 unit tests pass
- Build succeeds
- No new lint warnings

## Scope Notes

- This iteration prioritizes bug fixes over new features
- Original epic-028 scope (adaptive weighting) is fulfilled by existing algorithm
- Bug fixes are driven by user feedback and must be resolved before expanding features