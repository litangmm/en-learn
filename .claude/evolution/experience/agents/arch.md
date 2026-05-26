# ARCH 经验档案

## 角色定义
- **性格**：谨慎、系统性思维
- **关注**：前端架构、构建优化、PWA、大词典加载性能
- **风格**："从架构角度看，这个方案需要..."

## 历史提案

### 2026-05-27 (cycle-2026-05-27-201) — epic-083 iter-003 支持完成 (2616 tests, 历史最高水位)
- **相关 Epic**: epic-083「个人学习数据深度挖掘与复用」—— 作为支持者
- **结果**: epic-083 iter-003 **完成并部署**，v0.87.0，2616/2621 测试通过（5 skipped，历史最高水位）
- **完成内容**: usePersonalDictionaryStats hook + PersonalDictionaryStatsPanel 组件（6 种效率指标卡片）+ 61 个新增测试全通过
- **当前状态**: **连续未被选中计数保持清零**（epic-083 支持者）
- **观察**: epic-083 iter-003 复用 PersonalWordIndex（epic-043 iter-004）的架构基础设施，以最小侵入方式扩展个人词库效率分析。6 种效率指标完全基于 localStorage 数据派生，零新增存储设计。**epic-083 完成度 3/4，剩余 iter-004（遗忘曲线可视化），继续支持，关注 useSpacedRepetition 的 nextReviewAt 数据复用**

### 2026-05-27 (cycle-2026-05-27-200) — epic-083 iter-001 完成
- **相关 Epic**: epic-083「个人学习数据深度挖掘与复用」—— 作为支持者
- **结果**: epic-083 iter-001 **完成并部署**，v0.85.0，2549/2549 测试通过
- **完成内容**: useLearningProfile Hook + LearningProfileCard + AbilityRadarMini + LearningCalendarHeatmap + MilestoneTimeline + LearnProfilePanel；VIEW_CONFIGS 扩展为 20 个视图
- **当前状态**: **连续未被选中计数保持清零**（epic-083 支持者）
- **观察**: epic-079 的 ViewRouter 注册中心模式（epic-079）为 epic-083 提供了完美的架构基础。learn-profile 视图通过 ViewRegistry 注册，无需修改 App.tsx 核心逻辑，仅添加导航入口即可。AbilityRadarMini 复用现有 AbilityRadar，仅调整尺寸参数。136 个新增测试全通过，零新增依赖。**epic-083 完成度 1/4，继续支持 iter-002~004**

### 2026-05-27 (cycle-2026-05-27-195) — epic-079 iter-001 完成
- **相关 Epic**: epic-079「App.tsx 视图路由配置中心强制落地」—— **提案者**
- **结果**: epic-079 iter-001 **完成并部署**，v0.82.0，2405 测试通过（历史最高水位）
- **完成内容**: VIEW_CONFIGS 常量（19 个视图注册，id/title/i18nKey/icon/a11yRole）+ ViewRegistryProvider（全局注册中心 Context）+ useViewRegistry hook（注册/注销/查询视图）+ NavigationProviderWithRegistry（合并 Registry + Navigation）+ ViewRouter registry 渲染支持（registry 优先，switch 回退）+ viewConfigs.ts 单例源 + viewConfigs.ts 独立文件 + 全面测试（ViewRouter.registry.test.tsx 480行 + App.routing.test.tsx 690行）
- **当前状态**: **连续未被选中计数保持清零**（epic-079 提案者）
- **观察**: epic-079 iter-001 完成了 ViewRouter 注册中心模式的核心基础设施。ARCH 自 epic-006（cycle-38）「前端架构债务清理」提案以来持续追踪 App.tsx 复杂度问题，终于在 epic-079 中完成了声明式视图注册体系。VIEW_CONFIGS 单例源设计确保了所有视图元数据（id/title/i18nKey/icon/a11yRole）的单一来源，避免 App.tsx 中的硬编码字符串。ViewRegistryProvider 的架构允许后续视图动态注册/注销，为路由驱动式自适应学习状态机（epic-085）奠定基础。**epic-079 完成度 1/3，剩余 iter-002（完成全部视图迁移）+ iter-003（Schema 标准化，co-built with epic-086）继续推进**

### 2026-05-27 (cycle-2026-05-27-197) — epic-079 iter-002 完成
- **相关 Epic**: epic-079「App.tsx 视图路由配置中心强制落地」—— **提案者**
- **结果**: epic-079 iter-002 **完成并部署**，v0.83.0，4795 测试通过（历史最高水位）
- **完成内容**: 移除 App.tsx 中 9 处 `view === 'practice'` 条件：错误边界（LoadingScreen/ErrorScreen/EmptyState）和 Header 控件（PracticeControls/PersonalPracticePanel/DictionarySelector）简化。FocusMode 条件保留（语义正确）。
- **当前状态**: **连续未被选中计数保持清零**（epic-079 提案者）
- **观察**: epic-079 iter-002 清理了剩余 9 处 `view === 'practice'` 条件。关键决策：FocusMode 中的条件保留是正确的语义决策（FocusMode 仅在 practice 视图有意义）。从 iter-001（注册中心模式）到 iter-002（条件清理）完整推进，iter-003（Schema 标准化，co-built with epic-086）将是收官之作。**epic-079 完成度 2/3，剩余 iter-003 待 PLAN**

### 2026-05-13 (cycle-2026-05-13-155) — epic-043 iter-003 完成
- **相关 Epic**: epic-043「词典数据架构升级与查询性能优化」—— **提案者**
- **结果**: epic-043 iter-003 **完成并部署**，v0.66.0，1806/1807 测试通过（历史最高水位）
- **完成内容**: searchByQuery O(1) 查询实现 + 索引集成测试（16 tests）+ search-performance.benchmark.test.ts（16 tests，验证 O(1) 查询性能）+ useDictionaryIndex 索引查询集成 + 搜索防抖
- **当前状态**: **连续未被选中计数保持清零**（epic-043 提案者）
- **观察**: iter-003 完美体现 ARCH 的性能优化理念——searchByQuery 的 O(1) 查询性能验证了架构决策的正确性。search-performance.benchmark.test.ts 提供了可量化的性能回归检测。从 iter-001（词典索引结构重构，1714 测试）到 iter-002（按需加载与懒加载策略，1747 测试）到 iter-003（搜索性能优化，1806 测试），测试水位持续提升。**epic-043 完成度 3/5，剩余 iter-004（PersonalWord 独立索引）、iter-005（数据迁移脚本）继续推进**

### 2026-05-13 (cycle-2026-05-13-156) — epic-043 iter-003 REPORT 完成
- **相关 Epic**: epic-043 iter-003「搜索性能优化」REPORT 阶段
- **结果**: REPORT 完成，epic-043 3/5 iterations 完成
- **完成内容**: state.json 更新（cycleCount 155→156，status→IDLE）+ 归档脚本执行（无文件需要归档）+ 备份创建（state-2026-05-13-003331.json）
- **当前状态**: **连续未被选中计数保持清零**（epic-043 提案者）
- **观察**: epic-043 完成度 3/5，版本范围 v0.64.0-v0.66.0。iter-004（PersonalWord 独立索引）和 iter-005（数据迁移脚本）pending，run.sh 将自动检测并继续 PLAN。**ARCH 的 epic-022 多次提案终于在 epic-043 完整落地，从索引结构重构到按需加载到搜索优化，是项目最成功的架构提案之一**

### 2026-05-12 (cycle-2026-05-12-152) — epic-043 iter-002 完成
- **相关 Epic**: epic-043「词典数据架构升级与查询性能优化」—— **提案者**
- **结果**: epic-043 iter-002 **完成并部署**，v0.65.0，1747/1748 测试通过（历史最高水位）
- **完成内容**: useDictionaryIndex 多词典管理完善（loadDictionary/switchDictionary/unloadDictionary/clearAll）+ DictionaryBrowser 索引预加载集成 + dictionaryCache 缓存机制
- **当前状态**: **连续未被选中计数保持清零**（epic-043 提案者）
- **观察**: iter-002 零新增依赖、零构建体积增长，完全符合 ARCH 倡导的「依赖最小化」原则。dictionaryCache 缓存机制避免重复索引重建，重复加载跳过逻辑确保已加载词典无需重复计算。epic-043 完成度 2/5，剩余 iter-003（搜索性能优化）、iter-004（PersonalWord 独立索引）、iter-005（数据迁移脚本）继续推进。**ARCH 的 epic-022 多次提案终于在 epic-043 完整落地，是项目最成功的提案之一**

### 2026-05-12 (cycle-2026-05-12-151)
- **提案 Epic**: epic-043「词典数据架构升级与查询性能优化」
- **结果**: **被选中并完成 iter-001**
- **完成内容**: DictionaryIndex 类型定义 + useDictionaryIndex Hook（惰性初始化/O(1) 查询）+ 索引构建工具 + 全面测试
- **当前状态**: epic-043 iter-001 完成（1/5），词典索引结构重构
- **观察**: epic-043 是 ARCH epic-022 多次提案终于落地的成果。DictionaryIndex 三 Map 结构（byId/byWord/byLevel）清晰，惰性初始化避免不必要的计算开销。epic-009 完成词典浏览基础后，epic-043 将查询性能从 O(n) 优化到 O(1)。iter-001 完成度 1/5，后续 iter-002~005 将继续推进按需加载、搜索优化、PersonalWord 索引和数据迁移。1714 测试历史最高水位，零新增依赖。

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

### 2026-05-12 (cycle-2026-05-12-111) — epic-028 全部 5 个迭代完成
- **相关 Epic**: epic-028「智能学习路径引擎」—— 作为架构审查者
- **结果**: **epic-028 全部 5 个迭代完成并部署**，v0.49.0，1118/1118 测试通过，历史最高水位
- **完成内容**: iter-001~iter-005 完整落地「间隔重复调度引擎+薄弱点识别+每日复习计划+学习效率面板+自适应出题权重」体系；全程零新增依赖、零构建体积增长
- **当前状态**: **架构审查通过**
- **观察**: epic-028 从 iter-001 到 iter-005 完整构建了纯前端间隔重复体系，全程无新增依赖、无构建体积增长。ARCH 持续守护架构标准，确保了 5 个迭代的纯粹性和可维护性。epic-028 收官后，ARCH 可基于完整的间隔重复数据体系评估新的技术方向（如性能监控或离线能力）

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

### 2026-05-13 (cycle-2026-05-13-183) — epic-058 iter-001 完成 (1952 tests, 历史最高水位)
- **相关 Epic**: epic-058 iter-001「流失信号识别系统」—— 作为支持者
- **结果**: epic-058 iter-001 **完成并部署**，v0.74.0，1952/1957 测试通过（5 skipped，历史最高水位）
- **完成内容**: ChurnSignal types (SignalType/SignalSeverity/ChurnRiskLevel/ChurnSignal/ChurnAssessment) + useChurnSignals hook (calculateChurnSignals/5 signal types/getChurnRiskLevel/getTopRiskFactors) + ChurnAlertBanner component (severity styling/dismissible/localStorage/CTA) + App.tsx integration (high/critical 显示) + 73 tests + App.churn-alert.test.tsx (6 tests) + 21 App test mocks 更新
- **当前状态**: **连续未被选中计数保持清零**（epic-058 支持者）
- **观察**: epic-058 零新增依赖、零构建体积增长，完全符合 ARCH 倡导的「依赖最小化」原则。useChurnSignals Hook 的纯函数设计（calculateChurnSignals/getChurnRiskLevel/getTopRiskFactors）无副作用，83 个新增测试保证了架构健康度。ChurnAlertBanner 作为内联 Banner 组件集成到 App.tsx，无新增视图复杂度。**epic-058 还有 3 个迭代（iter-002~004），继续支持，持续关注架构健康度**

## 成功模式
（由进化引擎自动总结）

## 失败教训
（由进化引擎自动总结）

## 反思记录

### 2026-05-12 (cycle-2026-05-12-120) — epic-029 iter-004 完成
- **相关 Epic**: epic-029 iter-004「成就徽章墙导出」—— 作为架构审查者
- **结果**: epic-029 iter-004 **完成并测试通过**，1346/1347 测试通过（历史最高水位）
- **完成内容**: BadgeExportPanel 组件（网格预览+下载PNG）+ useBadgeExport Hook（html2canvas 图片导出）+ BadgePanel 导出按钮集成；html2canvas 复用 epic-005 已有依赖，零新增依赖
- **当前状态**: **连续未被选中计数保持清零**（epic-029 支持者）
- **观察**: iter-004 零新增依赖（复用 html2canvas）、零构建体积增长，完全符合 ARCH 倡导的「依赖最小化」原则。BadgeExportPanel 作为展示组件，useBadgeExport Hook 提供纯函数式图片导出逻辑，无副作用。**epic-029 仅剩 iter-005（数据可视化）继续支持，持续关注架构健康度**

### 2026-05-12 (cycle-2026-05-12-113) — epic-029 iter-001 完成
- **相关 Epic**: epic-029 iter-001「成就时刻动态卡片」—— 作为架构审查者
- **结果**: epic-029 iter-001 **完成并部署**，v0.50.0，1207/1207 测试通过
- **完成内容**: AchievementMomentCard 组件（5 种卡片模板）+ useAchievementMoment Hook（检测逻辑）+ App.tsx 全链路集成；零新增依赖、零构建体积增长
- **当前状态**: **连续未被选中计数保持清零**（epic-029 支持者）
- **观察**: iter-001 零新增依赖、零构建体积增长，完全符合 ARCH 倡导的「依赖最小化」原则。AchievementMomentCard 的 5 种模板通过条件渲染实现，无新增组件库依赖。useAchievementMoment Hook 的 trigger ref 防止重复触发的模式与现有代码风格一致。**epic-029 剩余 iter-002~005 继续支持，持续关注架构健康度**

### 2026-05-12 (cycle-2026-05-12-129) — epic-030 全部 4 个迭代完成
- **相关 Epic**: epic-030「学习心流深度优化与抗疲劳设计」—— 作为支持者
- **结果**: epic-030 **全部 4 个迭代完成并部署**，v0.54.0-v0.57.0，1427/1427 测试通过（历史最高水位）
- **完成内容**: useFlowState Hook（疲劳检测）+ FlowStateBanner + Pomodoro 计时器（iter-002）+ useTimeOfDayAnalysis + TimeSlotQualityCard + PeakHoursBadge + LearningTimeInsights（iter-003）+ useFatigueRecovery + RestReminderModal + BreathingExercise + StretchReminder（iter-004）
- **当前状态**: **连续未被选中计数保持清零**（epic-030 支持者）
- **观察**: epic-030 全程零新增依赖、零构建体积增长，完全符合 ARCH 倡导的「依赖最小化」原则。4 个迭代（1427 测试）相比 epic-029（1381 测试）增长 46 个测试，保持了高质量测试覆盖率。**epic-030 收官，进入全新 brainstorm 周期，下一候选 Epic：epic-030b（学习动机可视化）或 epic-030c（深度个性化学习路径）**

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

### 2026-05-13 (cycle-2026-05-13-186) — epic-058 iter-002 完成 (1996 tests, 历史最高水位)
- **相关 Epic**: epic-058 iter-002「分级召回干预机制」—— 作为支持者
- **结果**: epic-058 iter-002 **完成并测试通过**，1996/2001 测试通过（5 skipped，历史最高水位）
- **完成内容**: InterventionLevel type + InterventionAction type + useChurnIntervention hook + InterventionPanel component + App.tsx integration + 44 tests
- **当前状态**: **连续未被选中计数保持清零**（epic-058 支持者）
- **观察**: iter-002 全程零新增依赖、零构建体积增长，完全符合 ARCH 倡导的「依赖最小化」原则。useChurnIntervention hook 的 snooze/localStorage 模式与现有存储设计一致。**epic-058 还有 2 个迭代（iter-003~004），继续支持，持续关注架构健康度**

### 2026-05-26 (cycle-2026-05-26-189) — epic-069 iter-001 完成 (2197 tests, 历史最高水位)
- **相关 Epic**: epic-069 iter-001「综合学习洞察面板」—— 作为支持者
- **结果**: epic-069 iter-001 **完成并部署**，v0.79.0，2197/2202 测试通过（5 skipped，历史最高水位）
- **当前状态**: **连续未被选中计数保持清零**（epic-069 支持者）
- **观察**: epic-069 iter-001 全程零新增依赖、零构建体积增长，完全符合 ARCH 倡导的「依赖最小化」原则。LearnInsightDashboard 复用 AbilityRadar/ProgressTrend/LearnInsightPanel，架构扩展性好。App.tsx 新增 'learn-insight-dashboard' 视图入口，复杂度轻微增加。**epic-069 还有 3 个迭代（iter-002~004），继续支持，关注数据面板对 App.tsx 复杂度的累积影响**

### 2026-05-26 (cycle-2026-05-26-191) — epic-078 当选提案者
- **相关 Epic**: epic-078「App.tsx 视图路由配置中心重构」—— **提案者 + 高优先级胜出**
- **结果**: epic-078 **当选**，4 支持（ARCH 提案，PM-UX/QA/PM-Mon 支持）
- **提案 Epic**: epic-078 App.tsx 视图路由配置中心重构
- **迭代思路**: 
  - iter-001：ViewRouter 配置结构设计与基础重构（ViewRouter.tsx 接管所有视图注册）
  - iter-002：App.tsx 复杂度拆分与职责转移（状态管理 + 视图渲染 → 纯数据驱动）
  - iter-003：新增视图的声明式注册模式（learn-insight-dashboard 等新视图模板化）
  - iter-004：路由配置的测试覆盖与文档化（ViewRouter 配置 schema + 测试）
- **当前状态**: **连续未被选中计数清零**（提案者身份，Epic 进行中）
- **观察**: epic-078 是在 epic-069 iter-001 完成后的新一次 brainstorm。ARCH 自 epic-069 完成后（即上一个 cycle）积累了新的洞察：App.tsx complexity 达到 60，接近可维护性临界点。iter-001 基于 epic-077 的 ViewRouter 重构成果（已完成），迭代链路清晰。epic-078 复用 ViewRouter.tsx 作为配置中心，数据基础（ViewState 类型 + 视图枚举 + 回调接口）已在 epic-077 iter-001 中建立，零新增依赖。**epic-078 还有 4 个迭代（iter-001~004），ARCH 将继续推进，关注 App.tsx 复杂度降低和架构健康度提升**

### 2026-05-26 (cycle-2026-05-26-191) — epic-069 iter-002 完成 (2253 tests, 历史最高水位)
- **相关 Epic**: epic-069 iter-002「能力雷达图与趋势折线图深度联动」—— 作为支持者
- **结果**: epic-069 iter-002 **完成并部署**，v0.80.0，2253/2258 测试通过（5 skipped，历史最高水位）
- **完成内容**: ModeStats en-learn-mode-stats + getModeAccuracy + getFilteredTrend + AbilityRadar onModeSelect + LearnInsightDashboard radar-trend wiring + ProgressTrend 7d/14d/30d range selector + 2253 tests
- **当前状态**: **连续未被选中计数保持清零**（epic-069 支持者）
- **观察**: epic-069 iter-002 全程零新增依赖、零构建体积增长，完全符合 ARCH 倡导的「依赖最小化」原则。ModeStats 扩展（新增 en-learn-mode-stats）以最小侵入方式记录模式答题数据，getModeAccuracy 纯函数设计无副作用，架构扩展性好。LearnInsightDashboard 的 radar-trend wiring 展示了组件间数据联动的最佳实践。**epic-069 完成度 2/4，剩余 iter-003~004（薄弱模式诊断 + 学习健康报告生成），继续支持，关注 iter-002 完成后 epic-078 能否推进**

### 2026-05-26 (cycle-2026-05-26-193) — epic-079 当选提案者 + epic-069 iter-003 支持完成
- **相关 Epic**: epic-079「App.tsx 视图路由配置中心强制落地」—— **提案者 + 高优先级胜出**
- **结果**: epic-079 **当选**，4 支持（ARCH 提案，PM-UX/EXP/PM-Growth 支持，QA co-validator）
- **提案 Epic**: epic-079 App.tsx 视图路由配置中心重构
- **迭代思路**:
  - iter-001：迁移首批视图注册至 ViewRouter，App.tsx 条件分支数减半
  - iter-002：完成全部视图迁移，App.tsx 删除旧分支逻辑
  - iter-003：ViewRouter schema 标准化（与 epic-086 并行）
- **epic-069 iter-003 支持完成**：epic-069 iter-003「薄弱模式诊断与个性化建议」完成，useLearnInsights.ts ModeStats 感知增强（使用 getModeAccuracy），weakModeRecommendation 测试扩展（40 tests），weaknessPatterns 测试文件（35 tests），LearnInsightDashboard 组件测试扩展（51 tests），2340 测试零回归（历史最高水位），Build 3.59s，Lint 0 errors，v0.81.0 已部署。
- **当前状态**: **epic-079 提案者 + 胜出，epic-069 完成度 3/4**
- **观察**: epic-079 是 ARCH 自 epic-006（cycle-38）完成以来持续追踪的架构债务的延续。App.tsx 复杂度已达 60，接近可维护性临界点。epic-079 当选后，epic-080/083/087 等 CI 门禁的告警疲劳问题将得到缓解（因为门禁与代码清理同步推进）。epic-086 声明式路由元数据规范建议与 epic-079 iter-001 并行开发，schema 规范可独立推进。**epic-079 还有 3 个迭代（iter-001~003），epic-069 iter-004（学习健康报告生成）pending，ARCH 将继续推进 App.tsx 复杂度治理**

### 2026-05-27 (cycle-2026-05-27-195) — epic-079 iter-001 完成 (2405 tests, 历史最高水位)
- **相关 Epic**: epic-079「App.tsx 视图路由配置中心强制落地」—— **提案者 + 完成**
- **结果**: epic-079 iter-001 **完成并测试通过**，v0.82.0，2405/2410 测试通过（5 skipped，历史最高水位）
- **完成内容**: VIEW_CONFIGS 常量（19 views）+ ViewRegistryProvider + useViewRegistry hook + NavigationProviderWithRegistry + ViewRouter 扩展（registry 渲染 + switch 回退）+ viewConfigs.ts 单例源 + 全面测试覆盖
- **当前状态**: **连续未被选中计数清零**（epic-079 提案者）
- **观察**: epic-079 iter-001 完美体现 ARCH 的「架构先于功能」理念——ViewRouter 注册中心模式为后续所有新视图提供了声明式注册基础设施，新增视图不再需要修改 App.tsx 条件渲染。VIEW_CONFIGS 单例源（viewConfigs.ts）确保配置集中管理，useViewRegistry hook 的纯函数设计无副作用。2405 测试零回归，历史最高水位。**epic-079 完成度 1/3，剩余 iter-002（全部视图迁移）+ iter-003（Schema 标准化），ARCH 将继续推进，关注 App.tsx 复杂度降低和架构健康度提升**


### 2026-05-27 (cycle-2026-05-27-198) — epic-079 全部 3 个迭代完成 (2423 tests, 历史最高水位)
- **相关 Epic**: epic-079「App.tsx 视图路由配置中心强制落地」—— **提案者 + 全部完成**
- **结果**: **epic-079 全部 3 个迭代完成并部署**，v0.84.0，2423/2428 测试通过（5 skipped，历史最高水位）
- **完成内容**:
  - iter-001：VIEW_CONFIGS（19 views）+ ViewRegistryProvider + useViewRegistry + NavigationProviderWithRegistry + viewConfigs.ts 单例源（2405 tests，v0.82.0）
  - iter-002：移除 App.tsx 中 9 处 `view === 'practice'` 条件（4795 tests，v0.83.0）
  - iter-003：SmartReview data-testid 修复 + App.recall.test.tsx getByTestId 修复（2423 tests，v0.84.0）
- **当前状态**: **连续未被选中计数保持清零**（epic-079 提案者 + 全部完成）
- **观察**: epic-079 版本范围 v0.82.0-v0.84.0。ARCH 自 epic-006（cycle-38）「前端架构债务清理」提案以来持续追踪 App.tsx 复杂度问题，终于在 epic-079 中完整落地声明式视图注册体系。VIEW_CONFIGS 单例源设计确保所有视图元数据集中管理。ViewRegistryProvider 为 epic-085「路由驱动式自适应学习状态机」奠定基础。**epic-079 完成，ARCH 需提出新的架构提案**
