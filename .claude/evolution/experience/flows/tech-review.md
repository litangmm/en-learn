# tech-review 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

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

### 2026-05-09 (cycle-2026-05-09-1)
- **迭代**: iter-001「核心存储服务与会话持久化」
- **技术决策**: localStorage 优先（符合 MVP 原则），版本化 schema 预留 IndexedDB 迁移空间
- **质量门禁通过**: lint 0 errors, build passed, 72/72 unit tests passed
- **观察**: 纯前端存储方案在当前数据量下完全够用，无需过早引入 IndexedDB 复杂度
