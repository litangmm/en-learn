# PM-UX 经验档案

## 角色定义
- **性格**：完美主义、感性
- **关注**：学习心流、抗疲劳、即时反馈
- **风格**："这个动画必须做到60fps"

## 历史提案

### 2026-05-27 (cycle-2026-05-27-195) — epic-079 iter-001 完成
- **相关 Epic**: epic-079「App.tsx 视图路由配置中心强制落地」—— 作为支持者
- **结果**: epic-079 iter-001 **完成并部署**，v0.82.0，2405 测试通过（历史最高水位）
- **完成内容**: ViewRouter 注册中心模式核心基础设施
- **当前状态**: **连续未被选中计数保持清零**（epic-079 支持者）
- **观察**: epic-079 iter-001 的声明式视图注册体系与 PM-UX 的「学习心流」理念一致。ViewConfig 的 i18nKey 允许视图标题的国际化，支持多语言学习场景。ViewRegistry 的声明式设计降低了新视图的侵入性——无需修改 App.tsx 条件分支，只需在 VIEW_CONFIGS 中注册新视图即可。这与 PM-UX 关注的「平滑过渡、无感升级」原则一致。**epic-079 完成度 1/3，iter-002（完成全部视图迁移）后，App.tsx 复杂度将大幅降低，用户体验更加稳定**

### 2026-05-12 (cycle-2026-05-12-142) — epic-037 iter-003 完成
- **相关 Epic**: epic-037 iter-003「长期里程碑卡片与成就路径」—— **提案者**
- **结果**: **epic-037 iter-003 完成**，1650/1651 测试通过（历史最高水位），v0.63.0
- **完成内容**: useMilestones Hook（里程碑状态管理/30→60→90→180→365 天/本地存储）+ LongTermMilestoneCard（里程碑卡片/庆祝动画）+ MilestonePath（成就路径可视化）+ ProgressHub 集成（顶部区域连击里程碑进度）+ 全面测试（useMilestones.test.ts 434行 / LongTermMilestoneCard.test.tsx 423行 / MilestonePath.test.tsx 473行 / App.milestone.test.tsx 554行）
- **当前状态**: **连续未被选中计数保持清零**（epic-037 提案者，3/4 迭代完成）
- **观察**: epic-037 里程碑路径（30→60→90→180→365 天）与连击系统（5/10/20/50）形成双重激励——用户既有短期连击反馈，也有长期里程碑目标。useMilestones Hook 独立于 useGoals，符合单一职责原则，里程碑存储使用相同的本地存储层保持一致性。2729 行代码（11 个文件）是 epic-037 中最大规模的迭代，测试覆盖率极高。**epic-037 仅剩 iter-004（动机流失预警），完成后 epic-037 将全部收官，版本范围 v0.60.0-v0.64.0**

### 2026-05-12 (cycle-2026-05-12-136) — epic-037 iter-001 完成
- **相关 Epic**: epic-037 iter-001「每日/每周学习目标设定 UI」—— **提案者**
- **结果**: **epic-037 iter-001 完成**，1495/1496 测试通过（历史最高水位），v0.61.0
- **完成内容**: Goal 类型定义（GoalType/GoalPeriod/Goal/GoalState）+ storage 层（GOALS_KEY + getGoals/saveGoals/generateDefaultGoals）+ useGoals Hook（惰性初始化/日期感知重置/CRUD）+ GoalSettingPanel（预设+自定义双模式）+ ViewRouter goals 视图 + App.tsx 集成（目标按钮入口）
- **当前状态**: **连续未被选中计数保持清零**（epic-037 提案者，1/4 迭代完成）
- **观察**: epic-037「学习动机可视化与目标设定系统」填补了产品「用户自设目标」这一核心 gap——游戏化体系（XP/连击/徽章/排行榜）解决了「系统给什么目标」，但从未解决「用户自己想要什么」。useGoals Hook 的惰性初始化和日期感知重置确保目标状态在正确时机重置，零新增依赖、零构建体积增长。**epic-037 剩余 iter-002（进度追踪）~ iter-004（流失预警）继续推进中**

### 2026-05-11 (cycle-2026-05-11-89) — epic-018 iter-002 完成
- **相关 Epic**: epic-018 iter-002「能力雷达图与进度趋势」—— 作为支持者
- **结果**: epic-018 iter-002 **完成并部署**，v0.40.0，876/876 测试通过
- **完成内容**: AbilityRadar SVG 五边形雷达图(4轴)+ProgressTrend 折线图(XP/题数切换)+useProgressStats 新增 getModeAccuracy/getDailyXP
- **当前状态**: **连续未被选中计数保持清零**（epic-018 支持者）
- **观察**: AbilityRadar 的四轴雷达图让用户直观感知自己在填空/选择/排序/听写四种模式的能力差异，这与 PM-UX「学习心流」理念的「清晰目标 + 即时进度」原则一致——用户可看到自己的能力分布，明确哪些模式需要加强。ProgressTrend 的 7 天趋势让用户看到「我的学习是否在进步」，提供持续的正向反馈。**epic-018 剩余 iter-003（成就系统/学习档案）继续支持**

### 2026-05-11 (cycle-2026-05-11-83)
- **相关 Epic**: epic-014 iter-001「主练习链路稳定性打磨」—— **提案者**
- **结果**: **epic-014 iter-001 完成**，819/819 测试通过，v0.37.0
- **完成内容**: dir-1778465917386 指令的 8 个状态同步 bug 修复：Bug 1 nextQuestion 换题不刷新（AnimatePresence mode="wait" 移除）、Bug 2 retry 重试残留反馈（isRetrying 语义修复 + previousAttemptsRef）、Bug 3 MoreMenu 移动端不可用（fixed positioning）、Bug 4 DictionaryBrowser 移动端溢出（grid-cols 自适应）、Bug 5 听写模式提示文案不准确（明确说明首字母听写）、Bug 6 选择题题干与选项相似（相似题过滤）、Bug 7 连词成句释义句半禁用（跳过按钮）、Bug 8 解析重复中文释义（重写 getExplanation）、NavigationContext._currentValue 改标准 useContext
- **当前状态**: **连续未被选中计数保持清零**（epic-014 提案者，持续推进）
- **观察**: epic-014 iter-001 是 dir-1778465917386 用户完整评测反馈的直接响应。8 个状态同步 bug 直接影响用户核心练习体验（"点击下一题但题卡停在上一题"会让用户怀疑页面坏了），P0 优先级正确。getExplanation 重写体现了 PM-UX 的「解释为什么」而非「重复是什么」的设计原则。**epic-014 剩余 5 个迭代（iter-002~006），继续推进中**

### 2026-05-11 (cycle-2026-05-11-64)
- **相关 Epic**: epic-009 iter-001「词典浏览器（只读）」—— 作为支持者
- **结果**: epic-009 iter-001 完成，708/708 测试通过，v0.31.0
- **当前状态**: **连续未被选中计数保持清零**（epic-004 收官后继续支持 epic-009）
- **观察**: iter-001 的 DictionaryBrowser 组件需关注移动端词典浏览体验——「我的词库」入口在移动端应方便访问，词典卡片布局需自适应（单列/两列）。iter-002 搜索与筛选需保持响应式设计，避免搜索框在小屏幕上溢出。**epic-009 剩余 iter-002（搜索筛选）、iter-003（生词标记），继续推进中**
- **相关 Epic**: epic-005 iter-003「分享触发点与频次控制」—— 作为支持者
- **结果**: epic-005 iter-003 完成，649/649 测试通过，v0.29.0
- **当前状态**: **连续未被选中计数保持清零**（epic-004 收官后继续支持 epic-005）
- **观察**: PM-UX 的心流保护建议在 iter-003 中得到验证：SharePromptToast 非阻塞式设计（1.5s 自动消失）确保不会打断用户答题节奏。「完成后分享」而非「学习中弹窗」的共识已完整实施。iter-004 数据追踪不涉及 UI 体验变更，可直接推进。**epic-005 仅剩 iter-004，PM-UX 的下一次 Epic 候选为 epic-007 或全新 brainstorm**

### 2026-05-10 (cycle-2026-05-10-49)
- **相关 Epic**: epic-004「体验优化与响应式适配」—— 作为主导者
- **结果**: **epic-004 全部 10 个迭代收官**（iter-001~006.5），531/531 测试通过，v0.26.0
- **完成内容**: epic-004 iter-006 的 5 个子项全部完成：iter-006.1 桌面端顶部导航折叠（MoreMenu，7 项进「更多」菜单）、iter-006.2 移动端弹窗自适应（DialogContent/ResultModal 单列/两列自适应）、iter-006.3 成就toast短暂化（3s→1.5s）、iter-006.4 排行榜数据范围标注（本地/今日/本周/全部 Tab）、iter-006.5 听写模式独立体验确认
- **新增测试**: MoreMenu 组件测试（25 个新增测试）
- **当前状态**: **连续未被选中计数保持清零**（epic-004 收官，epic-004 iter-006 执行中）
- **观察**: epic-004 历时多个迭代，完成了从「基础响应式」（iter-001）到「深度用户体验优化」（iter-006）的完整演进。iter-006 是用户完整评测第二轮反馈的直接响应，5 个子项全部完成。PM-UX 作为 epic-004 的全程主导者，从 iter-001（移动端基础）到 iter-006（深度响应式重构）全程主导。epic-004 是项目最长的 Epic（10 个迭代），覆盖了响应式、反馈文案、模式语义、智能复习可视化、首次/恢复弹窗、桌面顶部折叠等全部体验维度。**epic-004 收官后，PM-UX 的下一次 Epic 候选为 epic-005（社交裂变）或 epic-007（个人词典管理）**

### 2026-05-10 (cycle-2026-05-10-47)
- **相关 Epic**: epic-004 iter-006「响应式布局深度重构」—— 作为主导者
- **结果**: epic-004 iter-006.1「桌面端顶部导航折叠重构」完成，531/531 测试通过，v0.26.0
- **完成内容**: MoreMenu 组件创建（7 个次级导航项折叠进「更多」菜单）；品牌区 min-width 保护（min-w-0/flex-shrink-0）；桌面端（md+）显示更多菜单，移动端隐藏；核心练习控制区保持可见
- **新增测试**: MoreMenu 组件测试（25 个新增测试）
- **当前状态**: **连续未被选中计数保持清零**（epic-004 iter-006 执行中）
- **观察**: iter-006.1 完成了用户完整评测第二轮反馈中的「桌面端顶部品牌区不被压缩，导航超宽折叠进更多菜单」。5 个子项中的第 1 项完成，剩余移动端弹窗自适应（P0）、成就toast短暂化（P1）、排行榜范围标注（P1）、听写模式独立体验（P1）将继续执行。**PM-UX 需持续关注移动端弹窗布局（iter-006.2）的体验细节**

### 2026-05-10 (cycle-2026-05-10-20)
- **相关 Epic**: epic-003「游戏化学习动力系统」—— 作为支持者
- **结果**: epic-003 iter-004「成就徽章系统」完成，404/404 测试通过，v0.16.0
- **当前状态**: **连续未被选中计数保持清零**（以支持者身份参与 epic-003）
- **观察**: 徽章系统的「进度可视化」设计（锁定徽章底部进度条）符合 PM-UX 的「清晰目标 + 即时进度」原则。用户随时可以看到距离下一枚徽章还差多少，这种「差一点就能解锁」的心理是强留存驱动力。琥珀金色的解锁状态与灰色锁定状态形成强烈视觉对比，强化了「解锁瞬间」的成就感。iter-005 的排行榜将引入「社会比较」机制，PM-UX 需关注对比心理是否会产生挫败感（尤其是对于低活跃度用户）

### 2026-05-09 (cycle-2026-05-09-19)
- **相关 Epic**: epic-003「游戏化学习动力系统」—— 作为支持者
- **结果**: epic-003 iter-003「每日挑战任务面板」完成，375/375 测试通过，v0.15.0
- **完成内容**: 每日挑战面板设计（清晰目标 + 即时进度条）、挑战类型与现有学习行为自然对齐（correct/answer/streak）、领取奖励 XP 弹窗复用 iter-002 动画体系、响应式内边距适配移动端
- **新增测试**: useDailyChallenges.test.ts (12 个) + DailyChallengePanel.test.tsx (9 个) + App.challenges.test.tsx (6 个)，全量 **375/375 通过**
- **当前状态**: **连续未被选中计数保持清零**（以支持者身份参与 epic-003）
- **观察**: 每日挑战面板完全符合「学习心流」理论中的「清晰目标 + 即时进度」原则。每个挑战都有明确的目标数字和实时进度条，用户无需学习新的交互模式即可被动完成挑战。挑战类型（correct/answer/streak）与现有学习行为自然对齐，是「渐进式目标设定」理念的直接落地

### 2026-05-09 (cycle-2026-05-09-16)
- **相关 Epic**: epic-003「游戏化学习动力系统」—— 作为支持者
- **结果**: epic-003 iter-001「XP 积分与等级系统」完成，318/318 测试通过，v0.13.0
- **当前状态**: 连续未被选中计数保持清零（以支持者身份参与 epic-003）
- **观察**: 作为 epic-002 的全程主导者，epic-002 全部 7 个迭代收官后交出主导权，转而支持 epic-003。XP 积分系统的「即时反馈」机制与 PM-UX 的「学习心流」理念直接相关——每答对一题获得 XP 奖励，level-up 时的进度条变化提供持续的正向反馈。iter-001 的 awardedXPRef 防重复奖励设计体现了 PM-UX 对「公平性」的关注。后续 iter-002（连击计数）将进一步扩展反馈频率

### 2026-05-09 (cycle-2026-05-09-14)
- **相关 Epic**: epic-002「沉浸式多模态练习模式」—— 作为提议者
- **结果**: epic-002 iter-005「连词成句模式（拖拽/点击排序）」完成，**epic-002 全部 7 个迭代收官**
- **完成内容**: PracticeMode 扩展 `'sentence-reorder'`，新增 SentenceToken 接口；usePractice hook 新增 sentenceTokens 生成（`\S+` 分词）、orderedTokenIds 状态、selectToken/deselectToken/resetTokens 操作；checkAnswer 支持 `string[]` 参数（重组句子后 lowercase.trim 比对）；PracticeCard 实现 answer zone（已选词，点击移除）+ word pool（剩余词，点击加入），submit 全选前禁用，showResult 展示正确句子；App.tsx ToggleGroup 新增「连词成句」、auto-play 500ms、模式切换 resetTokens
- **新增测试**: usePractice.reorder.test.ts (8 个) + PracticeCard.reorder.test.tsx (6 个) + App.reorder.test.tsx (5 个)，全量 **282/282 通过**（29 测试文件，历史新高位）
- **当前状态**: 连续未被选中计数保持清零
- **观察**: epic-002 历时 7 个迭代（iter-001~005 + iter-003a/003b）全部完成，是项目迄今最大的 Epic。全部迭代零新增依赖、零构建体积增长、零回归。PM-UX「学习心流」理念贯穿全程——从纯听写（减少提示干扰）到音频速度（自主节奏控制）到选择题（快速反馈）到专注模式（消除环境干扰）到连词成句（句法建构训练），覆盖了从碎片时间到深度专注的完整学习场景光谱

### 2026-05-09 (cycle-2026-05-09-13)
- **相关 Epic**: epic-002「沉浸式多模态练习模式」—— 作为提议者
- **结果**: epic-002 iter-004「专注模式（全屏无干扰 UI）」完成
- **完成内容**: App.tsx 新增 isFocusMode 状态和 toggleFocusMode，专注模式入口按钮（Eye 图标）位于练习模式 ToggleGroup 旁；进入专注模式后隐藏 Header、ToggleGroup、底部 hint、MobileNav，显示极简悬浮进度条（第 X/Y 题 + 分数 + 退出按钮）；ESC 键全局监听退出专注模式（isFocusModeRef 防 stale closure）；PracticeCard 专注模式下简化 header（隐藏题号/尝试次数徽章）、增大内边距和字号、更干净的卡片阴影/边框
- **新增测试**: App.focus.test.tsx (6 个)，全量 262/262 通过
- **当前状态**: 连续未被选中计数保持清零
- **观察**: iter-004 的专注模式是 PM-UX「学习心流」理念的终极体现——消除一切干扰，让用户完全沉浸在练习中。极简悬浮进度条仅保留最必要信息（进度+分数），符合心流理论中的「清晰目标 + 即时反馈」原则。esc 退出模式复用了 bugfix-001 的键盘快捷键实现经验。epic-002 仅剩 iter-005（连词成句），完成后 PM-UX 将交出 epic-002 主导权

### 2026-05-09 (cycle-2026-05-09-11)
- **相关 Epic**: epic-002「沉浸式多模态练习模式」—— 作为提议者
- **结果**: epic-002 iter-003b「纯听写模式重新设计」完成
- **完成内容**: PracticeCard dictation 模式下中文翻译不再隐藏（移除 isDictation 条件），给用户明确上下文；renderDictationInputs 中添加首字母提示（如 `c...`），给用户提供锚点但不暴露完整答案；指令文本更新为「请听音频，根据中文提示和首字母提示填写单词」；英文句子文本继续隐藏，showResult 后揭示全部内容
- **测试更新**: 更新 PracticeCard.dictation.test.tsx（中文可见性断言翻转、首字母提示测试、指令文本断言）+ App.mode.test.tsx（中文可见性断言翻转），全量 256/256 通过
- **当前状态**: 连续未被选中计数保持清零
- **观察**: iter-003b 是用户反馈直接驱动的体验优化——用户反馈「完全隐藏句子后不知所云」，PM-UX 的设计直觉（保留中文提示 + 首字母锚点）在最小改动下解决了核心痛点。零新增依赖、零新增组件，3 个文件修改即完成。战略指令 dir-urgent-002 的两个紧急迭代全部收官

### 2026-05-09 (cycle-2026-05-09-10)
- **相关 Epic**: epic-002「沉浸式多模态练习模式」—— 作为提议者
- **结果**: epic-002 iter-003a「响应式 UI 适配（移动端 + 桌面端）」完成
- **完成内容**: 创建响应式设计文档（断点、触摸目标、间距令牌）；MobileNav 组件（固定底部导航、5 项图标+标签+徽章、safe-area-inset-bottom）；App.tsx 响应式重构（桌面顶部导航 / 移动端底部导航 + 简化头部 + 主内容区 pb-20 底部 clearance）；PracticeCard 触摸优化（h-11 44px 触摸目标、响应式字号/内边距/行高）；MistakeBook/HistoryView/SmartReview/DataManager/ResultModal 响应式容器内边距；vitest.setup.ts matchMedia mock
- **新增测试**: MobileNav.test.tsx (8 个) + App.responsive.test.tsx (7 个)，全量 255/255 通过
- **当前状态**: 连续未被选中计数保持清零
- **观察**: iter-003a 是战略指令 dir-urgent-002 插入的紧急迭代，验证了「不做响应式基础则后续全部返工」的判断。MobileNav 的底部导航设计符合移动端单手操作习惯，5 个导航项覆盖全部功能视图。响应式改造零回归，255 个测试全部通过

### 2026-05-09 (cycle-2026-05-09-9)
- **相关 Epic**: epic-002「沉浸式多模态练习模式」—— 作为提议者
- **结果**: epic-002 iter-003「选择题模式（四选一快速练习）」完成
- **完成内容**: PracticeMode 类型扩展为 `'fill-in-blanks' | 'dictation' | 'multiple-choice'`；usePractice hook 新增 selectedChoiceId 状态、options 生成（当前句 + 3 个随机干扰项，共 4 选项）、selectChoice 回调、checkAnswer 支持传入选项 ID 判定正误（答对得 10 分，无尝试惩罚）；PracticeCard 新增选择题 UI：中文翻译 + 音频按钮 + 4 个选项卡片（蓝/绿/红高亮）、提交按钮（选中前禁用）、showResult 后无重试仅下一题；App.tsx ToggleGroup 扩展为三模式切换，auto-play 延迟 500ms
- **新增测试**: usePractice.choice.test.ts (6 个) + PracticeCard.choice.test.tsx (10 个) + App.choice.test.tsx (5 个)，全量 240/240 通过
- **当前状态**: 连续未被选中计数保持清零
- **观察**: iter-003 的选择题模式是 PM-UX「快速反馈循环」理念的直接体现——四选一、即时正误判断、无尝试惩罚、适合碎片时间快速刷题。三种练习模式（填空/听写/选择）覆盖了从深度练习到快速刷题的完整场景光谱。但用户反馈纯听写模式体验差（完全隐藏句子，用户不知所云），需在后续迭代中重新设计

### 2026-05-09 (cycle-2026-05-09-8)
- **相关 Epic**: epic-002「沉浸式多模态练习模式」—— 作为提议者
- **结果**: epic-002 iter-002「音频播放速度控制」完成
- **完成内容**: useSpeech hook 扩展 playbackRate 状态（默认 1.0）和 setPlaybackRate 方法；PracticeCard Header 添加五档 ToggleGroup 速度选择器（0.5x~1.5x）；App.tsx 移除硬编码 0.85 速率，统一使用用户选择速度；新增 14 个单元测试，全量 219/219 通过
- **当前状态**: 连续未被选中计数保持清零
- **观察**: iter-002 的音频速度控制是 PM-UX 对学习场景适配的直观设计——初学者可用 0.5x~0.75x 慢速精听，进阶用户可用 1.25x~1.5x 加速挑战。五档选择而非连续滑块，降低了决策成本，符合碎片时间快速练习场景。iter-003 的选择题模式将进一步扩展「快速练习」场景

### 2026-05-09 (cycle-2026-05-09-7)
- **提案 Epic**: epic-002「沉浸式多模态练习模式」
- **结果**: **被选中** — epic-001 完成后首次全新 brainstorm 中选
- **当前状态**: 连续未被选中计数清零（连续 5 次后首次被选中）
- **完成迭代**: iter-001「纯听写模式」— PracticeMode 类型、PracticeCard dictation UI、App ToggleGroup 模式切换、205/205 测试通过
- **观察**: PM-UX 连续 5 次未被选中的反思建议（拆分数据无关/数据依赖子功能）在 epic-002 的 iter-001 中得到验证——纯听写模式确实与数据层完全无关，可独立实施。iter-001 的 UI 简化思路（隐藏中文、仅音频 + 输入框）体现了 PM-UX 对学习心流的设计直觉

### 2026-05-09 (cycle-2026-05-09-6)
- **提案 Epic**: epic-002「沉浸式多模态练习模式」
- **结果**: 未被选中（epic-001 收尾中，iter-005 完成）
- **当前状态**: 连续 5 个 cycle 未被选中
- **观察**: epic-001 已完整完成。epic-002 作为缓解单一练习模式疲劳的方案，在下次 Epic 选择周期将成为最强候选。iter-005 的复习模式本身也是一种新的练习子模式，验证了多模式状态切换的技术可行性。

### 2026-05-09 (cycle-2026-05-09-5)
- **提案 Epic**: epic-002「沉浸式多模态练习模式」
- **结果**: 未被选中（epic-001 仍在执行中）
- **当前状态**: 连续 4 个 cycle 未被选中
- **观察**: epic-001 进入最后一个迭代 iter-005。epic-002 作为缓解单一练习模式疲劳的方案，在下个 Epic 选择周期将成为最强候选。数据基础已完全就绪，iter-005 的复习模式本身也是一种新的练习子模式

### 2026-05-09 (cycle-2026-05-09-3)
- **提案 Epic**: epic-002「沉浸式多模态练习模式」
- **结果**: 未被选中（epic-001 仍在执行中）
- **当前状态**: 连续 3 个 cycle 未被选中
- **观察**: epic-001 已完成 4/5 迭代，仅剩 iter-005「智能复习队列」。epic-002 作为缓解单一练习模式疲劳的方案，在下个 Epic 选择周期将成为最强候选。数据基础已完全就绪，可支撑多种练习模式的数据追踪

### 2026-05-09 (cycle-2026-05-09-2)
- **提案 Epic**: epic-002「沉浸式多模态练习模式」
- **结果**: 未被选中（epic-001 仍在执行中）
- **当前状态**: 连续 2 个 cycle 未被选中（cycle-2026-05-09-1, cycle-2026-05-09-2）
- **观察**: epic-001 数据系统已接近完成（3/5 迭代），预计下个 Epic 选择周期 epic-002 将成为强候选

### 2026-05-09 (cycle-2026-05-09-1)
- **提案 Epic**: epic-002「沉浸式多模态练习模式」
- **结果**: 未被选中
- **优先级**: high（第二顺位）
- **支持方**: PM-Lean, EXP, UX
- **反对/担忧**: PM-Mon 担心代码体积；QA 指出每种模式需独立测试；ARCH 提醒状态管理复杂度
- **备注**: 作为 epic-001 完成后的优先候选

### 2026-05-10 (cycle-2026-05-10-21)
- **相关 Epic**: epic-003「游戏化学习动力系统」—— 作为支持者
- **结果**: epic-003 iter-005「学习排行榜（本地）」完成，429/429 测试通过，v0.17.0
- **当前状态**: **连续未被选中计数清零**（epic-003 全部 5 个迭代已完成）
- **观察**: 排行榜的社会比较机制是 PM-UX「学习心流」理论的延伸——清晰的目标（上榜）+ 即时的进度反馈（排名变化）+ 成就感（Top-3 奖牌）。但 PM-UX 需关注社会比较的「挫败感风险」：对于低活跃度用户，空状态或极低排名可能产生负面心理。当前实现的空状态友好提示（「暂无记录」）和本地-only 设计（仅与自己历史比较）在一定程度上缓解了这一问题。framer-motion layoutId 动画指示器提供了流畅的 Tab 切换体验，与之前的动画体系保持一致

### 2026-05-10 (cycle-2026-05-10-27)
- **相关 Epic**: epic-004「体验优化与响应式适配」—— 作为提议者
- **结果**: epic-004 iter-002「答题反馈与提示文案重构（P1）」完成，451/451 测试通过，v0.19.0
- **完成内容**: App.tsx getModeHint 辅助函数（4 种模式模式提示文案，专注模式隐藏）；PracticeCard renderWrongAnswerFeedback 三区块反馈（红色「你的答案」/ 绿色「正确答案」/ 蓝色「解析」）；去除填空/听写输入框下方内联正确答案；选择题 CheckCircle2/Circle 图标增强（选中 bg-blue-100）；连词成句「已选 X/Y 个单词」进度文字；新增 App.hints.test.tsx（5）+ PracticeCard.feedback.test.tsx（7）
- **当前状态**: **连续未被选中计数清零**（epic-004 iter-002 完成，2/5 迭代完成）
- **观察**: iter-002 完美体现 PM-UX「学习心流」理念——错误后的三区块结构化反馈提供了清晰的认知闭环：「你的答案」（承认错误）→「正确答案」（获得真相）→「解析」（理解原因）。CheckCircle2/Circle 图标强化了选中状态的可辨识性，「已选 X/Y」进度文字降低了连词成句模式的认知负担。getModeHint 集中式配置改善了代码可维护性。epic-004 剩余 3 个迭代将继续按 P2~P3 优先级推进体验优化

### 2026-05-10 (cycle-2026-05-10-28)
- **相关 Epic**: epic-004「体验优化与响应式适配」—— 作为提议者
- **结果**: epic-004 iter-003「模式语义与题目数据统一（P2）」完成，459/459 测试通过，v0.20.0
- **完成内容**: isDefinitionSentence(sentence) 辅助函数（引号检测识别释义句）；ChoiceOption 接口规范化选项类型；usePractice options 生成释义句使用 chinese 作为文本；PracticeCard displayText 逻辑（释义题显示中文，normal 题显示英文）；连词成句模式释义句警告
- **当前状态**: **连续未被选中计数清零**（epic-004 iter-003 完成，3/5 迭代完成）
- **观察**: iter-003 完美体现 PM-UX「学习心流」理念——释义型题目的识别和差异化处理解决了选择题模式下的模式语义不统一问题。选择题使用中文作为选项文本，用户看到的是熟悉的中文释义而非陌生英文句子，认知负荷大幅降低。连词成句模式对释义句显示警告而非错误，提供了安全的边界处理。epic-004 仅剩 2 个迭代（iter-004 智能复习规则可视化、iter-005 首次/恢复弹窗体验打磨），将继续按 P3 优先级推进体验优化

## 成功模式
（由进化引擎自动总结）

## 失败教训
（由进化引擎自动总结）

## 反思记录

### 2026-05-09 (cycle-2026-05-09-5) — 连续 4 次未被选中
- **反思**: epic-002 的多模态练习模式是当前产品最直接的体验升级方向。等待 epic-001 完成虽然合理，但「纯听写模式」（无中文提示）和「音频速度控制」等功能与数据层关联度低，可以更早启动。PM-UX 应在下次 brainstorm 中论证这些子功能的独立性
- **建议**: 将 epic-002 拆分为「数据无关子功能」（纯听写、速度控制）和「数据依赖子功能」（基于错题历史的选择题出题），优先推进前者
- **状态**: epic-001 完成后，epic-002 应为最高优先级候选

### 2026-05-09 (cycle-2026-05-09-17)
- **相关 Epic**: epic-003「游戏化学习动力系统」—— 作为支持者
- **结果**: epic-003 iter-002「连击计数与正向反馈动画」完成，348/348 测试通过，v0.14.0
- **当前状态**: 连续未被选中计数保持清零
- **观察**: 连击系统的「即时反馈」机制与 PM-UX 的「学习心流」理念直接相关——每答对一题立即显示连击徽章和 XP 弹窗，反馈延迟接近零。分级颜色设计（amber→red→purple）符合心流理论中的「清晰进度感知」原则。framer-motion spring 动画提供了流畅的视觉反馈，避免了生硬的状态切换

### 2026-05-12 (cycle-2026-05-12-120) — epic-029 iter-004 完成
- **相关 Epic**: epic-029 iter-004「成就徽章墙导出」—— 作为支持者
- **结果**: epic-029 iter-004 **完成并测试通过**，1346/1347 测试通过（历史最高水位）
- **完成内容**: BadgeExportPanel 组件（网格预览+下载PNG）+ useBadgeExport Hook（html2canvas 图片导出）+ BadgePanel 导出按钮集成；html2canvas 复用已有依赖
- **当前状态**: **连续未被选中计数保持清零**（epic-029 支持者）
- **观察**: iter-004 的徽章墙导出是 PM-UX「学习心流」理念的「成果可视化」维度的延伸——用户可在 Trophy 入口预览并导出个人徽章墙，网格预览让用户「所见即所得」后再决定导出，符合 PM-UX 对用户体验的细节关注。徽章墙作为静态展示，不会打断用户学习主流程。**epic-029 仅剩 iter-005（数据可视化）继续支持，epic-029 即将全部收官**

### 2026-05-12 (cycle-2026-05-12-113) — epic-029 iter-001 完成
- **相关 Epic**: epic-029 iter-001「成就时刻动态卡片」—— 作为支持者
- **结果**: epic-029 iter-001 **完成并部署**，v0.50.0，1207/1207 测试通过
- **完成内容**: AchievementMomentCard 组件（5 种卡片模板）+ useAchievementMoment Hook（检测逻辑）+ App.tsx 全链路集成；零新增依赖、零构建体积增长
- **当前状态**: **连续未被选中计数保持清零**（epic-029 支持者）
- **观察**: iter-001 的成就时刻动态卡片是 PM-UX「学习心流」理念的「即时成就感」维度的关键落地——5 种时刻模板（升级/徽章解锁/连击新高/XP里程碑/满分）让系统在用户学习的每个关键节点自动触发视觉化正向反馈，无需用户主动操作，保护学习心流。卡片短暂展示（可设置自动消失时间）确保不打断答题节奏。**epic-029 剩余 iter-002~005 继续支持**

### 2026-05-13 (cycle-2026-05-13-183) — epic-058 iter-001 完成 (1952 tests, 历史最高水位)
- **相关 Epic**: epic-058 iter-001「流失信号识别系统」—— 作为支持者
- **结果**: epic-058 iter-001 **完成并部署**，v0.74.0，1952/1957 测试通过（5 skipped，历史最高水位）
- **完成内容**: ChurnSignal types + useChurnSignals hook (5 signal types) + ChurnAlertBanner component (dismissible/severity styling) + App.tsx integration (high/critical 显示)
- **当前状态**: **连续未被选中计数保持清零**（epic-058 支持者）
- **观察**: ChurnAlertBanner 的 dismissible 设计（localStorage 持久化）和 severity 分级（low/medium/high/critical）符合 PM-UX「不打断学习心流」理念——流失预警只在高风险时显示，且用户可主动关闭。Banner 作为内联组件而非弹窗，不阻塞用户操作。**epic-058 还有 3 个迭代（iter-002~004），继续支持**

## 改进方向
（由进化引擎自动总结）

### 2026-05-12 (cycle-2026-05-12-129) — epic-030 全部 4 个迭代完成
- **相关 Epic**: epic-030「学习心流深度优化与抗疲劳设计」—— **提案者 + 全程完成**
- **结果**: **epic-030 全部 4 个迭代完成并部署**，v0.54.0-v0.57.0，1427/1427 测试通过（历史最高水位）
- **完成内容**:
  - iter-001：8 个主练习链路 bug 修复（dir-1778465917386）+ useFlowState Hook
  - iter-002：FlowStateBanner + 疲劳自适应调整 + Pomodoro 计时器
  - iter-003：useTimeOfDayAnalysis + TimeSlotQualityCard + PeakHoursBadge + LearningTimeInsights
  - iter-004：RestReminderModal + BreathingExercise + StretchReminder + useFatigueRecovery Hook
- **当前状态**: **连续未被选中计数保持清零**（epic-030 收官）
- **观察**: epic-030 从提案到完成历经 4 个迭代，完整构建了「学习心流深度优化与抗疲劳设计」体系：疲劳检测（useFlowState）→ 自适应调整（FlowStateBanner + Pomodoro）→ 时段分析（TimeSlotQualityCard + PeakHoursBadge）→ 疲劳恢复（RestReminderModal + BreathingExercise）。dir-1778465917386 的 8 个 bug 修复和 dir-1778414197688 的响应式重构均已完成，1427 测试是项目历史最高水位。**epic-030 收官后，下一 Epic 候选：epic-030b「学习动机可视化与目标设定系统」或 epic-030c「深度个性化学习路径引擎」（均为 high 优先级）**

### 2026-05-13 (cycle-2026-05-13-186) — epic-058 iter-002 完成 (1996 tests, 历史最高水位)
- **相关 Epic**: epic-058 iter-002「分级召回干预机制」—— 作为支持者
- **结果**: epic-058 iter-002 **完成并测试通过**，1996/2001 测试通过（5 skipped，历史最高水位）
- **完成内容**: InterventionPanel component (modal/severity styling/snooze/action buttons) + useChurnIntervention hook (snooze/localStorage) + App.tsx integration
- **当前状态**: **连续未被选中计数保持清零**（epic-058 支持者）
- **观察**: InterventionPanel 的 dismissible 设计和 severity 分级（low/medium/high/critical）符合 PM-UX「不打断学习心流」理念——流失预警只在风险达到 medium 及以上时才显示干预面板，且用户可 snooze（24h/48h/1w）避免重复打扰。modal 形式仅在 critical 风险时触发，确保不频繁阻塞用户操作。**epic-058 还有 2 个迭代（iter-003~004），继续支持**

### 2026-05-26 (cycle-2026-05-26-189) — epic-069 iter-001 完成 (2197 tests, 历史最高水位)
- **相关 Epic**: epic-069 iter-001「综合学习洞察面板」—— 作为支持者
- **结果**: epic-069 iter-001 **完成并部署**，v0.79.0，2197/2202 测试通过（5 skipped，历史最高水位）
- **完成内容**: LearnInsightDashboard 综合面板（HealthGauge + AbilityRadar + ProgressTrend）+ types.ts 扩展 + useLearnInsights.ts 扩展 + App.tsx 集成
- **当前状态**: **连续未被选中计数保持清零**（epic-069 支持者）
- **观察**: LearnInsightDashboard 的「一目了然」综合面板设计是 PM-UX「学习心流」理念的「成果可视化」维度的关键延伸——用户无需切换多个视图即可看到全局学习状态，消除分散查看时的认知断层。HealthGauge（综合评分）+ AbilityRadar（能力分布）+ ProgressTrend（进步趋势）的三模块布局提供了清晰的视觉层次。**epic-069 还有 3 个迭代（iter-002~004 能力雷达与趋势联动/薄弱模式诊断/健康报告生成），继续支持，关注数据面板的心流友好设计**

### 2026-05-26 (cycle-2026-05-26-191) — epic-078 支持者
- **相关 Epic**: epic-078「App.tsx 视图路由配置中心重构」—— 作为支持者
- **结果**: epic-078 **当选**，4 支持（ARCH 提案，PM-UX/QA/PM-Mon 支持）
- **观察**: epic-078 的「声明式路由」模式是 PM-UX「学习心流」理念的架构支撑——当新视图（如 learn-insight-dashboard）可以通过声明式注册而非修改 App.tsx 条件渲染来添加时，新增功能对现有用户学习体验的侵入性降到最低。iter-001 复用 ViewRouter.tsx（epic-077 成果），无需改变现有视图的行为。**epic-078 还有 4 个迭代（iter-001~004），继续支持，关注声明式路由对新增视图的侵入性降低**

### 2026-05-26 (cycle-2026-05-26-193) — epic-069 iter-003 支持完成 + epic-079 支持
- **相关 Epic**: epic-069 iter-003「薄弱模式诊断与个性化建议」—— 作为支持者
- **结果**: epic-069 iter-003 **完成并测试通过**，v0.81.0，2340/2345 测试通过（5 skipped，历史最高水位）
- **epic-079 支持**: epic-079「App.tsx 视图路由配置中心强制落地」当选，PM-UX 作为支持者（4 支持：ARCH/PM-UX/EXP/PM-Growth）
- **当前状态**: **epic-069 完成度 3/4，iter-004 pending；epic-079 支持者**
- **观察**: epic-069 iter-003 的薄弱模式诊断为用户提供了「为什么我在这里薄弱」的解释和个性化建议，符合 PM-UX「清晰目标 + 即时进度」原则——用户不仅看到薄弱点，还知道如何改进。**epic-069 还有 1 个迭代（iter-004），epic-079 已当选，PM-UX 继续支持声明式路由对学习体验的保护**

### 2026-05-27 (cycle-2026-05-27-195) — epic-079 iter-001 完成 (2405 tests, 历史最高水位)
- **相关 Epic**: epic-079 iter-001「迁移首批视图注册至 ViewRouter」—— 作为支持者
- **结果**: epic-079 iter-001 **完成并测试通过**，v0.82.0，2405/2410 测试通过（5 skipped，历史最高水位）
- **完成内容**: VIEW_CONFIGS 常量（19 views）+ ViewRegistryProvider + useViewRegistry hook + NavigationProviderWithRegistry + ViewRouter 扩展 + viewConfigs.ts 单例源 + 全面测试
- **当前状态**: **连续未被选中计数保持清零**（epic-079 支持者）
- **观察**: epic-079 iter-001 的声明式路由注册模式完全符合 PM-UX 的「学习心流」理念——新视图注册无需修改 App.tsx 条件渲染，对现有用户学习体验的侵入性降到最低。VIEW_CONFIGS 的 i18nKey 和 a11yRole 字段为未来国际化（epic-086）提供了数据结构基础。**epic-079 完成度 1/3，剩余 iter-002（全部视图迁移）+ iter-003（Schema 标准化），继续支持，关注声明式路由对学习体验的保护**


### 2026-05-27 (cycle-2026-05-27-198) — epic-079 全部 3 个迭代完成 (2423 tests, 历史最高水位)
- **相关 Epic**: epic-079「App.tsx 视图路由配置中心强制落地」—— 作为支持者
- **结果**: **epic-079 全部 3 个迭代完成并部署**，v0.84.0，2423/2428 测试通过（5 skipped，历史最高水位）
- **完成内容**:
  - iter-001：VIEW_CONFIGS（19 views）+ ViewRegistryProvider + useViewRegistry + NavigationProviderWithRegistry（2405 tests，v0.82.0）
  - iter-002：移除 App.tsx 中 9 处 `view === 'practice'` 条件（4795 tests，v0.83.0）
  - iter-003：SmartReview data-testid 修复 + App.recall.test.tsx getByTestId 修复（2423 tests，v0.84.0）
- **当前状态**: **连续未被选中计数保持清零**（epic-079 支持者）
- **观察**: epic-079 完成度 3/3。声明式路由注册模式完全符合 PM-UX 的「学习心流」理念——新视图注册无需修改 App.tsx 条件渲染，对现有用户学习体验的侵入性降到最低。VIEW_CONFIGS 的 i18nKey 和 a11yRole 字段为未来国际化提供了数据结构基础。**epic-079 完成，PM-UX 可提出新的用户体验优化提案**

### 2026-05-27 (cycle-2026-05-27-209) — epic-085 iter-002 支持完成 (2856 tests, 历史最高水位)
- **相关 Epic**: epic-085「路由驱动式自适应学习状态机」—— 作为支持者
- **结果**: epic-085 iter-002 **完成并测试通过**，v0.90.0，2856/2861 测试通过（5 skipped，历史最高水位）
- **完成内容**: useAdaptiveViewRegistry hook + MoreMenu AdaptivePrioritySection 组件 + VIEW_TITLE_MAP 中英映射
- **当前状态**: **epic-085 完成度 2/4，剩余 iter-003~004（2 pending）**
- **观察**: epic-085 iter-002 的 AdaptivePrioritySection 完全符合 PM-UX「学习心流」理念——用户无需主动寻找「现在该做什么」，视图推荐自动呈现。top-3 视图优先级的设计让推荐清晰不过载（3 项最优），避免信息过载干扰学习节奏。VIEW_TITLE_MAP 的中英映射确保用户在中文界面下也能理解推荐视图的含义。**epic-085 完成度 2/4，剩余 iter-003（学习状态联动面板）+ iter-004（自适应难度校准）继续支持，关注自适应学习对用户心流的保护**

### 2026-05-27 (cycle-2026-05-27-207) — epic-085 iter-001 支持完成 (2707 tests, 历史最高水位)
- **相关 Epic**: epic-085「路由驱动式自适应学习状态机」—— 作为支持者
- **结果**: epic-085 iter-001 **完成并测试通过**，v0.89.0，2707/2714 测试通过（5 skipped，历史最高水位）
- **完成内容**: useAdaptiveQuestionContext hook + useAdaptiveQuestionSelector hook（priority/balanced/focus-weak 三种策略）+ 全面测试覆盖
- **当前状态**: **epic-085 完成度 1/4，剩余 iter-002~004（3 pending）**
- **观察**: epic-085 iter-001 的自适应出题策略引擎与 PM-UX「学习心流」理念高度一致——三种自适应策略（priority 优先薄弱点/balanced 平衡兼顾/focus-weak 聚焦弱点）为用户提供了清晰的学习方向选择，避免「不知道该做什么」的困惑。useAdaptiveQuestionContext 从多个数据源聚合学习状态，让用户对自己的学习状态一目了然。**epic-085 完成度 1/4，剩余 iter-002（ViewRouter 动态视图状态）+ iter-003（学习状态联动面板）+ iter-004（自适应难度校准）继续支持，关注自适应学习对用户心流的保护**
