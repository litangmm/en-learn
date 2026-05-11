# ARCH 经验档案

## 角色定义
- **性格**：谨慎、系统性思维
- **关注**：前端架构、构建优化、PWA、大词典加载性能
- **风格**："从架构角度看，这个方案需要..."

## 历史提案

### 2026-05-10 (cycle-2026-05-10-20)
- **提案 Epic**: epic-006「前端架构债务清理与性能基线」
- **结果**: 未被选中（epic-003 iter-004 完成，epic-006 为 medium 优先级储备）
- **当前状态**: **连续 16 个 cycle 未被选中**（cycle-19 时 15 次 + 本次 1 次）
- **观察**: epic-003 iter-004 在现有架构内自然扩展（新增 useBadges hook + BadgePanel + BadgeUnlockToast + storage 徽章能力），未引入架构变更。但 App.tsx 的复杂度已达灾难级临界点——现在管理 8 个视图（practice/mistake-book/history/data/review/challenges/badges + focus mode overlay）+ 4 种练习模式 × 专注模式 × 响应式断点 + XP 系统 + 连击动画 + 每日挑战 + 徽章追踪。条件渲染代码已接近 300 行，任何新增功能都面临极高的回归风险。**反思建议**：epic-003 仅剩 1 个迭代，完成后 MUST 立即优先处理架构债务。建议将 epic-006 优先级从 medium 提升为 critical，首个迭代必须实施「App.tsx 导航配置提取」和「视图级路由抽象」，否则后续所有 Epic（包括用户反馈驱动的 epic-004）将在不可维护的代码基础上叠加更多复杂度

### 2026-05-09 (cycle-2026-05-09-19)
- **提案 Epic**: epic-006「前端架构债务清理与性能基线」
- **结果**: 未被选中（epic-003 iter-003 完成，epic-006 为 medium 优先级储备）
- **当前状态**: **连续 15 个 cycle 未被选中**（cycle-17 时 14 次 + 本次 1 次）
- **观察**: epic-003 iter-003 在现有架构内自然扩展（新增 useDailyChallenges hook + DailyChallengePanel 组件 + storage 每日挑战能力），未引入架构变更。但 App.tsx 的复杂度已逼近临界点——现在管理 7 个视图 + 4 种练习模式 × 专注模式 × 响应式断点 + XP 系统 + 连击动画 + 每日挑战。ARCH 的「导航配置提取」警告已持续 5 个 cycle 未被响应，技术债务呈指数级增长。**反思建议**：epic-003 仅剩 2 个迭代，完成后 MUST 优先处理架构债务，否则 epic-005/006/008 将在严重混乱的基础上叠加更多复杂度。建议将 epic-006 的优先级从 medium 提升为 high

### 2026-05-09 (cycle-2026-05-09-16)
- **提案 Epic**: epic-006「前端架构债务清理与性能基线」
- **结果**: 未被选中（epic-003 iter-001 完成，epic-006 为 medium 优先级储备）
- **当前状态**: **连续 13 个 cycle 未被选中**（cycle-14 时 12 次 + 本次 1 次）
- **观察**: epic-003 的 iter-001 在现有架构内自然扩展（新增 useXP hook + XPBar 组件 + storage XP 能力），未引入架构变更。但 App.tsx 的复杂度持续累积——现在管理 4 种练习模式 × 5 个功能视图 × 专注模式 × 响应式断点 + XP 奖励 useEffect。epic-003 剩余 4 个迭代还将叠加连击动画/每日挑战/徽章/排行榜，导航提取和策略模式重构的技术债务将指数级增长。ARCH 强烈建议：在 epic-003 的某个迭代中插入「App.tsx 导航配置提取」作为技术债务清偿，否则后续 Epic（epic-005/006/008）将在混乱基础上叠加更多复杂度

### 2026-05-09 (cycle-2026-05-09-14)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-002 iter-005 完成，**epic-002 全部收官**）
- **当前状态**: **连续 12 个 cycle 未被选中**
- **观察**: epic-002 全部 7 个迭代已完成。iter-005 的 checkAnswer 参数重载（`string | string[]`）进一步增加了 usePractice 的复杂度——虽然向后兼容，但函数签名已变得笨重。App.tsx 的条件渲染复杂度已达峰值：4 种练习模式 × 5 个功能视图 × 专注模式开关 × 响应式断点。ARCH 此前多次提出的「导航配置提取」和「PracticeCard 策略模式重构」已成为紧迫技术债务，应在下次 Epic 开始前优先处理。epic-002 完成后 epic-004（PWA 化）的技术前提（响应式基础）已满足

### 2026-05-09 (cycle-2026-05-09-13)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-002 iter-004 完成）
- **当前状态**: 连续 11 个 cycle 未被选中
- **观察**: iter-004 的专注模式条件渲染进一步增加了 App.tsx 的复杂度——新增 isFocusMode 状态和 4 组条件渲染（Header、ToggleGroup、hint、MobileNav 的显隐控制）。ARCH 此前多次提出的「App.tsx 导航复杂度」问题持续恶化。epic-002 仅剩 iter-005，完成后 ARCH 应强烈推动导航配置提取和 PracticeCard 模式渲染的策略模式重构，否则后续 Epic（尤其是 epic-003 游戏化、epic-004 PWA）将在混乱的导航基础上叠加更多复杂度

### 2026-05-09 (cycle-2026-05-09-11)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-002 iter-003b 完成）
- **当前状态**: 连续 10 个 cycle 未被选中
- **观察**: iter-003b 仅修改 1 个组件文件和 3 个测试文件，再次验证了 epic-002 各迭代与数据层零耦合的特性。ARCH 此前多次提出的「App.tsx 导航复杂度」问题在 iter-003b 中未恶化（零导航变更）。epic-002 完成后，ARCH 应推动导航配置提取和 PracticeCard 模式渲染的策略模式重构，为后续 Epic 奠定更清晰的架构基础

### 2026-05-09 (cycle-2026-05-09-10)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-002 iter-003a 完成）
- **当前状态**: 连续 9 个 cycle 未被选中
- **观察**: iter-003a 的响应式 UI 适配正是 ARCH 在多轮观察中反复强调的「移动端基础债务」。战略指令 dir-urgent-002 的插入验证了 ARCH 的技术判断——如果不先做响应式，后续所有新功能在移动端完全不可用。ARCH 的 PWA 化提案与响应式基础天然关联（PWA 必须同时适配桌面和移动端），epic-002 完成后 epic-004 的紧迫性将进一步提升

### 2026-05-09 (cycle-2026-05-09-9)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-002 iter-003 完成）
- **当前状态**: 连续 8 个 cycle 未被选中
- **观察**: App.tsx 的练习模式切换已扩展至 3 种（填空/听写/选择），加上 5 个功能视图（practice/mistake-book/history/data/review），条件渲染复杂度持续累积。ARCH 此前多次提出的导航抽象建议仍未实施。更关键的是，当前 UI 完全没有移动端适配，所有组件都是桌面布局——这意味着后续所有新功能（专注模式、连词成句等）如果不先做响应式基础，将在移动端完全不可用，返工成本极高。ARCH 应在下次迭代中推动响应式基础架构

### 2026-05-09 (cycle-2026-05-09-8)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-002 iter-002 完成）
- **当前状态**: 连续 7 个 cycle 未被选中
- **观察**: ARCH 支持的 epic-002 继续推进。iter-002 音频速度控制仅扩展了 useSpeech hook 的状态管理（playbackRate）和条件渲染（PracticeCard ToggleGroup），无新增依赖、无架构变更。App.tsx 视图切换逻辑已达 6 个视图，导航结构复杂度持续累积，后续迭代应考虑提取导航配置或路由抽象

### 2026-05-09 (cycle-2026-05-09-7)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-002 iter-001 完成）
- **当前状态**: 连续 6 个 cycle 未被选中
- **观察**: ARCH 在 epic-001 完成后支持 epic-002 作为最高优先级。iter-001 纯听写模式无新增依赖、无构建体积增加，验证了 ARCH 对「多模式代码体积」担忧的保守性。App.tsx 视图切换逻辑已扩展至 6 个视图（practice/mistake-book/history/data/review），导航结构接近复杂度阈值，后续迭代应考虑提取导航配置

### 2026-05-09 (cycle-2026-05-09-6)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-001 收尾中，iter-005 完成）
- **当前状态**: 连续 5 个 cycle 未被选中
- **观察**: epic-001 已完整完成。localStorage 5-key 架构（session/mistakes/history/export 运行时聚合 + 复习调度数据）在 ~5MB 容量内运行稳定。epic-004 的 IndexedDB 迁移可作为下一步技术演进方向。

### 2026-05-09 (cycle-2026-05-09-5)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-001 仍在执行中）
- **当前状态**: 连续 4 个 cycle 未被选中
- **观察**: iter-005 启动，Mistake 类型扩展增加 nextReviewAt/lastReviewedAt 字段，保持向后兼容。localStorage 架构从 4-key 向 5-key 演进的可能性较低，但数据模型复杂度在增加。epic-001 完成后 epic-004 应成为强候选

### 2026-05-09 (cycle-2026-05-09-3)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-001 仍在执行中）
- **当前状态**: 连续 3 个 cycle 未被选中
- **观察**: iter-004 数据导入导出已完成，localStorage 4-key 架构（session/mistakes/history/export）运行稳定。数据导入导出为 PWA 离线数据同步提供了校验和格式基础。epic-001 仅剩 iter-005，预计下个 cycle  epic-004 可进入候选

### 2026-05-09 (cycle-2026-05-09-2)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中（epic-001 仍在执行中）
- **当前状态**: 连续 2 个 cycle 未被选中
- **观察**: iter-003 完成后，localStorage 已承载 3 个 key（session/mistakes/history），容量管理将成为 iter-004（数据导入导出）和后续 PWA 化时的关注重点。V2 schema 的迁移机制已验证可行，为 IndexedDB 迁移积累了模式

### 2026-05-09 (cycle-2026-05-09-1)
- **提案 Epic**: epic-004「PWA 化与离线优先学习」
- **结果**: 未被选中
- **优先级**: medium
- **支持方**: PM-Mon, PM-Lean, PM-Growth, UX
- **反对/担忧**: iOS PWA 支持有限；service worker 缓存策略维护成本
- **备注**: 依赖 epic-001 的数据持久化能力，作为中长期技术方向储备

### 2026-05-10 (cycle-2026-05-10-21)
- **提案 Epic**: epic-006「前端架构债务清理与性能基线」
- **结果**: 未被选中（epic-003 iter-005 完成，**epic-003 全部 5 个迭代收官**）
- **当前状态**: **连续 17 个 cycle 未被选中**（cycle-20 时 16 次 + 本次 1 次）
- **观察**: epic-003 全部 5 个迭代已完成。iter-005 在现有架构内自然扩展（新增 useLeaderboard hook + Leaderboard 组件），未引入架构变更。但 App.tsx 的复杂度已达灾难级临界点——现在管理 9 个视图（practice/mistake-book/history/data/review/challenges/badges/leaderboard + focus mode overlay）+ 4 种练习模式 × 专注模式 × 响应式断点 + XP 系统 + 连击动画 + 每日挑战 + 徽章追踪 + 排行榜。条件渲染代码已接近 300 行。ARCH 强烈建议：下次 brainstorm 必须将 epic-006「前端架构债务清理」优先级从 medium 提升为 critical，首个迭代必须实施「App.tsx 导航配置提取」和「视图级路由抽象」。epic-003 完成后，如不立即处理导航重构，后续 epic-004（体验优化）的任何新功能都将在不可维护的代码基础上叠加复杂度

### 2026-05-10 (cycle-2026-05-10-28)
- **提案 Epic**: epic-006「前端架构债务清理与性能基线」
- **结果**: 未被选中（epic-004 iter-003 完成，epic-006 为 critical 优先级储备）
- **当前状态**: **连续 20 个 cycle 未被选中**（cycle-27 时 19 次 + 本次 1 次）
- **观察**: epic-004 iter-003 在现有架构内自然扩展（新增 isDefinitionSentence 辅助函数、ChoiceOption 接口、options 文本逻辑、displayText 逻辑），未引入架构变更。App.tsx 的条件渲染复杂度已达灾难级临界点——现在管理 9 个视图 × 4 种练习模式 × 专注模式 × 响应式断点 + 游戏化系统 + hint 条件渲染 + 模式提示文案。epic-004 仅剩 2 个迭代（iter-004 智能复习规则可视化、iter-005 首次/恢复弹窗体验打磨），完成后 MUST 立即执行 epic-006，否则后续任何 Epic 都将在不可维护的代码基础上叠加复杂度。当前技术债务已非线性累积，**重构窗口正在加速关闭**

### 2026-05-10 (cycle-2026-05-10-38)
- **提案 Epic**: epic-006「前端架构债务清理与性能基线」
- **结果**: **被选中** — epic-006 iter-001 完成，ViewRouter + NavigationContext 重构
- **当前状态**: **连续未被选中计数清零**（终于被选中！）
- **完成内容**:
  - 创建 ViewRouter.tsx（view → component 映射表） + NavigationContext.tsx（导航 Provider） + index.ts（barrel exports）
  - App.tsx 重构：移除 ~135 行嵌套三元运算符视图渲染，使用 ViewRouter + NavigationProvider
  - 验证 P0 fix（storage.clearSession in confirmSwitch）+ P1 fix（Input h-11 md:h-10）
  - 新增 ViewRouter.test.tsx（16 个测试覆盖全部 8 个视图映射和 props 传递）
  - 修复 LeaderboardEntry 类型（在 App.leaderboard.test.tsx 中）
  - **501/501 测试通过**，构建成功（2.86s）
  - Commits: 1e73d65（代码）+ 15ab7fe（文档），版本 v0.23.0
- **观察**: ARCH 在连续 20+ 个 cycle 未被选中后终于入选。关键转折点：App.tsx 复杂度已达灾难级临界点（~300 行条件渲染代码，管理 9 个视图 × 4 种练习模式 × 专注模式 × 响应式断点 + 游戏化系统），重构窗口正在加速关闭。epic-003 全部 5 个迭代完成后，ARCH 持续提出的架构债务警告终于得到响应。ViewRouter 的 view → component 映射设计和 NavigationContext 的 Provider 模式实现了视图与逻辑解耦，为后续 iter-002（PracticeCard 策略模式）和 iter-003（构建体积监控基线）奠定基础。

### 2026-05-12 (cycle-2026-05-12-103) — epic-028 iter-003 完成
- **相关 Epic**: epic-028 iter-003「每日复习计划与提醒系统」—— 作为支持者
- **结果**: epic-028 iter-003 **完成并部署**，v0.47.0，1052/1052 测试通过
- **完成内容**: DailyReviewStats 类型 + useReviewStreak Hook + DailyReviewPlan 组件 + Header 复习指示器；全部零新增依赖、零构建体积增长
- **当前状态**: **连续未被选中计数保持清零**（epic-028 支持者）
- **观察**: iter-003 零新增依赖、零构建体积增长，完全符合 ARCH 倡导的「依赖最小化」原则。DailyReviewPlan 作为纯展示组件，useReviewStreak Hook 的 getDueReviewItems/getReviewStats/getReviewStats 纯函数设计无副作用。**epic-028 剩余 iter-004（学习效率数据面板）、iter-005（自适应出题权重算法优化），继续支持，关注架构健康度**

### 2026-05-11 (cycle-2026-05-11-89) — epic-018 iter-002 完成
- **相关 Epic**: epic-018 iter-002「能力雷达图与进度趋势」—— 作为支持者
- **结果**: epic-018 iter-002 **完成并部署**，v0.40.0，876/876 测试通过
- **完成内容**: AbilityRadar SVG 五边形雷达图(4轴)+ProgressTrend 折线图(XP/题数切换)+useProgressStats 新增 getModeAccuracy/getDailyXP；全部零新增依赖、纯 SVG 实现
- **当前状态**: **连续未被选中计数保持清零**（epic-018 支持者）
- **观察**: AbilityRadar 和 ProgressTrend 均为纯 SVG 实现，无图表库引入，这是 ARCH 倡导的「依赖最小化」原则的直接体现。useProgressStats Hook 的 getModeAccuracy/getDailyXP 纯函数设计无副作用，测试覆盖简单。**epic-018 剩余 iter-003（成就系统/学习档案）继续支持，关注架构健康度**

### 2026-05-11 (cycle-2026-05-11-83)
- **相关 Epic**: epic-014 iter-001「主练习链路稳定性打磨」—— 作为贡献者
- **结果**: epic-014 iter-001 完成，819/819 测试通过，v0.37.0
- **完成内容**: shareTriggers.ts 重构提取（提升组件职责单一化）；NavigationContext._currentValue 改标准 useContext；shareTriggers 是从 App.tsx 的条件渲染逻辑中提取的职责分离实践
- **当前状态**: **连续未被选中计数保持清零**（epic-014 贡献者）
- **观察**: shareTriggers.ts 重构是 ARCH 提出的「组件职责单一化」理念的具体实践——将 share 触发逻辑从 App.tsx 条件渲染中提取为独立模块。NavigationContext._currentValue 改标准 useContext 解决了 React Context 在某些场景下的 stale closure 问题。**epic-014 剩余 5 个迭代（iter-002~006），ARCH 可继续关注架构健康度**

### 2026-05-11 (cycle-2026-05-11-64)
- **相关 Epic**: epic-009 iter-001「词典浏览器（只读）」—— 作为支持者
- **结果**: epic-009 iter-001 完成，708/708 测试通过，v0.31.0
- **当前状态**: **连续未被选中计数保持清零**（epic-004 收官后继续支持 epic-009）
- **观察**: iter-001 的 DictionaryBrowser 组件作为只读展示，复用了 ViewRouter 的导航架构，无新增复杂度。PersonalWord 类型的 marked/markedAt 字段设计保留扩展性，为 iter-003 的 localStorage 持久化提供数据基础。**epic-009 剩余 iter-002（搜索筛选）、iter-003（生词标记），继续推进中**
- **相关 Epic**: epic-004「体验优化与响应式适配」—— 作为贡献者
- **结果**: **epic-004 全部 10 个迭代收官**，531/531 测试通过，v0.26.0
- **完成内容**: epic-004 iter-006 的 5 个子项全部完成：桌面端顶部导航折叠（MoreMenu）、移动端弹窗自适应、成就toast短暂化（3s→1.5s）、排行榜数据范围标注、听写模式独立体验
- **当前状态**: **连续未被选中计数清零**（epic-004 收官）
- **观察**: epic-004 是 dir-1778414197688 指令驱动，响应用户完整评测第二轮反馈的「桌面顶部布局和移动端适配是最大短板」。epic-004 从 iter-001（移动端基础）到 iter-006（深度响应式重构）共 10 个迭代，全部零新增依赖、零构建体积增长。ARCH 在 epic-004 中的贡献包括 MoreMenu 组件的技术实现。**epic-004 收官后，ARCH 需关注下一 Epic 的架构健康度**

### 2026-05-10 (cycle-2026-05-10-47)
- **提案 Epic**: epic-004 iter-006「响应式布局深度重构」
- **结果**: **被选中（iter-006.1）** — 桌面端顶部导航折叠重构完成
- **当前状态**: 连续未被选中计数清零（epic-006 完成后再入选）
- **完成内容**:
  - 创建 MoreMenu.tsx 组件，将 7 个次级导航项（错题本、学习记录、数据管理、智能复习、每日挑战、成就、排行）折叠进「更多」下拉菜单
  - 保护品牌区不被压缩：App.tsx header 添加 `min-w-0` 和 `flex-shrink-0`
  - 桌面端（md+）显示 MoreMenu，移动端（<md）隐藏
  - 核心练习控制区（词典选择、重置、得分/XP/Streak）保持可见
  - **531/531 测试通过**，build 成功（2.91s，447.59 kB gzip）
  - 版本 v0.26.0，commit 8b22a44
- **观察**: epic-004 iter-006 是 dir-1778414197688 指令驱动，针对用户完整评测第二轮反馈的「桌面顶部布局和移动端适配是最大短板」。iter-006.1 完成了桌面端导航折叠（1/5），剩余 4 个迭代（移动端弹窗自适应、成就toast短暂化、排行榜范围标注、听写模式独立体验）将继续执行。**epic-004 iter-006 是当前最高优先级 Epic**

### 2026-05-10 (cycle-2026-05-10-46)
- **提案 Epic**: epic-006「前端架构债务清理与性能基线」
- **结果**: **全部完成** — epic-006 iter-003 构建体积监控基线完成
- **当前状态**: **连续未被选中计数清零**（epic-006 全部 3 个 iterations 完成）
- **完成内容**:
  - iter-003 安装 rollup-plugin-visualizer，配置 manualChunks（vendor-recharts/radix/framer/router/misc）和 chunkSizeWarningLimit (650KB)
  - 创建 baseline/bundle-sizes.json 和 baseline/README.md
  - 添加 build:analyze 脚本
  - 验证 build 成功（2.77s），stats.html 生成，506/506 测试通过
  - 版本 v0.25.0，commit 7bde648
- **观察**: epic-006 全部 3 个迭代已完成。ViewRouter + NavigationContext 抽象了视图路由，PracticeCard 策略模式解耦了模式渲染，构建体积监控提供了性能基线。App.tsx 从 ~300 行条件渲染简化到清晰的 ViewRouter 配置。ARCH 连续 20+ 个 cycle 的坚持最终完成了历史使命。**epic-004「体验优化与响应式适配」的响应式布局问题（dir-1778414197688 指令：桌面顶部+移动端弹窗+成就toast+排行榜标注+听写独立体验）应成为下一 Epic 优先候选**

## 成功模式
（由进化引擎自动总结）

## 失败教训
（由进化引擎自动总结）

## 反思记录

### 2026-05-10 (cycle-2026-05-10-38) — 首次被选中
- **反思**: ARCH 连续 20+ 个 cycle 未被选中，但其技术债务警告持续有效。App.tsx 的复杂度从 cycle-14 开始记录，从 ~150 行条件渲染代码增长到 ~300 行。ARCH 的「持续追踪 + 准确时机」策略最终获得回报。
- **建议**: 继续保持对架构健康度的追踪，在复杂度接近阈值时主动推动重构。当前 epic-006 还有 2 个 pending iterations（iter-002 PracticeCard 策略模式、iter-003 构建体积监控基线），应确保这两个迭代的高质量完成。
- **状态**: epic-006 iter-001 完成，等待 iter-002/003

### 2026-05-09 (cycle-2026-05-09-5) — 连续 4 次未被选中
- **反思**: epic-004 的 PWA 化与 epic-001 的数据持久化有天然的技术关联（service worker 缓存策略与 localStorage 数据同步）。等待 epic-001 完全完成再启动 PWA 可能错失技术验证时机。ARCH 应在下次 brainstorm 中提出「渐进式 PWA」方案——从简单的 manifest 和离线页面壳开始，而非等待全部数据架构稳定
- **建议**: 将 epic-004 拆分为「应用壳先行」和「数据同步跟进」两个子阶段，降低等待成本
- **状态**: epic-001 完成后，epic-004 应为中等优先级候选

### 2026-05-09 (cycle-2026-05-09-17)
- **提案 Epic**: epic-006「前端架构债务清理与性能基线」
- **结果**: 未被选中（epic-003 iter-002 完成，epic-006 仍为 medium 优先级储备）
- **当前状态**: **连续 14 个 cycle 未被选中**（cycle-16 时 13 次 + 本次 1 次）
- **观察**: epic-003 iter-002 在现有架构内自然扩展（新增 StreakFeedback + XPGainPopup 组件，扩展 useXP hook），未引入架构变更。但 App.tsx 的复杂度继续指数级累积——现在管理 6 个视图 + 4 种练习模式 + 专注模式 + 响应式断点 + XP 系统 + 连击动画 + 每日挑战（iter-003 即将叠加）。ARCH 强烈建议：在 epic-003 的 iter-003 或 iter-004 中插入「App.tsx 导航配置提取」作为技术债务清偿，否则 App.tsx 的条件渲染将超出人类可维护的阈值

## 改进方向
（由进化引擎自动总结）
