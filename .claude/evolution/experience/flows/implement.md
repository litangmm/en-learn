# implement 流程经验

## 有效模式
（由进化引擎自动总结）

## 常见问题
（由进化引擎自动总结）

## 历史数据

### 2026-05-09 (cycle-2026-05-09-9)
- **迭代**: epic-002 iter-003「选择题模式（四选一快速练习）」—— **完整实现**
- **实现质量**: 高 — 状态机扩展自然，UI 条件渲染清晰
- **关键决策**:
  - usePractice hook 中 options 使用 useMemo 从完整词典（非仅 shuffled 的 10 条）排除当前句后随机取 3 个干扰项，确保选项多样性
  - checkAnswer 在选择题模式下传入 selectedOptionId，答对得 10 分（无尝试惩罚），答错记录到 pendingMistakes
  - PracticeCard 通过可选 props（options/selectedChoiceId/onSelectChoice）实现向后兼容，填空/听写模式零变更
  - 选择题模式下提交按钮在选中前禁用，showResult 后无重试仅下一题（一击即走模式）
  - App.tsx ToggleGroup 扩展为三模式，auto-play 延迟 500ms（介于填空 800ms 和听写 300ms 之间）
- **观察**: 三种模式共享同一套 usePractice 状态机，状态切换通过 mode 条件分支处理。当前 3 种模式仍可通过 if/else 管理，但 4+ 模式时强烈建议重构为配置驱动的渲染策略。

### 2026-05-09 (cycle-2026-05-09-8)
- **迭代**: epic-002 iter-002「音频播放速度控制」—— **完整实现**
- **实现质量**: 高 — API 设计简洁，向后兼容
- **关键决策**:
  - useSpeech hook 保留 `speak(text, rate?)` 的 rate 覆盖参数，确保向后兼容
  - SPEEDS 常量 [0.5, 0.75, 1.0, 1.25, 1.5] 定义为离散选择，降低实现复杂度
  - PracticeCard Header 中速度选择器始终可见（包括 showResult 时），不干扰结果查看
  - App.tsx 移除所有硬编码速率，统一使用用户选择的 playbackRate
- **观察**: 零新增依赖，零构建体积增长

### 2026-05-09 (cycle-2026-05-09-7)
- **迭代**: epic-002 iter-001「纯听写模式」—— **完整实现**
- **实现质量**: 高 — 类型设计清晰，UI 条件渲染逻辑简洁
- **关键决策**:
  - PracticeMode 采用联合类型 `'fill-in-blanks' | 'dictation'`，后续可自然扩展新模式
  - PracticeCard dictation 模式下隐藏 chinese 翻译和英文句子文本，showResult 时揭示全部内容供核对
  - 音频按钮在 dictation 模式下使用蓝色 filled 样式增大视觉权重，符合心流设计
  - dictation 模式自动播放延迟缩短至 300ms（vs fill-in-blanks 的 800ms），减少等待摩擦
  - 模式切换时调用 initializeInputs() 重置当前输入，避免模式间状态污染
- **观察**: 纯 UI 迭代的实现复杂度较低，但条件渲染逻辑的维护成本会随模式数量增加。当前 2 种模式通过 if/else 管理仍可接受，4+ 模式时建议提取为策略模式或配置对象

### 2026-05-09 (cycle-2026-05-09-6)
- **迭代**: iter-005「智能复习队列」—— **完整实现**
- **实现质量**: 高 — 算法实现严谨，UI 交互清晰
- **关键决策**:
  - Mistake 类型扩展采用可选字段，确保旧数据向后兼容
  - scheduleNextReview 使用 [1,3,7,14] 天间隔数组，正确答题递增 reviewedCount，错误答题重置间隔为 1 天但保留 reviewedCount
  - SmartReview 组件按 dictionaryId 分组加载和展示，复用 MistakeBook 的异步词典加载模式
  - App.tsx 使用 processedReviewRef 防止 retry 导致的重复调度，useEffect 监听 showResult 自动触发 scheduleNextReview
  - 复习模式通过 isReviewMode state 标记，与正常练习模式共用 practice 视图但数据源不同
- **观察**: 算法型迭代的实现需要特别关注边界情况（reviewedCount 超限、时区、重复调度），iter-005 通过 ref 防抖和 comprehensive 单元测试有效覆盖了这些边界

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
