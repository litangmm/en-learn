# Plan: epic-028 iter-005 自适应出题权重算法优化

## Overview

**Iteration**: iter-005 of epic-028 (智能学习路径引擎)
**Title**: 自适应出题权重算法优化
**Scope**: frontend-only
**Workload**: medium (30~60min)

## Objective

结合间隔重复状态和错误率数据，构建综合出题权重评分。当前 `useQuestionWeighting` 仅基于 `mistakes` 数据计算权重，存在三个可优化方向：

1. **未到复习期的题降低权重** — 当 `nextReviewAt > now` 时，句子在「记忆稳定期」，不应高频重复
2. **逾期复习题提升权重** — 当 `nextReviewAt < now` 且 `lastReviewedAt` 存在时，遗忘曲线衰减，应优先召回
3. **reviewHistory 正确率参与权重** — `reviewHistory[].isCorrect` 反映真实记忆保持率，高正确率可适当降权

## Current Architecture

- `useQuestionWeighting.getSentenceWeight(sentenceId, allMistakes)` — 纯函数，基于 `mistakes.wrongAnswers.length` 和 `attempts` 计算权重
- `useQuestionWeighting.getWeightedSentenceIds(allSentenceIds, allMistakes, count)` — 选择 count 个句子，top 5 加权随机，其余普通随机
- 权重公式: `weight = 1.0 + (mistakeCount * 0.5) + (errorRate * 1.0)`，上限 5.0

## Files to Modify

### 1. `src/hooks/useQuestionWeighting.ts` (修改)

**新增常量**:

```typescript
const OVERDUE_BOOST = 1.5;        // 逾期复习题额外权重加成
const NOT_DUE_PENALTY = 0.3;      // 未到复习期的权重折减系数
const MAX_WEIGHT = 5.0;            // 已有
```

**修改 `getSentenceWeight` 函数签名**: 增加 `currentTime: number` 参数（毫秒时间戳，用于判断复习是否到期）

**新权重公式**:

```
baseWeight = 1.0
mistakeBoost = mistakeCount * 0.5
errorRateBoost = (totalErrors / totalAttempts) * 1.0

// 新增维度 1: 间隔重复状态
if (nextReviewAt !== undefined && nextReviewAt > currentTime) {
  // 未到复习期 → 降权（记忆稳定，不需要高频重复）
  spacedRepetitionModifier = NOT_DUE_PENALTY
} else if (nextReviewAt !== undefined && nextReviewAt <= currentTime) {
  // 逾期复习 → 提权（遗忘曲线衰减，需要召回）
  spacedRepetitionModifier = OVERDUE_BOOST + reviewAccuracyBonus
  // reviewAccuracyBonus = max(0, 1 - (correctCount / totalCount)) * 0.5
}

finalWeight = min((baseWeight + mistakeBoost + errorRateBoost) * spacedRepetitionModifier, MAX_WEIGHT)
```

**注意**: `nextReviewAt`、`lastReviewedAt`、`reviewHistory` 均存在于 `Mistake` 类型中，无需新增存储。

### 2. `src/hooks/usePractice.ts` (修改)

- 第 143 行调用 `getWeightedSentenceIds(allSentenceIds, allMistakes, 10)` 时，增加第三个参数 `Date.now()`
- 实际上 `getWeightedSentenceIds` 内部调用 `getSentenceWeight`，所以只需修改 `getWeightedSentenceIds` 的签名

### 3. `src/hooks/useQuestionWeighting.test.ts` (新增)

覆盖场景：
- 未到复习期的句子权重降至 30%
- 逾期复习的句子权重提升 1.5x
- 逾期 + 低正确率的句子权重叠加
- 无 reviewHistory 的句子回退到现有逻辑
- reviewHistory 中全部正确的句子权重正常降权
- 权重上限 5.0 不突破

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/__tests__/useQuestionWeighting.test.ts` | Hook 单元测试 |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useQuestionWeighting.ts` | 新增常量、修改函数签名、扩展权重公式 |
| `src/hooks/usePractice.ts` | 调用点传递 `Date.now()` |

## Dependencies

无新增依赖。使用现有 `Mistake.reviewHistory`、`Mistake.nextReviewAt`、`Mistake.lastReviewedAt` 数据。

## Test Strategy

### 单元测试 (useQuestionWeighting.test.ts)

| 测试用例 | 输入 | 期望输出 |
|---------|------|---------|
| 无复习数据回退 | 无 mistakes | weight = 1.0 (现有逻辑) |
| 未到复习期降权 | nextReviewAt = now + 86400000 (1天后) | weight < 基础权重 |
| 逾期复习提权 | nextReviewAt = now - 86400000 (1天前) | weight > 基础权重 |
| 逾期 + 低正确率叠加 | 逾期 + 20%正确率 | weight 显著高于基础值 |
| 逾期 + 高正确率 | 逾期 + 100%正确率 | weight 提权但不过度 |
| 权重上限 | 大量 mistakes + 逾期 | weight <= 5.0 |
| getWeightedSentenceIds 集成 | 有复习状态的 mistakes | 高权重句子优先被选入前 5 |

## Implementation Steps

1. **修改 `useQuestionWeighting.ts`**: 添加常量、扩展 `getSentenceWeight` 函数（新增 `currentTime` 参数和新权重维度）
2. **扩展 `getWeightedSentenceIds`**: 将 `currentTime` 透传给 `getSentenceWeight`
3. **修改 `usePractice.ts`**: 调用点传递 `Date.now()`
4. **写单元测试**: 覆盖所有边界场景
5. **运行全量测试**: 确保 1097 测试零回归
6. **运行 lint**: 确保零新增 warning
7. **运行 build**: 确保编译通过
8. **Commit**: `[EVOLUTION] epic-028 iter-005: integrate spaced repetition into question weighting`