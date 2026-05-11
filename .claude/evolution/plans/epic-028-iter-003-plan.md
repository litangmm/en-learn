# epic-028 iter-003 每日复习计划与提醒系统

## 设计目标

将现有 SmartReview 从"被动查看"升级为"主动计划体验"：
- 清晰展示今日应复习数量和预计时长
- 头部区域有醒目提醒（类似每日挑战 trophy 徽章）
- 完成全部复习后有庆祝反馈
- 追踪连续复习天数（复习连续榜）

## 核心功能

### 1. 复习提醒系统
- Header 区域增加复习到期数量指示器（类似 unclaimedCount 在 Trophy 按钮上的样式）
- MoreMenu 中的复习入口显示到期数量
- 数字徽章使用 `reviewDueCount`

### 2. 每日复习计划面板 (DailyReviewPlan)
新建 `src/components/DailyReviewPlan.tsx`：
- 复习到期数量 + 预计时长（假设每题 2 分钟）
- 按优先级排序（今日到期 > 高优先级 > 普通）
- 快速开始按钮（调用 onPracticeReview）
- 复习连续天数（来自新存储的 reviewStreak 数据）
- 完成后庆祝动画（类似 Challenge 完成后的奖励）

### 3. 复习连续系统
扩展存储层：
- 新增 `DAILY_REVIEW_STATS_KEY` 存储 `DailyReviewStats`
- 包含 `currentStreak`, `longestStreak`, `lastReviewDate`, `totalReviewsToday`
- 打开 App 时检查昨天是否完成复习，更新 streak

### 4. 完成反馈
- 当日全部到期复习完成时，显示庆祝 toast 或动画
- 复习连续天数 +1

## 技术实现

### 文件变更

**修改**:
- `src/data/types.ts` - 添加 DailyReviewStats 类型
- `src/services/storage.ts` - 添加复习连续数据存储方法
- `src/App.tsx` - 集成 DailyReviewPlan 到 header/menu，添加 review streak 状态

**新增**:
- `src/components/DailyReviewPlan.tsx` - 每日复习计划面板
- `src/hooks/useReviewStreak.ts` - 复习连续天数 hook
- `src/components/__tests__/DailyReviewPlan.test.tsx` - 组件测试
- `src/hooks/__tests__/useReviewStreak.test.ts` - hook 测试

### 关键类型

```typescript
interface DailyReviewStats {
  currentStreak: number;        // 当前连续天数
  longestStreak: number;        // 历史最长连续天数
  lastReviewDate: string;       // 上次完成复习的日期 (YYYY-MM-DD)
  totalReviewsToday: number;    // 今日已完成复习数量
  completedToday: boolean;      // 今日是否已完成
}
```

### 测试策略

1. **useReviewStreak 测试**:
   - 首次使用初始化
   - 新日期重置 totalReviewsToday
   - 连续天数计算正确
   - 完成复习更新 streak

2. **DailyReviewPlan 测试**:
   - 空状态（无到期复习）
   - 有到期复习显示
   - 预计时长计算
   - 复习完成状态
   - 连续天数显示

3. **App 集成测试**:
   - Header 显示复习到期数
   - 复习完成触发庆祝