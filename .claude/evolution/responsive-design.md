# 响应式设计规范

## 断点定义

| 断点 | 范围 | 设备类型 |
|------|------|----------|
| Mobile | < 768px | 手机、小平板 |
| Desktop | >= 768px | 平板横屏、桌面 |

使用 Tailwind 的 `md:` 前缀作为分界：`md:hidden` 表示移动端显示、桌面隐藏；`hidden md:block` 表示桌面显示、移动端隐藏。

## 触控目标

- 最小触控目标尺寸：**44px**
- 按钮、输入框、选项卡片在移动端使用更大的内边距和高度
- 底部导航栏每个 item 高度不低于 56px

## 间距 Token

| Token | Mobile | Desktop |
|-------|--------|---------|
| 页面水平边距 | px-3 / px-4 | px-4 |
| 页面垂直边距 | py-4 | py-8 |
| 卡片内边距 | p-4 | p-6 |
| 底部导航 clearance | pb-20 | pb-0 |

## 组件规范

### MobileNav
- 固定底部 (`fixed bottom-0 left-0 right-0`)
- 仅在移动端显示 (`md:hidden`)
- 5 个导航项，每项包含图标 + 文字标签
- 当前项高亮（蓝色图标 + 文字）
- 非当前项灰色
- `safe-area-inset-bottom` 适配 iPhone 底部横条

### Header
- 桌面端：完整导航按钮 + DictionarySelector + 重置按钮
- 移动端：仅 logo + 得分，导航按钮隐藏

### PracticeCard
- 输入框移动端：`h-11` (44px) vs 桌面端 `h-10`
- 输入框宽度移动端：`w-28` vs 桌面端 `w-32`
- 内容区 padding：`p-4 md:p-6`
- 英文句子字体：`text-lg md:text-xl`
- 行高：`leading-relaxed md:leading-loose`
- 中文翻译：`text-base md:text-lg`
- 速度选择器：`h-9 md:h-8`

### 列表/卡片视图
- MistakeBook / HistoryView / SmartReview / DataManager
- 容器 padding：`px-3 md:px-4 py-4 md:py-8`
- 移动端答案区纵向堆叠 (`flex-col sm:flex-row`)
- 统计信息使用 `flex flex-wrap gap-3 md:gap-6`

### ResultModal
- 外层添加 `mx-auto px-4` 保证安全边距
- 统计 grid：`grid-cols-1 sm:grid-cols-3`
- Header padding：`px-6 py-6 md:px-8 md:py-8`
- Content padding：`p-4 md:p-8`

## 未来迭代遵循原则

1. 所有新组件必须同时考虑 mobile + desktop
2. 默认用移动端尺寸，桌面端用 `md:` 覆盖
3. 触控目标不低于 44px
4. 避免在移动端使用 hover 态作为主要交互反馈
5. 底部固定元素必须考虑 `safe-area-inset-bottom`
