# implement 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

### 2026-05-11 (cycle-2026-05-11-59)
- **迭代**: epic-005 iter-003「分享触发点与频次控制」—— **完整实现**
- **实现质量**: 高 — 零 bug，零 lint 错误，649 测试全通过
- **关键决策**:
  - useXP.addXP 返回 `{ profile, oldLevel, newLevel, leveledUp }` 用于等级变化检测，通过返回对象扩展而非新方法保持向后兼容
  - SharePromptToast 非阻塞式设计（1.5s setTimeout 自动消失）确保不打断学习心流，使用 triggerKey 强制 re-mount 实现动画重播
  - 频次控制 isRecentShareTrigger(type, id) 使用 useRef<string[]> recentShareTriggers 记录最近触发，5 分钟内同类型不重复弹窗
  - BadgeUnlockToast 添加 onShare prop，用户可从徽章解锁 Toast 直接触发分享
  - ResultModal 当天首次自动弹窗 ShareDialog，非首次则仅显示分享按钮
- **观察**: 零新增依赖，零架构变更。SharePromptToast 的非阻塞式设计验证了 PM-UX 的心流保护建议。iter-004 数据追踪不涉及 UI 变更，可快速推进。epic-005 即将收官（仅剩 iter-004）

### 2026-05-11 (cycle-2026-05-11-56)
- **迭代**: epic-005 iter-002「多格式导出（图片/文本）」—— **完整实现**
- **实现质量**: 高 — 零 bug，零 lint 错误，623 测试全通过
- **关键决策**:
  - html2canvas 包安装用于将 React 组件渲染为 canvas 并导出为 PNG
  - useShareExport hook 提供 generateShareText/downloadImage/copyText 三个核心函数
  - generateShareText 生成格式化的文本分享内容（包含等级/XP/连击/正确率/成就等）
  - downloadImage 使用 html2canvas 将 ShareCard DOM 元素转为 canvas，然后导出为 PNG Blob
  - copyText 使用 Clipboard API 复制到剪贴板，fallback 到 selectAll + execCommand
  - ShareDialog 中 handleGenerateImage 和 handleCopyText 替换为实际实现，添加下载/复制成功反馈
  - 修复 as any 类型转换位置 lint 错误
- **观察**: 零新增架构，零构建体积问题。html2canvas 会增加约 50KB gzip 构建体积（PM-Mon 关注点），但仍在可接受范围。iter-003 需要设计分享触发时机，避免打断学习心流

### 2026-05-10 (cycle-2026-05-10-38)
- **迭代**: epic-006 iter-001「视图路由抽象 + P0/P1 Bug 修复」—— **完整实现**
- **实现质量**: 高 — 架构设计清晰，解耦效果显著
- **关键决策**:
  - ViewRouter.tsx 使用 `view → component` 映射表设计，视图与组件完全解耦，新增视图只需在映射表中添加条目
  - NavigationContext.tsx 提供 `view`/`setView`/`isFocusMode`/`toggleFocusMode` 状态，通过 Provider 模式共享
  - App.tsx 重构移除 ~135 行嵌套三元运算符，使用 `<ViewRouter>` 和 `<NavigationProvider>` 包装，代码行数减少约 40%
  - routing/index.ts 提供 barrel exports，便于后续扩展和维护
  - P0（切换词典清除进度）和 P1（输入框高度）问题已在重构期间验证并修复
- **观察**: 零新增依赖，零构建体积增长。ViewRouter 的映射表设计为后续 iter-002（PracticeCard 策略模式）和新功能接入提供了清晰的结构。16 个 ViewRouter 测试确保了重构安全性，501/501 测试全部通过。

### 2026-05-10 (cycle-2026-05-10-28)
- **迭代**: epic-004 iter-003「模式语义与题目数据统一（P2）」—— **完整实现**
- **实现质量**: 高 — 数据识别逻辑清晰，UI 差异化处理得当
- **关键决策**:
  - `isDefinitionSentence(sentence)` 使用正则表达式 `/"(.*?)"/` 检测 blanks[0].word 是否被引号包裹，边界清晰且可解释
  - `ChoiceOption` 接口 `{ id, text }` 规范化了选择题选项类型，避免使用混合格式
  - options 生成时释义句使用 `sentence.chinese` 作为选项文本，避免显示陌生英文句子，降低认知负荷
  - `displayText` 逻辑在 PracticeCard 中统一处理释义题（中文）和 normal 题（英文）的显示差异
  - sentence-reorder 模式对释义句显示警告而非错误，提供安全的边界处理
- **观察**: 零新增依赖，零新增组件，零构建体积增长。isDefinitionSentence 的引号检测是轻量级数据识别，无需额外训练或复杂算法。ChoiceOption 接口规范化提升了类型安全性。8 个源文件的变更范围极小，全量 459 测试零回归

### 2026-05-10 (cycle-2026-05-10-21)
- **迭代**: epic-003 iter-005「学习排行榜（本地）」—— **完整实现**
- **实现质量**: 高 — 数据模型简洁（纯派生），算法边界清晰，集成无冲突
- **关键决策**:
  - LeaderboardEntry 接口包含 rank/player/score/detail/metric，足够表达完整排名信息，无需额外冗余字段
  - getLeaderboardEntries 纯函数从历史记录 SessionHistory 派生，零新增存储，零数据持久化风险
  - 三分类计算逻辑分离：score 按 totalScore 排序、accuracy 按正确率排序、speed 按 pointsPerMinute 排序，每类独立计算避免交叉污染
  - 时间筛选通过日期比较实现：today 比较日期字符串、week 比较时间戳差值 ≤7 天、all 不做筛选，逻辑简洁可解释
  - 同分并列处理通过排序后遍历分配排名，相同分数共享同一排名，符合常规排行榜语义
  - Leaderboard 组件 category tabs 使用 framer-motion layoutId 实现流畅切换指示器动画，复用已有依赖
  - App.tsx 集成中，leaderboard 视图与现有 8 个视图并列，通过条件渲染自然切换
- **观察**: 零新增依赖，零构建体积增长。排行榜作为纯派生功能，与现有 session/mistakes/history/xpProfile/dailyChallenges/badgeProgress 完全解耦，无数据冲突风险。11 个现有测试文件的批量 mock 更新展示了 hook API 扩展时的测试维护成本

### 2026-05-09 (cycle-2026-05-09-19)
- **迭代**: epic-003 iter-003「每日挑战任务面板」—— **完整实现**
- **实现质量**: 高 — 数据模型简洁，算法边界清晰，集成无冲突
- **关键决策**:
  - ChallengeType 联合类型设计为 `'correct' | 'answer' | 'streak'`，与现有学习行为自然对齐，无需用户学习新交互模式
  - DailyChallenge 接口包含 id/title/description/type/target/current/completed/claimed/rewardXP，足够表达完整挑战状态，无需额外冗余字段
  - generateDailyChallenges 使用确定性种子洗牌：日期字符串哈希作为种子，Fisher-Yates seeded shuffle 从 6 题池选 3 题，确保所有用户同一天看到相同挑战组合
  - trackActivity 接口设计为 `(type: 'correct' | 'answer' | 'streak', value?: number)`，通用 enough 支持未来自适应挑战（动态调整 target）
  - claimReward 通过 storage.addXP 直接发放奖励，复用现有 XP 系统，避免重复实现奖励逻辑
  - DailyChallengePanel 的进度条使用 `(current / target) * 100` 百分比宽度，视觉反馈直观
  - App.tsx 集成中，trackActivity 在正确/错误答题的 useEffect 中调用，与现有答题逻辑自然融合
- **观察**: 零新增依赖，零构建体积增长。每日挑战作为全新数据维度，与现有 session/mistakes/history/xpProfile 完全解耦，并行存储在 localStorage 中。9 个现有测试文件的批量 mock 更新展示了 hook API 扩展时的测试维护成本

### 2026-05-09 (cycle-2026-05-09-16)
- **迭代**: epic-003 iter-001「XP 积分与等级系统」—— **完整实现**
- **实现质量**: 高 — 数据模型简洁，算法边界清晰，集成无冲突
- **关键决策**:
  - XPProfile 数据模型采用 `{ totalXP, currentLevel, levelProgress }` 三字段，足够表达完整状态，无需额外冗余字段
  - LEVEL_THRESHOLDS 使用累积 XP 数组 `[0, 100, 250, ...]`，等级计算通过 `findLastIndex` 找到最高满足阈值，简洁可解释
  - addXP 算法中 progress 计算 `((totalXP - prevThreshold) / (nextThreshold - prevThreshold)) * 100`，最大等级时固定 100%，避免除零
  - awardedXPRef 使用 `useRef<Set<string>>` 记录已奖励句子 ID，防止 retry 导致的重复奖励，复用 processedReviewRef 模式
  - 模式差异化基础 XP（multiple-choice=8, sentence-reorder=12, others=10）直接在 App.tsx useEffect 中硬编码，简单直接，后续如需调整可提取为配置对象
  - XPBar 组件 compact 模式仅显示 Lv. 徽章 + 迷你进度条，full 模式预留 future profile 视图扩展
  - exportAllData / importAllData 纳入 xpProfile 字段，递归校验复用现有 isValidXPProfile
- **观察**: 零新增依赖，零构建体积增长。XP 系统作为全新数据维度，与现有 session/mistakes/history 完全解耦，并行存储在 localStorage 中

### 2026-05-09 (cycle-2026-05-09-13)
- **迭代**: epic-002 iter-004「专注模式（全屏无干扰 UI）」—— **完整实现**
- **实现质量**: 高 — 状态管理简洁，条件渲染清晰
- **关键决策**:
  - isFocusMode 状态与 toggleFocusMode 回调在 App.tsx 顶层管理，通过 props 向下传递
  - 专注模式入口按钮使用 Eye 图标（lucide-react），位于练习模式 ToggleGroup 旁，视觉层级清晰
  - 条件渲染通过 isFocusMode 统一控制：Header、ToggleGroup、bottom hint、MobileNav 全部隐藏，main content 区域使用更大垂直 padding
  - 极简悬浮进度条固定在顶部，显示当前题目序号、分数和退出按钮，使用 X 图标
  - ESC 键监听使用 isFocusModeRef 避免 stale closure，仅在 isFocusMode=true 时处理，INPUT/TEXTAREA 中跳过
  - PracticeCard 的 isFocusMode prop 为可选（默认 false），专注模式下：简化 header（隐藏题号/尝试次数徽章）、增大内边距（p-6 md:p-10）、增大字号（中文 text-lg md:text-xl、英文 text-xl md:text-2xl）、更干净的卡片样式（shadow-xl border-slate-100）
- **观察**: 零新增依赖，零新增组件（除测试外），零构建体积增长。专注模式作为「视图状态」的设计避免了路由变更或页面跳转的复杂度

### 2026-05-09 (cycle-2026-05-09-9)
- **迭代**: epic-002 iter-003「选择题模式（四选一快速练习）」—— **完整实现**
- **实现质量**: 高 — 状态机扩展自然，UI 条件渲染清晰
- **关键决策**:
  - usePractice hook 中 options 使用 useMemo 从完整词典（非仅 shuffled 的 10 条）排除当前句后随机取 3 个干扰项，确保选项多样性
  - checkAnswer 在选择题模式下传入 selectedOptionId，答对得 10 分（无尝试惩罚），答错记录到 pendingMistakes
  - PracticeCard 通过可选 props（options/selectedChoiceId/onSelectChoice）实现向后兼容，填空/听写模式零变更
  - 选择题模式下提交按钮在选中前禁用，showResult 后无重试仅下一题（一击即走模式）
  - App.tsx ToggleGroup 扩展为三模式，auto-play 延迟 500ms（介于填空 800ms 和听写 300ms 之间）
- **观察**: 三种模式共享同一套 usePractice 状态机，状态切换通过 mode 条件分支处理。当前 3 种模式仍可通过 if/else 管理，但 4+ 模式时强烈建议重构为配置驱动的渲染策略。

### 2026-05-09 (cycle-2026-05-09-8)
- **迭代**: epic-002 iter-002「音频播放速度控制」—— **完整实现**
- **实现质量**: 高 — API 设计简洁，向后兼容
- **关键决策**:
  - useSpeech hook 保留 `speak(text, rate?)` 的 rate 覆盖参数，确保向后兼容
  - SPEEDS 常量 [0.5, 0.75, 1.0, 1.25, 1.5] 定义为离散选择，降低实现复杂度
  - PracticeCard Header 中速度选择器始终可见（包括 showResult 时），不干扰结果查看
  - App.tsx 移除所有硬编码速率，统一使用用户选择的 playbackRate
- **观察**: 零新增依赖，零构建体积增长

### 2026-05-09 (cycle-2026-05-09-7)
- **迭代**: epic-002 iter-001「纯听写模式」—— **完整实现**
- **实现质量**: 高 — 类型设计清晰，UI 条件渲染逻辑简洁
- **关键决策**:
  - PracticeMode 采用联合类型 `'fill-in-blanks' | 'dictation'`，后续可自然扩展新模式
  - PracticeCard dictation 模式下隐藏 chinese 翻译和英文句子文本，showResult 时揭示全部内容供核对
  - 音频按钮在 dictation 模式下使用蓝色 filled 样式增大视觉权重，符合心流设计
  - dictation 模式自动播放延迟缩短至 300ms（vs fill-in-blanks 的 800ms），减少等待摩擦
  - 模式切换时调用 initializeInputs() 重置当前输入，避免模式间状态污染
- **观察**: 纯 UI 迭代的实现复杂度较低，但条件渲染逻辑的维护成本会随模式数量增加。当前 2 种模式通过 if/else 管理仍可接受，4+ 模式时建议提取为策略模式或配置对象

### 2026-05-09 (cycle-2026-05-09-6)
- **迭代**: iter-005「智能复习队列」—— **完整实现**
- **实现质量**: 高 — 算法实现严谨，UI 交互清晰
- **关键决策**:
  - Mistake 类型扩展采用可选字段，确保旧数据向后兼容
  - scheduleNextReview 使用 [1,3,7,14] 天间隔数组，正确答题递增 reviewedCount，错误答题重置间隔为 1 天但保留 reviewedCount
  - SmartReview 组件按 dictionaryId 分组加载和展示，复用 MistakeBook 的异步词典加载模式
  - App.tsx 使用 processedReviewRef 防止 retry 导致的重复调度，useEffect 监听 showResult 自动触发 scheduleNextReview
  - 复习模式通过 isReviewMode state 标记，与正常练习模式共用 practice 视图但数据源不同
- **观察**: 算法型迭代的实现需要特别关注边界情况（reviewedCount 超限、时区、重复调度），iter-005 通过 ref 防抖和 comprehensive 单元测试有效覆盖了这些边界

### 2026-05-09 (cycle-2026-05-09-5)
- **迭代**: iter-005「智能复习队列」
- **实现进度**: Step 1 完成 — Mistake 类型扩展（nextReviewAt/lastReviewedAt 可选字段）
- **关键决策**: 保持向后兼容，旧数据无新字段仍视为合法；可选字段设计为后续 scheduleNextReview 算法提供数据结构基础
- **观察**: 类型层变更是后续所有算法和 UI 的前提，需确保类型定义与存储校验（isValidMistake）同步更新

### 2026-05-09 (cycle-2026-05-09-3)
- **迭代**: iter-004「数据导入导出」
- **实现质量**: 高 — 校验严谨，用户体验完善
- **关键决策**:
  - ExportData 定义在 storage.ts 内避免循环依赖
  - isValidExportData 递归校验各子结构（session/mistakes/history），拒绝任何非法输入
  - importAllData 返回结构化结果（success + importedCounts + message），便于 UI 展示
  - DataManager 组件使用 hidden input 触发文件选择，blob URL 实现浏览器下载，无需外部依赖
  - 导入前确认对话框 + 成功/失败 inline alert，用户操作有明确反馈
- **观察**: 数据导入导出是首个涉及文件 I/O 的迭代，测试需要 mock URL.createObjectURL 和 anchor click，测试模式为后续文件操作功能提供了参考

### 2026-05-09 (cycle-2026-05-09-2)
- **迭代**: iter-002「错题本 MVP」+ iter-003「学习历史记录」
- **实现质量**: 高 — 代码结构清晰，边界处理完善
- **关键决策**:
  - 错题去重使用 sentenceId 作为 key，避免重复记录同一错题
  - 错题练习模式通过 sentenceIds 参数复用现有 usePractice hook，最小化代码变更
  - 历史记录自动上限 100 条（可配置），超限移除最旧
  - isValidHistory 校验过滤非法数据，防止 corrupted entry 污染列表
- **观察**: 两个迭代的实现均遵循了 iter-001 确立的存储服务设计模式（单例、版本化、降级恢复），代码一致性高

### 2026-05-09 (cycle-2026-05-09-11)
- **迭代**: epic-002 iter-003b「纯听写模式重新设计」—— **完整实现**
- **实现质量**: 高 — 改动范围极小，UX 影响显著
- **关键决策**:
  - 移除 PracticeCard 中 dictation 模式下隐藏中文翻译的条件渲染，中文翻译在所有模式下始终可见（showResult 前也已可见）
  - renderDictationInputs 中添加首字母提示：取 blankWords[idx].word[0] + '...' 显示在输入框下方，字体小、颜色浅，不干扰主输入流程
  - 指令文本更新为「请听音频，根据中文提示和首字母提示填写单词」，准确描述新 UX
  - PracticeCard.choice.test.tsx 中 dictation 渲染辅助测试同步更新中文可见性断言
- **观察**: 零新增依赖，零新增组件，零构建体积增长。1 个组件文件 + 3 个测试文件的极小改动范围验证了当前架构的灵活性——UX 调整可以在现有组件内快速完成

### 2026-05-09 (cycle-2026-05-09-10)
- **迭代**: epic-002 iter-003a「响应式 UI 适配（移动端 + 桌面端）」—— **完整实现**
- **实现质量**: 高 — 零新增依赖，零构建体积增长，纯 Tailwind 工具类响应式适配
- **关键决策**:
  - MobileNav 使用 `md:hidden` 和桌面导航的 `hidden md:flex` 实现互斥渲染，无 JS 断点检测逻辑
  - 触摸目标统一使用 `h-11`（44px）在移动端，`md:h-10`（40px）在桌面端，符合 WCAG 2.1 最小触摸目标规范
  - 主内容区 `pb-20 md:pb-0` 确保移动端底部导航不遮挡内容，桌面端无额外 padding
  - safe-area-inset-bottom 支持 iPhone X+ 系列安全区
  - vitest.setup.ts 中 mock window.matchMedia 确保响应式测试在 jsdom 环境中可运行
- **观察**: 响应式改造作为「技术债务前置」的成功案例——在功能迭代前建立跨端基础，避免了后续迭代的返工。所有响应式类名遵循 Tailwind 标准断点，无自定义 CSS media query

### 2026-05-09 (cycle-2026-05-09-17)
- **迭代**: epic-003 iter-002「连击计数与正向反馈动画」—— **完整实现**
- **实现质量**: 高 — 状态扩展自然，组件职责清晰
- **关键决策**:
  - streak 状态为 session-only（不持久化），重启后重置是合理 UX，避免了 localStorage 写入频率和跨设备同步问题
  - getStreakMultiplier 使用离散分级而非连续函数，实现简洁且可解释，边界值在 2→3、4→5、9→10 处明确
  - addXP 返回 { profile, finalXP, multiplier, streak } 对象，调用方可获知实际奖励详情，便于触发弹窗
  - StreakFeedback 组件通过 streak 阈值条件渲染（≥2 才显示），避免空状态干扰
  - XPGainPopup 使用 triggerKey 强制 re-mount 实现动画重播，避免 AnimatePresence 的 exit-before-enter 延迟
  - requestAnimationFrame deferral 在 XP 奖励 useEffect 中触发弹窗，确保 DOM 更新后动画开始
- **观察**: 零新增依赖（framer-motion 复用已有），零构建体积增长。连击系统与 XP 系统的融合通过 useXP hook 统一暴露，App.tsx 的集成改动最小化。7 个现有测试文件的 mock 更新展示了 hook API 扩展时的向后兼容策略

### 2026-05-09 (cycle-2026-05-09-1)
- **迭代**: iter-001「核心存储服务与会话持久化」
- **实现质量**: 高 — 代码结构清晰，错误处理完善
- **关键决策**: 使用单例模式封装 localStorage；500ms debounce 保存；版本化 schema 预留迁移空间
- **观察**: 边界情况处理充分（corrupted JSON, quota exceeded, version mismatch）
