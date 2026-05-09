# implement 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

### 2026-05-09 (cycle-2026-05-09-5)
- **迭代**: iter-005「智能复习队列」
- **实现进度**: Step 1 完成 — Mistake 类型扩展（nextReviewAt/lastReviewedAt 可选字段）
- **关键决策**: 保持向后兼容，旧数据无新字段仍视为合法；可选字段设计为后续 scheduleNextReview 算法提供数据结构基础
- **观察**: 类型层变更是后续所有算法和 UI 的前提，需确保类型定义与存储校验（isValidMistake）同步更新

### 2026-05-09 (cycle-2026-05-09-3)
- **迭代**: iter-004「数据导入导出」
- **实现质量**: 高 — 校验严谨，用户体验完善
- **关键决策**:
  - ExportData 定义在 storage.ts 内避免循环依赖
  - isValidExportData 递归校验各子结构（session/mistakes/history），拒绝任何非法输入
  - importAllData 返回结构化结果（success + importedCounts + message），便于 UI 展示
  - DataManager 组件使用 hidden input 触发文件选择，blob URL 实现浏览器下载，无需外部依赖
  - 导入前确认对话框 + 成功/失败 inline alert，用户操作有明确反馈
- **观察**: 数据导入导出是首个涉及文件 I/O 的迭代，测试需要 mock URL.createObjectURL 和 anchor click，测试模式为后续文件操作功能提供了参考

### 2026-05-09 (cycle-2026-05-09-2)
- **迭代**: iter-002「错题本 MVP」+ iter-003「学习历史记录」
- **实现质量**: 高 — 代码结构清晰，边界处理完善
- **关键决策**:
  - 错题去重使用 sentenceId 作为 key，避免重复记录同一错题
  - 错题练习模式通过 sentenceIds 参数复用现有 usePractice hook，最小化代码变更
  - 历史记录自动上限 100 条（可配置），超限移除最旧
  - isValidHistory 校验过滤非法数据，防止 corrupted entry 污染列表
- **观察**: 两个迭代的实现均遵循了 iter-001 确立的存储服务设计模式（单例、版本化、降级恢复），代码一致性高

### 2026-05-09 (cycle-2026-05-09-1)
- **迭代**: iter-001「核心存储服务与会话持久化」
- **实现质量**: 高 — 代码结构清晰，错误处理完善
- **关键决策**: 使用单例模式封装 localStorage；500ms debounce 保存；版本化 schema 预留迁移空间
- **观察**: 边界情况处理充分（corrupted JSON, quota exceeded, version mismatch）
