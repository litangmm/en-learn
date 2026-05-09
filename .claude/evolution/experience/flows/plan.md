# plan 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

### 2026-05-09 (cycle-2026-05-09-16)
- **迭代**: epic-003 iter-001「XP 积分与等级系统」—— **完整执行**
- **计划步骤**: 9 步全部完成，涵盖类型定义（XPProfile + LEVEL_THRESHOLDS）、存储服务扩展（XP_PROFILE_KEY、验证器、CRUD、addXP 算法）、useXP Hook（懒加载、addXP、firstTry 奖励、reset）、XPBar 组件（紧凑/全尺寸双模式）、App.tsx 集成（header/focus bar 显示、模式差异化基础 XP、awardedXPRef 防重）、存储层测试、Hook 测试、App 集成测试、全量验证
- **实际修改文件**: 与计划一致
  - 修改: src/data/types.ts, src/services/storage.ts, src/App.tsx
  - 创建: src/hooks/useXP.ts, src/components/XPBar.tsx, src/services/__tests__/xp-storage.test.ts, src/hooks/__tests__/useXP.test.ts, src/components/__tests__/App.xp.test.tsx
  - 更新测试 mock: 6 个现有 App 测试文件 + DataManager.test.tsx + export-import.test.ts
- **观察**: 计划清晰可执行，XP 系统作为全新数据维度，与现有 session/mistakes/history 并行存储，架构上无冲突。addXP 算法的等级计算（threshold 查找 + 进度百分比）边界明确，适合 comprehensive 单元测试覆盖。awardedXPRef 的防重复设计复用了智能复习的 processedReviewRef 模式

### 2026-05-09 (cycle-2026-05-09-13)
- **迭代**: epic-002 iter-004「专注模式（全屏无干扰 UI）」—— **完整执行**
- **计划步骤**: 7 步全部完成，涵盖状态管理、专注模式入口按钮、条件渲染（隐藏 Header/ToggleGroup/hint/MobileNav）、极简进度条、ESC 键退出、PracticeCard 沉浸优化、测试覆盖、全量验证
- **实际修改文件**: 与计划一致
  - 修改: src/App.tsx, src/components/PracticeCard.tsx
  - 创建: src/components/__tests__/App.focus.test.tsx
- **观察**: 计划清晰可执行，专注模式作为「视图状态」而非独立页面，条件渲染逻辑集中在 App.tsx，PracticeCard 通过可选 prop 实现沉浸式样式。ESC 键退出复用了 bugfix-001 的 ref 防 stale closure 模式

### 2026-05-09 (cycle-2026-05-09-9)
- **迭代**: epic-002 iter-003「选择题模式（四选一快速练习）」—— **完整执行**
- **计划步骤**: 6 步全部完成，涵盖类型定义、hook 扩展、组件扩展、App 集成、单元测试、全量验证
- **实际修改文件**: 与计划一致
  - 修改: src/data/types.ts, src/hooks/usePractice.ts, src/components/PracticeCard.tsx, src/App.tsx
  - 创建: src/hooks/__tests__/usePractice.choice.test.ts, src/components/__tests__/PracticeCard.choice.test.tsx, src/components/__tests__/App.choice.test.tsx
- **观察**: 计划清晰可执行，选择题模式的「4 选项生成 + 选中状态 + 提交判定」逻辑在 usePractice hook 中自然扩展，未破坏现有填空/听写模式。可选 props 设计保持了 PracticeCard 的向后兼容。
- **战略指令影响**: dir-urgent-002 要求插入两个紧急迭代，将在下次 PLAN 阶段重新规划

### 2026-05-09 (cycle-2026-05-09-8)
- **迭代**: epic-002 iter-002「音频播放速度控制」—— **完整执行**
- **计划步骤**: 5 步全部完成，涵盖 hook 扩展、组件扩展、App 集成、单元测试、全量验证
- **实际修改文件**: 与计划一致
  - 修改: src/hooks/useSpeech.ts, src/components/PracticeCard.tsx, src/App.tsx
  - 创建: src/hooks/__tests__/useSpeech.rate.test.ts, src/components/__tests__/PracticeCard.speed.test.tsx, src/components/__tests__/App.speed.test.tsx
- **观察**: 计划清晰，五档离散速度的选择比连续滑条更易实现和测试

### 2026-05-09 (cycle-2026-05-09-7)
- **迭代**: epic-002 iter-001「纯听写模式」
- **计划步骤**: 5 步全部完成，涵盖类型定义、组件扩展、App 集成、单元测试、全量验证
- **实际修改文件**: 与计划一致
  - 修改: src/data/types.ts, src/components/PracticeCard.tsx, src/App.tsx
  - 创建: src/components/__tests__/PracticeCard.dictation.test.tsx, src/components/__tests__/App.mode.test.tsx
- **观察**: epic-002 首个迭代作为纯 UI 功能，计划清晰且与数据层零耦合。PracticeMode 类型设计为联合类型，为后续 4 种模式扩展预留了类型空间。ToggleGroup 模式切换的 UX 设计在计划中即考虑了「切换时重置输入」的心流保护

### 2026-05-09 (cycle-2026-05-09-6)
- **迭代**: iter-005「智能复习队列」—— **完整执行**
- **计划步骤**: 7 步全部完成，涵盖类型扩展、存储队列能力、SmartReview 组件、App.tsx 集成、复习调度、单元测试、全量验证
- **实际修改文件**: 与计划一致
  - 修改: src/data/types.ts, src/services/storage.ts, src/App.tsx
  - 创建: src/components/SmartReview.tsx, src/services/__tests__/review-queue.test.ts, src/components/__tests__/SmartReview.test.tsx
- **观察**: iter-005 作为 epic-001 的收尾迭代，计划清晰且算法边界明确。间隔重复算法的 [1,3,7,14] 天参数设计简洁，后续可根据实际使用数据调优。

### 2026-05-09 (cycle-2026-05-09-5)
- **迭代**: iter-005「智能复习队列」
- **计划步骤**: 7 步，涵盖类型扩展、存储队列能力、SmartReview 组件、App.tsx 集成、复习调度、单元测试、全量验证
- **计划特点**: 算法驱动型迭代（间隔重复 [1,3,7,14] 天），与之前数据层迭代有明显差异
- **观察**: iter-005 是 epic-001 的最后一个迭代，计划清晰但涉及算法实现，需特别关注边界情况测试

### 2026-05-09 (cycle-2026-05-09-3)
- **迭代**: iter-004「数据导入导出」
- **计划步骤**: 7 步，涵盖类型定义、存储方法扩展、组件实现、导航集成、单元测试、组件测试、全量验证
- **实际修改文件**: 与计划一致
  - 修改: src/services/storage.ts, src/App.tsx
  - 创建: src/components/DataManager.tsx, src/components/__tests__/DataManager.test.tsx, src/services/__tests__/export-import.test.ts
- **观察**: iter-004 计划清晰，步骤复杂度适中，单一迭代在一个 cycle 内顺利完成。数据导入导出功能涉及用户文件操作，计划中包含了确认对话框和状态反馈的 UX 设计

### 2026-05-09 (cycle-2026-05-09-2)
- **迭代**: iter-002「错题本 MVP」+ iter-003「学习历史记录」
- **计划步骤**: iter-002 共 7 步，iter-003 共 7 步，每步清晰可执行
- **实际修改文件**: 与计划高度一致
- **观察**: iter-002 和 iter-003 均依赖 iter-001 的存储服务基础，计划步骤自然延续了 V1→V2 的扩展路径。两个迭代可以串行执行但代码层面有独立性（mistakes 和 history 是并列的新增 key），实际在一个 cycle 内完成两个迭代效率较高

### 2026-05-09 (cycle-2026-05-09-11)
- **迭代**: epic-002 iter-003b「纯听写模式重新设计」—— **完整执行**
- **计划步骤**: 6 步全部完成，涵盖 PracticeCard dictation 中文可见性、首字母提示渲染、指令文本更新、dictation 测试更新、App.mode 测试更新、全量验证
- **实际修改文件**: 与计划一致
  - 修改: src/components/PracticeCard.tsx, src/components/__tests__/PracticeCard.dictation.test.tsx, src/components/__tests__/App.mode.test.tsx, src/components/__tests__/PracticeCard.choice.test.tsx
- **观察**: 计划清晰可执行，本次迭代是「体验优化型」而非「功能新增型」，步骤聚焦于现有组件的条件渲染逻辑调整和测试断言翻转。用户反馈直接驱动设计变更，改动范围极小但 UX 影响显著

### 2026-05-09 (cycle-2026-05-09-10)
- **迭代**: epic-002 iter-003a「响应式 UI 适配（移动端 + 桌面端）」—— **完整执行**
- **计划步骤**: 13 步全部完成，涵盖设计文档、测试 mock、MobileNav 组件、App.tsx 响应式重构、PracticeCard 触摸优化、各视图响应式适配、ResultModal 适配、CSS 安全区支持、响应式测试、全量验证
- **实际修改文件**: 与计划高度一致
  - 修改: src/App.tsx, src/App.css, src/components/PracticeCard.tsx, src/components/MistakeBook.tsx, src/components/HistoryView.tsx, src/components/SmartReview.tsx, src/components/DataManager.tsx, src/components/ResultModal.tsx, vitest.setup.ts
  - 创建: src/components/MobileNav.tsx, src/components/__tests__/MobileNav.test.tsx, src/components/__tests__/App.responsive.test.tsx, .claude/evolution/responsive-design.md
- **观察**: 计划步骤清晰可执行，13 步覆盖了从设计文档到测试验证的完整响应式改造流程。所有修改均为纯 CSS/Tailwind 工具类调整，无逻辑变更，风险可控

### 2026-05-09 (cycle-2026-05-09-17)
- **迭代**: epic-003 iter-002「连击计数与正向反馈动画」—— **完整执行**
- **计划步骤**: 10 步全部完成，涵盖 useXP streak 扩展、StreakFeedback 组件、XPGainPopup 组件、App.tsx 集成、useXP streak 测试、StreakFeedback 测试、XPGainPopup 测试、App.streak 测试、现有测试 mock 更新、全量验证
- **实际修改文件**: 与计划一致
  - 修改: src/hooks/useXP.ts, src/App.tsx
  - 创建: src/components/StreakFeedback.tsx, src/components/XPGainPopup.tsx, src/hooks/__tests__/useXP.streak.test.ts, src/components/__tests__/StreakFeedback.test.tsx, src/components/__tests__/XPGainPopup.test.tsx, src/components/__tests__/App.streak.test.tsx
  - 更新测试 mock: 7 个现有 App 测试文件
- **观察**: 计划清晰可执行，连击系统作为 XP 系统的自然扩展，与现有架构无冲突。session-only 的 streak 设计避免了持久化复杂度，framer-motion 动画复用已有依赖。10 步计划覆盖了从 hook 扩展 → 组件创建 → App 集成 → 全量测试的完整链路

### 2026-05-09 (cycle-2026-05-09-1)
- **迭代**: iter-001「核心存储服务与会话持久化」
- **计划步骤**: 6 步（创建 storage 服务 → hook 集成 → UI 恢复 → 边界处理 → 单元测试 → hook 测试）
- **实际修改文件**: 与计划一致（storage.ts, storage.test.ts, usePractice.ts, usePractice.test.ts, App.tsx）
- **观察**: 计划步骤清晰可执行，无遗漏关键边界情况
