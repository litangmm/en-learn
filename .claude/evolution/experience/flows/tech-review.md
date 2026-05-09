# tech-review 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

### 2026-05-09 (cycle-2026-05-09-2)
- **迭代**: iter-002「错题本 MVP」+ iter-003「学习历史记录」
- **技术决策**:
  - 继续使用 localStorage（符合 MVP 原则），3 个 key 架构（session/mistakes/history）在容量允许范围内
  - V2 schema 向后兼容 V1，通过 loadSession 时自动迁移 pendingMistakes
  - 历史记录上限 100 条平衡了数据完整性和存储容量
  - usePractice hook 的 sentenceIds 参数实现了错题练习模式的优雅复用
- **质量门禁通过**: lint 0 errors, build passed, 131/131 unit tests passed
- **观察**: 两个迭代的技术决策均保持了与 iter-001 的一致性，没有出现架构偏离。组件层的视图切换逻辑（App.tsx）开始变得复杂（3 个视图），后续迭代需关注导航的可扩展性

### 2026-05-09 (cycle-2026-05-09-1)
- **迭代**: iter-001「核心存储服务与会话持久化」
- **技术决策**: localStorage 优先（符合 MVP 原则），版本化 schema 预留 IndexedDB 迁移空间
- **质量门禁通过**: lint 0 errors, build passed, 72/72 unit tests passed
- **观察**: 纯前端存储方案在当前数据量下完全够用，无需过早引入 IndexedDB 复杂度
