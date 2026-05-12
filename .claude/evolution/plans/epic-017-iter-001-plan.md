# Epic-017 iter-001: App.tsx 配置提取

## 目标
将 App.tsx (~973 行) 的配置逻辑抽取为独立模块，降低组件复杂度。

## 计划

### Step 1: 创建 appHelpers.ts
提取无依赖的纯函数：
- `getModeHint(mode)` → 模式提示文案
- `formatElapsedTime(timestamp)` → 时间格式化

### Step 2: 创建 useAppConfig.ts (hooks)
状态定义和初始化逻辑：
- 所有 `useState` 声明及其类型
- 组件级别常量（如 onboarding dictionaries）
- 派生状态计算（如 currentDict）

### Step 3: 创建 useAppHandlers.ts (hooks)
事件处理器提取：
- 所有 `handle*` 函数（handleDictionaryChange, handleRestart, etc.）
- 导航处理器（handleNavigate）
- 对话框控制函数

### Step 4: 重构 App.tsx
使用提取的模块重构主组件：
```typescript
// Before: ~973 lines
// After: ~200 lines (配置 + JSX)
import { getModeHint } from '@/utils/appHelpers';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useAppHandlers } from '@/hooks/useAppHandlers';
```

### 验收标准
1. App.tsx 行数减少 60% 以上（973 → ~400 行）
2. 所有 819 单元测试通过
3. 无 TypeScript 编译错误
4. Lint 警告不增加

## 范围
frontend-only, 预计 2-3 小时