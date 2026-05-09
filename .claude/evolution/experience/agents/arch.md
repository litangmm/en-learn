# ARCH 经验档案

## 角色定义
- **性格**：谨慎、系统性思维
- **关注**：前端架构、构建优化、PWA、大词典加载性能
- **风格**："从架构角度看，这个方案需要..."

## 历史提案

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

## 成功模式
（由进化引擎自动总结）

## 失败教训
（由进化引擎自动总结）

## 反思记录

### 2026-05-09 (cycle-2026-05-09-5) — 连续 4 次未被选中
- **反思**: epic-004 的 PWA 化与 epic-001 的数据持久化有天然的技术关联（service worker 缓存策略与 localStorage 数据同步）。等待 epic-001 完全完成再启动 PWA 可能错失技术验证时机。ARCH 应在下次 brainstorm 中提出「渐进式 PWA」方案——从简单的 manifest 和离线页面壳开始，而非等待全部数据架构稳定
- **建议**: 将 epic-004 拆分为「应用壳先行」和「数据同步跟进」两个子阶段，降低等待成本
- **状态**: epic-001 完成后，epic-004 应为中等优先级候选

## 改进方向
（由进化引擎自动总结）
