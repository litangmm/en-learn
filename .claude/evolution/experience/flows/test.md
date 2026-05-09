# test 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

### 2026-05-09 (cycle-2026-05-09-9)
- **迭代**: epic-002 iter-003「选择题模式（四选一快速练习）」—— **全部测试通过**
- **测试覆盖**: 240/240 单元测试通过（23 个测试文件，新增 21 个测试）
  - usePractice.choice.test.ts: 6 个测试（options 生成、selectChoice 状态更新、checkAnswer 正确/错误、nextSentence/reset 重置）
  - PracticeCard.choice.test.tsx: 10 个测试（4 选项渲染、点击回调、提交禁用逻辑、正确/错误/未选中高亮样式、错误后无重试）
  - App.choice.test.tsx: 5 个测试（三模式 ToggleGroup、选择题 DOM、initializeInputs 触发、props 传递、500ms auto-play）
  - 全量回归: 之前 219 个测试全部通过
- **E2E**: skipped（4 pending iterations remaining，含 2 个新增紧急迭代）
- **观察**: 选择题测试覆盖了「选项生成 → 选中 → 提交 → 结果显示 → 下一题」的完整流程。干扰项生成的随机性通过 mock Math.random 确保可预测。三种模式的回归测试无交叉污染。

### 2026-05-09 (cycle-2026-05-09-8)
- **迭代**: epic-002 iter-002「音频播放速度控制」—— **全部测试通过**
- **测试覆盖**: 219/219 单元测试通过（20 个测试文件，新增 14 个测试）
  - useSpeech.rate.test.ts: 5 个测试（默认 playbackRate、setPlaybackRate 状态更新、speak 未传 rate 使用 playbackRate、speak 传 rate 覆盖 playbackRate）
  - PracticeCard.speed.test.tsx: 6 个测试（五档渲染、条件渲染、当前速度高亮、回调参数正确、dictation 模式可见、showResult 时可见）
  - App.speed.test.tsx: 3 个测试（默认 1.0x 选中、setPlaybackRate 调用、auto-play 使用 playbackRate）
  - 全量回归: 之前 205 个测试全部通过
- **E2E**: skipped（3 pending iterations remaining）
- **观察**: useSpeech 默认速率从 0.9 调整为 1.0 的变更已同步更新现有测试，无回归

### 2026-05-09 (cycle-2026-05-09-7)
- **迭代**: epic-002 iter-001「纯听写模式」—— **全部测试通过**
- **测试覆盖**: 205/205 单元测试通过（17 个测试文件，新增 16 个测试）
  - PracticeCard.dictation.test.tsx: 11 个测试（中文隐藏、英文文本隐藏、输入框渲染、指令文本显示、showResult 揭示全部内容、fill-in-blanks 模式正常渲染、hints 行为差异）
  - App.mode.test.tsx: 5 个测试（ToggleGroup 渲染、dictation 模式 DOM 变化、initializeInputs 调用、切回 fill-in-blanks、默认模式验证）
  - 全量回归: 之前 189 个测试全部通过
- **E2E**: skipped（4 pending iterations remaining）
- **观察**: 条件渲染测试的关键在于「断言某元素不存在」时避免过于具体的选择器，使用 getByText + expect(...).not.toBeInTheDocument() 模式可靠。Audio 和 speechSynthesis 的全局 mock 继续生效，测试静默运行

### 2026-05-09 (cycle-2026-05-09-6)
- **迭代**: iter-005「智能复习队列」—— **全部测试通过**
- **测试覆盖**: 189/189 单元测试通过（15 个测试文件，新增 24 个测试）
  - review-queue.test.ts: 18 个测试（空队列、到期筛选、时间排序、queueCount、正确答题间隔 [1,3,7,14]、错误答题重置、不存在的 ID、lastReviewedAt 更新、新旧数据兼容）
  - SmartReview.test.tsx: 6 个测试（空状态、按词典分组、开始复习回调、返回导航、复习次数显示、全部复习按钮条件渲染）
  - 全量回归: 之前 165 个测试全部通过
- **E2E**: 1 flaky（pre-existing，与当前迭代无关）
- **观察**: 算法测试使用 vi.useFakeTimers() 控制 Date.now()，确保时间计算可预测；组件测试覆盖异步加载状态（act + waitFor）。189 个测试是项目历史最高，测试基线已显著增强

### 2026-05-09 (cycle-2026-05-09-5)
- **迭代**: iter-005「智能复习队列」
- **测试覆盖**: 165/165 单元测试通过（13 个测试文件）
- **状态**: 类型层变更未引入新测试（可选字段自然兼容），现有回归测试全部通过
- **观察**: Step 1 的类型扩展是「安全变更」——不破坏现有测试，后续 Steps 需要新增的 review-queue 和 SmartReview 测试

### 2026-05-09 (cycle-2026-05-09-3)
- **迭代**: iter-004「数据导入导出」
- **测试覆盖**: 159/159 单元测试通过（新增 28 个测试）
  - export-import.test.ts: 16 个测试（export 结构、import 覆盖、null session、空数据、错误 version、缺失 data、损坏子结构、非对象输入、混合消息）
  - DataManager.test.tsx: 10 个测试（概览计数、活动会话、返回导航、导出下载、导入文件选择、成功/失败状态、无效 JSON、确认对话框、取消行为）
  - 全量回归: 之前 131 个测试全部通过
- **E2E**: skipped（iter-005 仍 pending）
- **观察**: export-import 测试需要 mock URL.createObjectURL 和 anchor click，DataManager 测试需要 mock FileReader 和 window.alert。这些 mock 模式可作为后续文件操作组件的测试模板

### 2026-05-09 (cycle-2026-05-09-2)
- **迭代**: iter-002「错题本 MVP」+ iter-003「学习历史记录」
- **测试覆盖**: 131/131 单元测试通过（新增 59 个测试）
  - mistake-storage.test.ts: 18 个测试（add/get/remove/clear/dedup/reviewedCount/corrupted recovery）
  - history-storage.test.ts: 18 个测试（add/get/clear/limit truncation/corrupted recovery/validation）
  - MistakeBook.test.tsx: 7 个测试（渲染/删除/标记复习/练习按钮）
  - HistoryView.test.tsx: 8 个测试（空状态/日期分组/清空交互）
  - usePractice.test.ts: 补充 8 个测试（错题捕获 4 + history 记录 4）
- **E2E**: skipped（非最后 pending iteration）
- **观察**: 新增组件测试使用了统一的渲染辅助函数和 mock 模式，测试风格与已有测试保持一致。Audio 和 speechSynthesis 的全局 mock 在 vitest.setup.ts 中配置，避免了每个测试文件重复 mock

### 2026-05-09 (cycle-2026-05-09-10)
- **迭代**: epic-002 iter-003a「响应式 UI 适配（移动端 + 桌面端）」—— **全部测试通过**
- **测试覆盖**: 255/255 单元测试通过（25 个测试文件，新增 15 个测试）
  - MobileNav.test.tsx: 8 个测试（5 项渲染、激活态高亮、onNavigate 回调、徽章显示、md:hidden 类名）
  - App.responsive.test.tsx: 7 个测试（MobileNav 条件渲染、桌面导航隐藏、DictionarySelector 位置、底部 padding）
  - 全量回归: 之前 240 个测试全部通过
- **E2E**: skipped（3 pending iterations remaining）
- **观察**: 响应式测试的关键创新是使用 mock matchMedia 在 jsdom 中模拟断点，验证了组件的条件渲染逻辑。首次建立响应式测试基线，为后续迭代的移动端兼容性提供了回归保障

### 2026-05-09 (cycle-2026-05-09-1)
- **迭代**: iter-001「核心存储服务与会话持久化」
- **测试覆盖**: 72/72 单元测试通过
  - storage.test.ts: 15 个测试（save/load roundtrip, 版本迁移, corrupted data 恢复, quota exceeded）
  - usePractice.test.ts: 22 个测试（恢复 persisted state, 保存触发, dictionary 切换清理）
- **E2E**: skipped（非最后 pending iteration）
- **观察**: 测试策略有效，关键边界均有覆盖
