# QA 经验档案

## 角色定义
- **性格**：挑剔、边界思维
- **关注**：浏览器兼容性、语音API差异、学习数据一致性
- **风格**："那如果用户这样操作..."

## 历史提案

### 2026-05-09 (cycle-2026-05-09-9)
- **相关质量门禁**: 语音 API 兼容性、localStorage 数据完整性、跨浏览器测试、边界情况自动化测试、构建体积监控
- **本次验证**: epic-002 iter-003「选择题模式（四选一快速练习）」质量门禁验证
  - usePractice choice 测试：options 生成（4 选项含正确答案）、selectChoice 状态更新、checkAnswer 正确 ID（10 分）、checkAnswer 错误 ID（记录错题）、nextSentence/reset 重置 selectedChoiceId
  - PracticeCard choice 测试：4 选项渲染、选项点击回调、提交按钮禁用逻辑（选中前禁用，选中后启用）、showResult 正确选项绿色高亮、错误选中项红色高亮、未选中默认样式、错误后无重试仅下一题
  - App choice 测试：三模式 ToggleGroup、选择题模式 DOM、initializeInputs 模式切换触发、options props 传递、500ms auto-play 延迟
  - 全量回归：240/240 单元测试通过，lint 0 errors（3 pre-existing warnings），build 成功
- **备注**: 选择题模式的干扰项生成使用 Math.random，测试中通过 mock 确保可预测。三种模式的回归测试全部通过，无交叉污染。但 QA 注意到当前 UI 无移动端适配，后续需增加响应式测试覆盖

### 2026-05-09 (cycle-2026-05-09-8)
- **相关质量门禁**: 语音 API 兼容性、localStorage 数据完整性、跨浏览器测试、边界情况自动化测试、构建体积监控
- **本次验证**: epic-002 iter-002「音频播放速度控制」质量门禁验证
  - useSpeech rate 测试：playbackRate 默认 1.0、setPlaybackRate 状态更新、speak 未传 rate 时使用 playbackRate、speak 传 rate 时覆盖 playbackRate
  - PracticeCard speed 测试：五档速度渲染、条件渲染（无 onSpeedChange 时不渲染）、当前速度高亮、点击回调参数正确、dictation 模式可见、showResult 时可见
  - App speed 测试：默认 1.0x 选中、setPlaybackRate 被调用、auto-play 使用 playbackRate 无硬编码值
  - 全量回归：219/219 单元测试通过，lint 0 errors，build 成功
- **备注**: iter-002 的向后兼容设计（speak 保留 rate 覆盖参数）经测试验证无回归。useSpeech 默认速率从 0.9 调整为 1.0 的变更已同步更新现有测试

### 2026-05-09 (cycle-2026-05-09-7)
- **相关质量门禁**: 语音 API 兼容性、localStorage 数据完整性、跨浏览器测试、边界情况自动化测试、构建体积监控
- **本次验证**: epic-002 iter-001「纯听写模式」质量门禁验证
  - PracticeCard dictation 模式测试：中文隐藏、英文文本隐藏、输入框渲染、showResult 揭示全部内容
  - App 模式切换测试：ToggleGroup 渲染、切换触发 initializeInputs、dictation 模式 DOM 变化
  - 全量回归：205/205 单元测试通过，lint 0 errors，build 成功
- **备注**: QA 首次独立提出 Epic（epic-010「质量基础设施升级」），虽被列为 background task，但反映了 QA 对自动化测试覆盖不足的长期关注

### 2026-05-09 (cycle-2026-05-09-6)
- **相关质量门禁**: 语音 API 兼容性、localStorage 数据完整性、跨浏览器测试、边界情况自动化测试
- **本次验证**: iter-005「智能复习队列」完整质量门禁验证
  - 间隔重复算法边界测试：scheduleNextReview 覆盖 reviewedCount 0→1 天、1→3 天、2→7 天、3+→14 天、错误答题重置 1 天、不存在的 sentenceId 安全无操作
  - 类型兼容性：isValidMistake 对旧数据（无新字段）和新数据（有合法字段）均通过，错误类型拒绝
  - 队列筛选排序：getReviewQueue 空队列、到期/未到期筛选、按 nextReviewAt 升序排列
  - 累计 189/189 单元测试通过（15 个测试文件）
- **备注**: iter-005 的算法测试为后续 epic-008 自适应学习算法的测试策略提供了参考模式

### 2026-05-09 (cycle-2026-05-09-5)
- **相关质量门禁**: 语音 API 兼容性、localStorage 数据完整性、跨浏览器测试、边界情况自动化测试
- **本次验证**: iter-005 Step 1 中质量门禁持续生效
  - 类型向后兼容：Mistake 接口新增 nextReviewAt/lastReviewedAt 可选字段，旧数据无字段仍视为合法
  - 累计 165/165 单元测试通过
- **备注**: iter-005 的 scheduleNextReview 间隔算法需要边界测试覆盖（reviewedCount 超限、负数时间、时区边界）

### 2026-05-09 (cycle-2026-05-09-3)
- **相关质量门禁**: 语音 API 兼容性、localStorage 数据完整性、跨浏览器测试、边界情况自动化测试
- **本次验证**: iter-004 中质量门禁持续生效，新增门禁已落实
  - 数据导入校验：isValidExportData 递归校验 version、exportedAt、data 结构及各子项合法性，拒绝非法 schema 和非 JSON 输入
  - 数据覆盖保护：导入前确认对话框，防止误操作覆盖现有数据
  - XSS 防护：JSON 导入不执行脚本，纯数据解析
  - 累计 159/159 单元测试通过（新增 28 个测试）
- **备注**: iter-004 的校验逻辑为后续自定义词典导入（CSV/JSON）奠定了格式校验模式

### 2026-05-09 (cycle-2026-05-09-2)
- **相关质量门禁**: 语音 API 兼容性、localStorage 数据完整性、跨浏览器测试、边界情况自动化测试
- **本次验证**: iter-002/003 中所有质量门禁持续生效
  - localStorage 损坏恢复：mistakes 和 history 均实现了 corrupted JSON 降级（清除损坏 key，保留其他数据）
  - 边界测试：100 条历史上限截断、错题去重、非法 history 过滤、V1→V2 迁移
  - 累计 131/131 单元测试通过
- **备注**: QA 的质量门禁设计在 iter-002/003 中证明有效，未来 iter-004 数据导入导出需增加格式校验和 XSS 防护门禁

### 2026-05-09 (cycle-2026-05-09-1)
- **提案**: 未单独提出 Epic，贡献质量门禁
- **质量门禁**: 语音 API 兼容性检测与降级、localStorage 数据完整性保护、跨浏览器测试覆盖、边界情况自动化测试
- **结果**: QA 的稳定性保障被判定为跨 Epic 质量门禁，不单独列为 Epic
- **备注**: 提出的 localStorage 数据完整性保护已在 iter-001 中实现（损坏恢复、版本迁移、quota exceeded 处理）

## 成功模式
（由进化引擎自动总结）

## 失败教训
（由进化引擎自动总结）

## 改进方向
（由进化引擎自动总结）
