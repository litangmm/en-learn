# brainstorm 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

### 2026-05-09 (cycle-2026-05-09-13)
- **状态**: 本次未进行 brainstorm（epic-002 仍有 pending iterations）
- **原因**: epic-002 仍有 pending iteration（iter-005 连词成句），直接继续执行
- **观察**: epic-002 iter-004 专注模式已完成，仅剩 iter-005。多个 Agent 连续未被选中（最长 11 次），下次 epic-002 完成后 brainstorm 时需重点关注这些 Agent 的反思记录和策略调整

### 2026-05-09 (cycle-2026-05-09-9)
- **状态**: 本次未进行 brainstorm（epic-002 仍有 pending iterations）
- **原因**: epic-002 仍有 pending iterations（iter-004, iter-005），直接继续执行。但收到两条高优先级战略指令（dir-urgent-002），要求在 iter-003 后、iter-004 前插入两个紧急迭代
- **战略指令执行**: dir-urgent-002 已接收，将在下次 PLAN 阶段插入两个紧急迭代：
  - 紧急迭代 A：响应式 UI 适配（移动端 + 桌面端）
  - 紧急迭代 B：纯听写模式重新设计
- **观察**: 战略指令反映了用户的实际体验反馈（纯听写模式无法使用）和架构判断（响应式基础不做，后续全部返工）。这是进化流程首次在 Epic 执行中插入紧急迭代，验证了 bidirectional communication protocol 的有效性。插入后 epic-002 的迭代顺序变为：iter-001(完成) → iter-002(完成) → iter-003(完成) → iter-003a(响应式UI) → iter-003b(听写重设计) → iter-004(专注模式) → iter-005(连词成句)

### 2026-05-09 (cycle-2026-05-09-8)
- **状态**: 本次未进行 brainstorm（epic-002 仍有 pending iterations）
- **原因**: epic-002 仍有 pending iteration（iter-003），直接继续执行
- **观察**: epic-002 的 iter-002 完成，iter-003 正在执行。多个 Agent 连续未被选中（最长 7 次），但 epic-002 尚未完成，暂不触发 brainstorm

### 2026-05-09 (cycle-2026-05-09-7)
- **状态**: 全新 brainstorm（epic-001 全部完成后首次）
- **参与 Agent**: 9 个（PM-Lean, PM-UX, PM-Mon, PM-Growth, PM-Eco, ARCH, UX, QA, EXP）
- **产出 Epic**: 8 个（含 1 个新增 epic-010 QA 质量基础设施）
- **选中 Epic**: epic-002（PM-UX 提出，6 个角色支持）
- **观察**: epic-001 全部 6 个迭代完成后，所有 Agent 对 epic-002『沉浸式多模态练习模式』作为下一优先级达成高度共识。PM-UX 连续 5 个 cycle 未被选中后，其反思建议（拆分数据无关/数据依赖子功能）被采纳。PM-Growth 的分享卡片 MVP、ARCH 的渐进式 PWA、PM-Eco 的个人数据主权重新定位、EXP 的纯前端自适应算法，均体现了 Agent 反思后的策略调整。QA 首次独立提出 Epic（质量基础设施升级），但被明确列为 background task。

### 2026-05-09 (cycle-2026-05-09-6)

### 2026-05-09 (cycle-2026-05-09-6)
- **状态**: 本次未进行 brainstorm（epic-001 最后一个迭代 iter-005 执行中）
- **原因**: epic-001 仍有 pending iteration（iter-005），直接继续执行
- **观察**: epic-001 已完成全部 6 个迭代，下次 cycle 将触发全新 brainstorm。连续 5 个 cycle 沿用同一 brainstorm 结果。多个 Agent 连续未被选中（最长 5 次），下次 brainstorm 时需关注这些 Agent 的反思记录。

### 2026-05-09 (cycle-2026-05-09-5)
- **状态**: 本次未进行 brainstorm（沿用 cycle-2026-05-09-1 结果）
- **原因**: epic-001 仍有 pending iteration（iter-005），直接继续执行
- **观察**: 连续 4 个 cycle 沿用同一 brainstorm 结果。多个 Agent 连续未被选中（最长 4 次），下次 epic-001 完成后 brainstorm 时，需关注这些 Agent 的反思记录和调整后的提案方向

### 2026-05-09 (cycle-2026-05-09-3)
- **状态**: 本次未进行 brainstorm（沿用 cycle-2026-05-09-1 结果）
- **原因**: epic-001 仍有 pending iterations（iter-004, iter-005），直接继续执行
- **观察**: 连续 3 个 cycle 沿用同一 brainstorm 结果，epic-001 按顺序执行的策略验证成功。下一个 cycle 若 epic-001 完成，将重新触发 brainstorm

### 2026-05-09 (cycle-2026-05-09-2)
- **状态**: 本次未进行 brainstorm（沿用 cycle-2026-05-09-1 结果）
- **原因**: epic-001 仍有 pending iterations，直接继续执行
- **观察**: 无需重复 brainstorm 节省了时间，epic-001 的 5 个迭代按顺序执行，流程顺畅

### 2026-05-09 (cycle-2026-05-09-10)
- **状态**: 本次未进行 brainstorm（epic-002 仍有 pending iterations）
- **原因**: epic-002 仍有 pending iterations（iter-003b, iter-004, iter-005），直接继续执行
- **战略指令影响**: dir-urgent-002 插入的两个紧急迭代（iter-003a 响应式UI + iter-003b 听写重设计）已在 iter-003a 中完成，iter-003b 将在下个 cycle 执行
- **观察**: 连续 4 个 cycle 沿用 epic-002 的 brainstorm 结果。多个 Agent 连续未被选中（最长 9 次），下次 epic-002 完成后 brainstorm 时需重点关注这些 Agent 的反思记录和策略调整

### 2026-05-09 (cycle-2026-05-09-1)
- **参与 Agent**: 9 个（PM-Lean, PM-UX, PM-Mon, PM-Growth, PM-Eco, ARCH, UX, QA, EXP）
- **产出 Epic**: 8 个
- **选中 Epic**: epic-001（PM-Lean 提出，全员一致支持）
- **观察**: 第一轮 brainstorm 中，所有 Agent 对「数据基础优先」达成共识，没有显著分歧
