# 实现计划：体验优化与响应式适配

> Epic ID: epic-004（建议）
> 来源：用户完整体验评测反馈（`dir-user-review-001`）
> 日期：2026-05-10

---

## Epic 目标

解决移动端基础可用性和学习逻辑一致性两大瓶颈，使产品从"功能丰富的 demo"升级为"可靠的日常学习工具"。

---

## 迭代拆分

### iter-001：移动端响应式适配（P0）
**工作量**: medium（30-60min）
**状态**: pending
**scope**: frontend-only

**修改文件**:
- `src/App.tsx` — Header 响应式重构
- `src/components/PracticeCard.tsx` — 句子区域、输入框、模式切换响应式
- `src/App.css` — 如有需要增加移动端滚动保护

**具体步骤**:
1. `App.tsx` Header：中间得分区域增加 `flex-wrap`，Trophy/Award 按钮在 `lg:` 以下隐藏文字只显示图标，标题在移动端缩小为 `text-base`
2. `App.tsx` 模式切换：在移动端（`< md`）将 ToggleGroup 改为 `grid grid-cols-2 gap-2`，或包裹在 `overflow-x-auto` 容器中
3. `PracticeCard.tsx` 输入框：移动端宽度从 `w-28` 改为 `min-w-[72px] max-w-[120px]`，句子区域增加 `overflow-x-auto` 或 `break-words`
4. `PracticeCard.tsx` 音频按钮：移动端缩小尺寸或简化文案
5. 验证：在 `App.responsive.test.tsx` 中补充移动端布局测试

---

### iter-002：答题反馈与提示文案重构（P1）
**工作量**: medium（30-60min）
**状态**: pending
**scope**: frontend-only

**修改文件**:
- `src/App.tsx` — 底部提示文案动态化
- `src/components/PracticeCard.tsx` — 答错反馈卡片重构、选择题选中态、连词成句按钮提示

**具体步骤**:
1. `App.tsx` 行 774-779：将固定提示替换为按 `practiceMode` 的条件渲染
2. `PracticeCard.tsx` 答错反馈（行 462-471）：重写为分区卡片结构
   - 新增 `renderWrongAnswerFeedback()` 辅助函数
   - 分区：你的答案（红色）/ 正确答案（绿色）/ 解析（蓝色提示区）
3. `PracticeCard.tsx` 选择题选中态（行 99-131）：在选项卡片内增加 `CheckCircle2` 图标
   - 选中时显示在右上角
   - 未选中时显示空心圆圈占位保持对齐
4. `PracticeCard.tsx` 连词成句提交按钮（行 478-498）：
   - 按钮置灰时，在旁边或下方显示提示：「请先点击下方单词组成完整句子」
   - 或在答案区上方显示「已选 X/Y 个单词」进度

---

### iter-003：模式语义与题目数据统一（P2）
**工作量**: medium（30-60min）
**状态**: pending
**scope**: frontend-only

**修改文件**:
- `src/data/types.ts` — 可选：增加 `isExampleSentence` 标记
- `src/hooks/usePractice.ts` — 过滤非例句题目
- `src/components/PracticeCard.tsx` — 选项渲染逻辑

**具体步骤**:
1. 短期方案（不改数据文件，改渲染逻辑）：
   - 在 `usePractice.ts` 的 `options` 生成中，对 `english` 做启发式判断：
     - 若包含 `"` 引号或 `;` 分号且长度较短，视为释义，在选项中显示 `chinese` 或 `blanks[0].word`
     - 若首字母大写且以 `.` `!` `?` 结尾，视为完整句子
   - `sentence-reorder` 的 `sentenceTokens` 生成前，先判断当前句子的 `english` 是否为完整句子，若不是则跳过（`nextSentence()` 自动进入下一题）
2. 长期方案（可选，数据清洗）：
   - 给 `Sentence` 增加 `exampleSentence?: string` 字段
   - 在数据加载时，若 `exampleSentence` 存在则优先用于练习，否则回退到 `english`

---

### iter-004：智能复习规则可视化（P3）
**工作量**: small（15-30min）
**状态**: pending
**scope**: frontend-only

**修改文件**:
- `src/components/SmartReview.tsx`
- `src/services/storage.ts` — 可选：暴露复习规则常量

**具体步骤**:
1. `SmartReview.tsx` 页面顶部（标题下方）增加规则说明横幅：
   - 文案：「复习间隔基于遗忘曲线：第1次错误后1天 → 3天 → 7天 → 14天。到期题目按最近错误时间排序。」
   - 样式：`bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700`
2. 每道题目增加优先级标签：
   - 错误次数 >= 2 且 reviewedCount == 0 → 红色 Badge「高优先级」
   - nextReviewAt <= now → 蓝色 Badge「今日到期」
   - reviewedCount >= 3 → 绿色 Badge「已掌握」
3. `storage.ts` 将 `intervals = [1, 3, 7, 14]` 提取为可导出的常量，供 UI 引用

---

### iter-005：首次/恢复弹窗体验打磨
**工作量**: small（15-30min）
**状态**: pending
**scope**: frontend-only

**修改文件**:
- `src/App.tsx` — Recovery Dialog

**具体步骤**:
1. Recovery Dialog（行 646-661）：
   - 点击「重新开始」后，确保 `handleDiscardSession` 先关闭弹窗再调用 `reset()`，避免状态滞后感
   - 给按钮增加 loading 状态或明确的点击反馈
   - 弹窗关闭动画保持 200ms

---

## 测试策略

- **单元测试**：每个 iter 至少覆盖新增/修改组件的核心交互
- **响应式测试**：`App.responsive.test.tsx` 补充 375px/390px 布局断言
- **E2E**：Playwright 在移动端视口下验证题卡不溢出、模式切换正常
- **回归测试**：确保四种练习模式在桌面端行为不变

---

## 依赖关系

- iter-001 和 iter-002 可并行（修改不同文件区域）
- iter-003 依赖 iter-001 完成（避免在响应式适配过程中同时改数据逻辑）
- iter-004 和 iter-005 独立，可在任何时候执行
