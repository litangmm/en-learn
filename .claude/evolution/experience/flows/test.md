# test 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

### 2026-05-09 (cycle-2026-05-09-2)
- **迭代**: iter-002「错题本 MVP」+ iter-003「学习历史记录」
- **测试覆盖**: 131/131 单元测试通过（新增 59 个测试）
  - mistake-storage.test.ts: 18 个测试（add/get/remove/clear/dedup/reviewedCount/corrupted recovery）
  - history-storage.test.ts: 18 个测试（add/get/clear/limit truncation/corrupted recovery/validation）
  - MistakeBook.test.tsx: 7 个测试（渲染/删除/标记复习/练习按钮）
  - HistoryView.test.tsx: 8 个测试（空状态/日期分组/清空交互）
  - usePractice.test.ts: 补充 8 个测试（错题捕获 4 + history 记录 4）
- **E2E**: skipped（非最后 pending iteration）
- **观察**: 新增组件测试使用了统一的渲染辅助函数和 mock 模式，测试风格与已有测试保持一致。Audio 和 speechSynthesis 的全局 mock 在 vitest.setup.ts 中配置，避免了每个测试文件重复 mock

### 2026-05-09 (cycle-2026-05-09-1)
- **迭代**: iter-001「核心存储服务与会话持久化」
- **测试覆盖**: 72/72 单元测试通过
  - storage.test.ts: 15 个测试（save/load roundtrip, 版本迁移, corrupted data 恢复, quota exceeded）
  - usePractice.test.ts: 22 个测试（恢复 persisted state, 保存触发, dictionary 切换清理）
- **E2E**: skipped（非最后 pending iteration）
- **观察**: 测试策略有效，关键边界均有覆盖
