# QA 经验档案

## 角色定义
- **性格**：挑剔、边界思维
- **关注**：浏览器兼容性、语音API差异、学习数据一致性
- **风格**："那如果用户这样操作..."

## 历史提案

### 2026-05-09 (cycle-2026-05-09-16)
- **相关质量门禁**: 单元测试回归、边界情况自动化测试、构建稳定性
- **本次验证**: epic-003 iter-001「XP 积分与等级系统」质量门禁验证
  - xp-storage 测试：getXPProfile 默认回退、有效/损坏数据恢复、addXP 增量计算、12 级阈值边界（0, 100, 250...4000）、进度百分比精度、最大等级 100% 封顶、exportAllData 包含 xpProfile、importAllData 校验 xpProfile
  - useXP 测试：懒加载初始化、addXP 状态更新、firstTry 奖励（+5）、等级升级反射、resetXPProfile
  - App.xp 测试：XPBar header 渲染、正确答题触发 addXP、firstTry 奖励触发、错误答题不触发、同一题防重复奖励、focus mode XPBar 渲染
  - 全量回归：**318/318 单元测试通过**（32 测试文件，历史新高位），lint 0 errors（3 pre-existing warnings），build 成功
- **备注**: 本次迭代新增 34 个专用测试，覆盖「profile CRUD → 等级计算（全部 12 级边界）→ 进度百分比 → 首试奖励 → 防重复 → export/import」完整链路。318 测试是项目历史新高位。9 个现有测试文件因 storage XP 方法 mock 更新，零行为回归。QA 注意到动画/过渡效果在 jsdom 环境中测试受限，后续 iter-002（连击动画）需要探索 CSS transition 的测试策略

### 2026-05-09 (cycle-2026-05-09-14)
- **相关质量门禁**: 单元测试回归、交互行为一致性、构建稳定性
- **本次验证**: epic-002 iter-005「连词成句模式（拖拽/点击排序）」质量门禁验证
  - usePractice reorder 测试：sentenceTokens 生成（分词数量、id、text）、selectToken 追加、deslectToken 按索引移除、resetTokens 清空、checkAnswer 正确顺序得 10 分、checkAnswer 错误顺序记录错题、nextSentence/reset 清空 orderedTokenIds
  - PracticeCard reorder 测试：word pool 和空 answer zone 渲染、点击 token 移动到 answer zone、点击 answer token 返回 pool、submit 全选前禁用、正确答案显示成功反馈、错误答案显示正确句子
  - App reorder 测试：四模式 ToggleGroup（连词成句）、sentence-reorder 模式 DOM 变化、模式切换清空状态、500ms auto-play 延迟
  - 全量回归：**282/282 单元测试通过**（29 测试文件，历史新高位），lint 0 errors（3 pre-existing warnings），build 成功
- **备注**: 本次迭代新增 19 个专用测试，覆盖「token 生成 → 选词交互 → 提交校验 → 正误反馈 → 状态重置」完整链路。282 测试是项目历史新高位。4 个现有测试文件因 PracticeState 新增 orderedTokenIds 字段而更新，零行为回归

### 2026-05-09 (cycle-2026-05-09-13)
- **相关质量门禁**: 单元测试回归、交互行为一致性、构建稳定性
- **本次验证**: epic-002 iter-004「专注模式（全屏无干扰 UI）」质量门禁验证
  - App.focus 测试：入口按钮渲染、点击进入专注模式（Header/ToggleGroup/hint/MobileNav 隐藏，极简进度条可见）、退出按钮恢复普通 UI、ESC 键退出专注模式、输入框中 ESC 被忽略不触发退出、PracticeCard 在专注模式下保持交互性
  - 全量回归：262/262 单元测试通过，lint 0 errors（3 pre-existing warnings），build 成功
- **备注**: 本次迭代的测试覆盖了「进入 → 状态验证 → 退出 → 键盘交互」的完整用户流程。专注模式作为一种「视图状态」而非独立页面，测试策略聚焦于条件渲染的正确性，与之前视图切换测试策略一致。262 个测试是项目历史最新高水位

### 2026-05-09 (cycle-2026-05-09-11)
- **相关质量门禁**: 单元测试回归、断言更新一致性、构建稳定性
- **本次验证**: epic-002 iter-003b「纯听写模式重新设计」质量门禁验证
  - PracticeCard dictation 测试：中文翻译可见性断言从 `not.toBeInTheDocument()` 翻转为 `toBeInTheDocument()`，验证新的 UX 设计
  - 首字母提示测试：验证 renderDictationInputs 中首字母 + 省略号（如 `c...`）的正确渲染
  - App.mode 测试：验证 dictation 模式下中文翻译保持可见
  - PracticeCard.choice 测试：修复 dictation 渲染辅助测试中的中文可见性断言
  - 全量回归：256/256 单元测试通过，lint 0 errors（3 pre-existing warnings），build 成功
- **备注**: 本次迭代的测试更新模式（翻转现有断言 + 新增断言）展示了 UX 变更时测试维护的最佳实践——修改测试以反映新行为，而非删除旧测试。所有 3 个测试文件的更新保持了一致性

### 2026-05-09 (cycle-2026-05-09-10)
- **相关质量门禁**: 响应式测试覆盖、触摸目标可访问性、跨断点一致性、构建体积监控
- **本次验证**: epic-002 iter-003a「响应式 UI 适配（移动端 + 桌面端）」质量门禁验证
  - MobileNav 测试：5 个导航项渲染（图标+标签）、当前视图激活态高亮、onNavigate 回调参数正确、数量徽章显示、md:hidden 响应式类名
  - App.responsive 测试：MobileNav 条件渲染（移动端显示/桌面端隐藏）、桌面导航 hidden 类、DictionarySelector 在移动端主内容区渲染、主内容区 pb-20 底部 padding
  - 全量回归：255/255 单元测试通过，lint 0 errors（3 pre-existing warnings），build 成功
- **备注**: 响应式测试通过 mock window.matchMedia 在 jsdom 环境中模拟断点，确保了响应式逻辑的测试覆盖。首次引入响应式测试基线，为后续所有迭代的移动端兼容性提供了回归保障

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

### 2026-05-09 (cycle-2026-05-09-17)
- **相关质量门禁**: 单元测试回归、动画组件测试、构建稳定性
- **本次验证**: epic-003 iter-002「连击计数与正向反馈动画」质量门禁验证
  - useXP streak 测试：streak 递增、wrong 重置、max 跟踪、倍率边界（2→3, 4→5, 9→10）、addXP 倍率集成、返回对象、resetStreak 保留 max、firstTry+multiplier 组合
  - StreakFeedback 测试：streak <2 隐藏、icon/count 渲染、amber/red/purple 颜色类、连击标签、visible=false、motion.div
  - XPGainPopup 测试：invisible 隐藏、amount 显示、倍率徽章条件、triggerKey 更新
  - App.streak 测试：header badge DOM、recordCorrectAnswer 调用、recordWrongAnswer 调用、XP popup 触发、resetStreak 调用、focus mode badge
  - 全量回归：**348/348 单元测试通过**（36 测试文件，历史新高位），lint 0 errors（3 pre-existing warnings），build 成功
- **备注**: 本次迭代新增 30 个专用测试，覆盖「连击状态 → 倍率计算 → 组件渲染 → App 集成 → 动画触发」完整链路。348 测试是项目历史新高位。7 个现有 App 测试文件因 useXP 新导出而更新 mock，零行为回归。动画组件通过 data-testid 和 aria 属性测试，CSS transition 的 jsdom 限制通过条件渲染断言绕过

## 改进方向
（由进化引擎自动总结）
