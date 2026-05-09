# tech-review 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

### 2026-05-09 (cycle-2026-05-09-13)
- **迭代**: epic-002 iter-004「专注模式（全屏无干扰 UI）」—— **技术审查通过**
- **技术决策**:
  - isFocusMode 状态在 App.tsx 顶层管理，通过 props 向下传递至 PracticeCard，状态流清晰
  - 条件渲染集中在 App.tsx 的 return 语句中，使用 isFocusMode 统一控制多个组件的显隐，避免分散的条件判断
  - isFocusModeRef 用于 ESC 键事件监听，避免闭包捕获旧值，复用了 bugfix-001 的键盘快捷键实现模式
  - PracticeCard 的 isFocusMode prop 为可选（默认 false），不破坏现有调用，向后兼容
  - 专注模式下 PracticeCard 的样式变更通过条件类名实现（p-4 md:p-6 vs p-6 md:p-10），无额外 CSS 文件
- **质量门禁通过**: lint 0 errors (3 pre-existing warnings), build passed, 262/262 unit tests passed
- **观察**: App.tsx 的条件渲染复杂度继续增加——目前管理 6 个视图 + 3 种练习模式 + 专注模式状态 + 对话框状态，建议在 epic-002 完成后进行导航配置提取和组件渲染策略重构

### 2026-05-09 (cycle-2026-05-09-9)
- **迭代**: epic-002 iter-003「选择题模式（四选一快速练习）」—— **技术审查通过**
- **技术决策**:
  - PracticeMode 联合类型从 2 个值扩展为 3 个值（'fill-in-blanks' | 'dictation' | 'multiple-choice'），类型系统自然容纳新模式
  - usePractice hook 中 options 的 useMemo 依赖 dictionarySentences（完整词典），确保每次当前句变化时重新生成干扰项
  - checkAnswer 的 selectedOptionId 参数为可选，填空/听写模式不传入时保持原有行为，实现向后兼容
  - PracticeCard 新增的可选 props（options/selectedChoiceId/onSelectChoice）不会破坏现有填空/听写模式的渲染
  - 选择题模式下 nextSentence 后自动播放（500ms 延迟）与填空/听写模式各自独立
- **质量门禁通过**: lint 0 errors (3 pre-existing warnings), build passed, 240/240 unit tests passed
- **观察**: App.tsx 的练习模式切换已扩展至 3 种，加上 5 个功能视图，条件渲染复杂度持续累积。ARCH 此前多次提出的导航抽象建议在 iter-004（专注模式）前应作为技术债务处理。当前 UI 无移动端适配，这是比导航抽象更紧迫的基础债务。

### 2026-05-09 (cycle-2026-05-09-8)
- **迭代**: epic-002 iter-002「音频播放速度控制」—— **技术审查通过**
- **技术决策**:
  - useSpeech hook 的 playbackRate 状态与 speak 的 rate 覆盖参数共存，API 设计简洁且向后兼容
  - SPEEDS 常量为静态数组，无运行时计算开销
  - 速度选择器在 PracticeCard Header 中始终渲染，不受 showResult 影响
  - App.tsx 移除所有硬编码速率，消除了 magic number
- **质量门禁通过**: lint 0 errors (3 pre-existing warnings), build passed, 219/219 unit tests passed
- **观察**: 零新增依赖，零构建体积增长

### 2026-05-09 (cycle-2026-05-09-7)
- **迭代**: epic-002 iter-001「纯听写模式」—— **技术审查通过**
- **技术决策**:
  - PracticeMode 联合类型设计简洁，后续扩展新模式无需修改现有组件 props 接口
  - dictation 模式下 audio 自动播放由 App.tsx 控制（通过 useEffect + mode 依赖），PracticeCard 保持纯展示逻辑
  - 模式切换重置输入的设计避免了跨模式状态残留问题
  - 无新增依赖，构建体积零增长
- **质量门禁通过**: lint 0 errors (3 pre-existing warnings), build passed, 205/205 unit tests passed
- **观察**: App.tsx 的视图切换逻辑已扩展至 6 个视图（practice/mistake-book/history/data/review + 模式切换），导航状态管理复杂度继续增加。后续迭代如需增加新视图或模式，应考虑将导航配置提取到独立模块。PracticeCard 的条件渲染逻辑当前为 if/else，4+ 模式时建议重构为配置驱动的渲染策略

### 2026-05-09 (cycle-2026-05-09-6)
- **迭代**: iter-005「智能复习队列」—— **技术审查通过**
- **技术决策**:
  - 间隔重复算法使用固定间隔数组 [1,3,7,14] 天，简洁且可解释，便于后续调优
  - processedReviewRef 防止同一题的重复调度，避免 retry 导致的逻辑错误
  - 复习模式与普通练习模式共用 practice 视图，通过 isReviewMode 状态区分，最小化 UI 代码重复
  - SmartReview 组件的异步词典加载使用 useEffect + useState 模式，与 MistakeBook 保持一致
- **质量门禁通过**: lint 0 errors (3 pre-existing warnings), build passed, 189/189 unit tests passed
- **观察**: App.tsx 的视图切换逻辑已扩展至 5 个视图（practice/mistake-book/history/data/review），导航结构仍清晰但接近复杂度阈值。后续迭代如需继续增加视图，应考虑提取导航配置到独立模块

### 2026-05-09 (cycle-2026-05-09-5)
- **迭代**: iter-005「智能复习队列」
- **技术决策**: Mistake 类型扩展采用可选字段（nextReviewAt?: number, lastReviewedAt?: number），确保旧数据向后兼容
- **质量门禁通过**: lint 0 errors, build passed, 165/165 unit tests passed
- **观察**: 类型扩展是低风险变更，但需确保后续 isValidMistake 校验函数同步更新以接受新字段。iter-005 的算法部分（scheduleNextReview）将是技术审查重点

### 2026-05-09 (cycle-2026-05-09-3)
- **迭代**: iter-004「数据导入导出」
- **技术决策**:
  - localStorage 4-key 架构（session/mistakes/history）保持不变，export 为运行时聚合不产生新 key
  - ExportData schema 版本化为 1，预留未来扩展空间
  - isValidExportData 采用递归校验策略，逐层验证 session（null 或 V2）、mistakes（isValidMistake）、history（isValidHistory）
  - DataManager 组件纯前端实现，无外部依赖，blob 下载兼容现代浏览器
  - App.tsx 视图切换扩展至 4 个视图（practice/mistake-book/history/data），导航结构仍清晰
- **质量门禁通过**: lint 0 errors, build passed, 159/159 unit tests passed
- **观察**: 数据导入导出是数据层的「出口」能力，与之前的「入口」（会话恢复、错题捕获、历史记录）形成完整闭环。递归校验模式可为后续自定义数据导入提供复用基础

### 2026-05-09 (cycle-2026-05-09-2)
- **迭代**: iter-002「错题本 MVP」+ iter-003「学习历史记录」
- **技术决策**:
  - 继续使用 localStorage（符合 MVP 原则），3 个 key 架构（session/mistakes/history）在容量允许范围内
  - V2 schema 向后兼容 V1，通过 loadSession 时自动迁移 pendingMistakes
  - 历史记录上限 100 条平衡了数据完整性和存储容量
  - usePractice hook 的 sentenceIds 参数实现了错题练习模式的优雅复用
- **质量门禁通过**: lint 0 errors, build passed, 131/131 unit tests passed
- **观察**: 两个迭代的技术决策均保持了与 iter-001 的一致性，没有出现架构偏离。组件层的视图切换逻辑（App.tsx）开始变得复杂（3 个视图），后续迭代需关注导航的可扩展性

### 2026-05-09 (cycle-2026-05-09-11)
- **迭代**: epic-002 iter-003b「纯听写模式重新设计」—— **技术审查通过**
- **技术决策**:
  - 中文翻译可见性变更通过移除条件渲染实现（删除 `!isDictation &&` 前缀），简化而非增加逻辑复杂度
  - 首字母提示使用 blankWords 数组中已存在的 word 字段首字符，零额外数据获取
  - 提示文本通过现有 translation 字段获取，无新增 props 或状态
  - 所有变更局限于 PracticeCard 组件内部，App.tsx 和其他组件零影响
- **质量门禁通过**: lint 0 errors (3 pre-existing warnings), build passed, 256/256 unit tests passed
- **观察**: 本次迭代零架构变更、零类型变更、零 API 变更，仅涉及展示层条件渲染调整，风险极低。App.tsx 视图切换逻辑复杂度未增加，导航结构维持现状

### 2026-05-09 (cycle-2026-05-09-10)
- **迭代**: epic-002 iter-003a「响应式 UI 适配（移动端 + 桌面端）」—— **技术审查通过**
- **技术决策**:
  - 响应式断点完全使用 Tailwind 默认断点（sm: 640px, md: 768px, lg: 1024px），无自定义断点配置
  - MobileNav 和桌面导航通过互斥的 `md:hidden` / `hidden md:flex` 实现，避免重复渲染
  - 触摸目标 `h-11`（44px）符合 WCAG 2.1 AA 级要求（最小 44×44 CSS px）
  - 主内容区 `min-height: calc(100vh - 4rem)` 在移动端通过 `--mobile-nav-height` 变量动态调整
  - window.matchMedia mock 在 vitest.setup.ts 中全局配置，供所有响应式测试复用
- **质量门禁通过**: lint 0 errors (3 pre-existing warnings), build passed, 255/255 unit tests passed
- **观察**: 响应式改造零逻辑变更、零类型变更，仅涉及 CSS 类名和布局结构调整，风险极低。App.tsx 的视图切换逻辑复杂度未增加（条件渲染通过类名而非新增分支实现）

### 2026-05-09 (cycle-2026-05-09-1)
- **迭代**: iter-001「核心存储服务与会话持久化」
- **技术决策**: localStorage 优先（符合 MVP 原则），版本化 schema 预留 IndexedDB 迁移空间
- **质量门禁通过**: lint 0 errors, build passed, 72/72 unit tests passed
- **观察**: 纯前端存储方案在当前数据量下完全够用，无需过早引入 IndexedDB 复杂度
