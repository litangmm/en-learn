# test 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

### 2026-05-10 (cycle-2026-05-10-26)
- **迭代**: epic-004 iter-001「移动端响应式适配（P0）」—— **全部测试通过**
- **测试覆盖**: 434/434 单元测试通过（45 个测试文件，新增 4 个测试）
  - App.responsive.test.tsx: 新增 4 个测试（Header flex-wrap 类名存在、标题响应式 text-base/md:text-lg 类名、ToggleGroup overflow-x-auto 容器、输入框 min-w/max-w 类名、音频按钮 h-8/md:h-10 类名）
  - 全量回归: 之前 429 个测试全部通过
- **E2E**: skipped（4 pending iterations remaining）
- **观察**: 434 测试是项目历史最新高水位。纯 CSS 类名调整零行为回归，新增 4 个响应式布局断言覆盖 375px~390px 窄屏下的关键布局点。E2E 因 epic-004 剩余 4 个迭代仍 pending 而继续跳过

### 2026-05-10 (cycle-2026-05-10-21)
- **迭代**: epic-003 iter-005「学习排行榜（本地）」—— **全部测试通过**
- **测试覆盖**: 429/429 单元测试通过（45 个测试文件，新增 25 个测试）
  - useLeaderboard.test.ts: 11 个测试（空历史回退、score/accuracy/speed 三分类、today/week/all 筛选、排名排序、同分并列）
  - Leaderboard.test.tsx: 7 个测试（分类 Tabs 渲染、时间 pills、top-3 奖牌样式、空状态、列表渲染、返回按钮）
  - App.leaderboard.test.tsx: 7 个测试（导航入口渲染、徽章计数、视图切换、Leaderboard 存在性、返回导航）
  - 全量回归: 之前 404 个测试全部通过
- **E2E**: 1 passed, 1 flaky（pre-existing，与当前迭代无关）
- **观察**: 429 测试是项目历史最新高水位，从 iter-001 的 72 测试增长到 429，累计增长 495%。排行榜的纯派生特性使其测试策略聚焦于数据转换逻辑（纯函数）和展示层渲染，无需 mock 存储层。11 个现有测试文件的批量 mock 更新展示了 hook API 扩展时的测试维护策略

### 2026-05-09 (cycle-2026-05-09-19)
- **迭代**: epic-003 iter-003「每日挑战任务面板」—— **全部测试通过**
- **测试覆盖**: 375/375 单元测试通过（39 个测试文件，新增 27 个测试）
  - useDailyChallenges.test.ts: 12 个测试（初始化生成/加载现有/日期滚动/trackActivity correct/answer/streak/完成封顶/claimReward XP 添加/claimed 标记/未领取计数）
  - DailyChallengePanel.test.tsx: 9 个测试（标题/日期/挑战卡片/进度条宽度/领取按钮/点击领取/已领取徽章/X-Y 文本/返回/空状态）
  - App.challenges.test.tsx: 6 个测试（Trophy 渲染/徽章计数/视图切换/trackActivity 正误/返回导航）
  - 全量回归: 之前 348 个测试全部通过
- **E2E**: skipped（2 pending iterations remaining）
- **观察**: 375 测试是项目历史最新高水位。存储层测试覆盖了确定性种子洗牌的边界——相同日期生成相同挑战、不同日期生成不同挑战。9 个现有测试文件的批量 mock 更新展示了 hook API 扩展时的测试维护策略

### 2026-05-09 (cycle-2026-05-09-16)
- **迭代**: epic-003 iter-001「XP 积分与等级系统」—— **全部测试通过**
- **测试覆盖**: 318/318 单元测试通过（32 个测试文件，新增 34 个测试）
  - xp-storage.test.ts: 21 个测试（profile 默认回退、有效/损坏恢复、addXP 增量、12 级阈值边界、进度百分比、最大等级封顶、export/import 含 xpProfile）
  - useXP.test.ts: 7 个测试（懒加载初始化、addXP 状态更新、firstTry +5 奖励、等级升级、resetXPProfile）
  - App.xp.test.tsx: 6 个测试（XPBar header 渲染、正确答题触发 addXP、firstTry 奖励、错误不触发、防重复奖励、focus mode XPBar）
  - 全量回归: 之前 282 个测试全部通过
- **E2E**: skipped（4 pending iterations remaining）
- **观察**: 318 测试是项目历史最新高水位。XP 系统的算法测试覆盖全部 12 级阈值边界和进度百分比精度，是算法型迭代的测试典范。9 个现有测试文件因 storage mock 更新，零行为回归

### 2026-05-09 (cycle-2026-05-09-13)
- **迭代**: epic-002 iter-004「专注模式（全屏无干扰 UI）」—— **全部测试通过**
- **测试覆盖**: 262/262 单元测试通过（26 个测试文件，新增 6 个测试）
  - App.focus.test.tsx: 6 个测试（入口按钮渲染、点击进入专注模式、退出按钮恢复、ESC 键退出、输入时 ESC 被忽略、PracticeCard 交互性）
  - 全量回归: 之前 256 个测试全部通过
- **E2E**: skipped（1 pending iteration remaining：iter-005）
- **观察**: 专注模式测试覆盖了「进入 → 状态验证 → 键盘交互 → 退出 → 恢复」的完整用户流程。使用 queryByText + not.toBeInTheDocument() 验证元素隐藏，使用 getByText 验证极简进度条可见。262 个测试是项目历史最新高水位

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

### 2026-05-09 (cycle-2026-05-09-11)
- **迭代**: epic-002 iter-003b「纯听写模式重新设计」—— **全部测试通过**
- **测试覆盖**: 256/256 单元测试通过（25 个测试文件，更新 3 个测试文件）
  - PracticeCard.dictation.test.tsx: 更新 3 个测试（中文可见性断言翻转、首字母提示 `c...` 渲染验证、指令文本断言更新）
  - App.mode.test.tsx: 更新 2 个测试（dictation 模式中文可见性断言翻转、测试名称更新）
  - PracticeCard.choice.test.tsx: 修复 1 个测试（dictation 渲染辅助中中文可见性断言）
  - 全量回归: 之前 255 个测试全部通过
- **E2E**: skipped（2 pending iterations remaining：iter-004, iter-005）
- **观察**: 本次迭代的测试更新模式展示了 UX 变更时的测试维护最佳实践——翻转现有断言以反映新行为，新增断言覆盖新功能，而非删除旧测试。所有更新保持了一致性，零回归

### 2026-05-09 (cycle-2026-05-09-10)
- **迭代**: epic-002 iter-003a「响应式 UI 适配（移动端 + 桌面端）」—— **全部测试通过**
- **测试覆盖**: 255/255 单元测试通过（25 个测试文件，新增 15 个测试）
  - MobileNav.test.tsx: 8 个测试（5 项渲染、激活态高亮、onNavigate 回调、徽章显示、md:hidden 类名）
  - App.responsive.test.tsx: 7 个测试（MobileNav 条件渲染、桌面导航隐藏、DictionarySelector 位置、底部 padding）
  - 全量回归: 之前 240 个测试全部通过
- **E2E**: skipped（3 pending iterations remaining）
- **观察**: 响应式测试的关键创新是使用 mock matchMedia 在 jsdom 中模拟断点，验证了组件的条件渲染逻辑。首次建立响应式测试基线，为后续迭代的移动端兼容性提供了回归保障

### 2026-05-09 (cycle-2026-05-09-17)
- **迭代**: epic-003 iter-002「连击计数与正向反馈动画」—— **全部测试通过**
- **测试覆盖**: 348/348 单元测试通过（36 个测试文件，新增 30 个测试）
  - useXP.streak.test.ts: 9 个测试（streak 递增、wrong 重置、max 跟踪、倍率边界、addXP 倍率集成、返回对象、resetStreak、firstTry+multiplier）
  - StreakFeedback.test.tsx: 8 个测试（<2 隐藏、icon/count、amber/red/purple 颜色、连击标签、visible=false、motion.div）
  - XPGainPopup.test.tsx: 6 个测试（hidden、amount 显示、倍率徽章条件、triggerKey）
  - App.streak.test.tsx: 6 个测试（header badge、recordCorrectAnswer、recordWrongAnswer、XP popup、resetStreak、focus mode badge）
  - 全量回归: 之前 318 个测试全部通过
- **E2E**: skipped（3 pending iterations remaining）
- **观察**: 动画组件测试策略：StreakFeedback 通过 data-testid 和颜色类名断言；XPGainPopup 通过 queryByText 和条件渲染断言。framer-motion 的 motion.div 通过 getByTestId 验证存在性。requestAnimationFrame 在 jsdom 中同步执行，弹窗触发测试无需额外等待。7 个现有 App 测试文件的 mock 更新展示了 hook API 扩展时的大规模测试维护模式

### 2026-05-09 (cycle-2026-05-09-1)
- **迭代**: iter-001「核心存储服务与会话持久化」
- **测试覆盖**: 72/72 单元测试通过
  - storage.test.ts: 15 个测试（save/load roundtrip, 版本迁移, corrupted data 恢复, quota exceeded）
  - usePractice.test.ts: 22 个测试（恢复 persisted state, 保存触发, dictionary 切换清理）
- **E2E**: skipped（非最后 pending iteration）
- **观察**: 测试策略有效，关键边界均有覆盖
