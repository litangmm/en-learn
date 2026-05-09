# Plan Prompt

## 任务
作为 Evolution Engine 的 PLAN 阶段，从头脑风暴结果中选出 1 个 Epic，拆分为可执行的 iterations，并制定第一个 iteration 的详细实现计划。

## 输入
1. 读取 `.claude/evolution/state.json` 获取 `brainstormResults` 和 `currentEpic`
2. 读取 `.claude/evolution/experience/flows/plan.md` 获取流程经验

## 逻辑分支

### 分支 A：已有 active Epic（currentEpic 存在且有 pending iterations）
- 不需要重新选 Epic
- 直接取出下一个 pending iteration
- 制定该 iteration 的实现计划

### 分支 B：没有 active Epic（currentEpic 为空或已完成）
- 从 brainstormResults 中选一个 Epic
- 将 Epic 拆分为 3~6 个 iterations
- 初始化 `currentEpic` 到 state.json
- 制定第一个 iteration 的实现计划

## 战略指令检查

在开始规划之前，**先检查 run.sh 注入的战略指令**（如果有）。指令类型包括：
- `priority_change`：调整 Epic 优先级
- `insert_epic`：插入新 Epic
- `skip_to_epic`：跳过当前，直接进入指定 Epic
- `pause`：暂停并返回 IDLE
- `custom`：自定义指令

**执行规则**：
- 如果有 `skip_to_epic` 指令，直接规划指定的 Epic，忽略 brainstormResults 的顺序
- 如果有 `priority_change` 指令，重新排序 Epic 优先级后再选择
- 如果有 `insert_epic` 指令，将新 Epic 加入列表并考虑优先执行
- 执行完指令后，更新 `directives.json` 将已执行指令移入 history

## 选择标准
1. 优先级最高（可被战略指令覆盖）
2. 与当前代码库关联度高（可参考最近提交）
3. 迭代链路清晰，iterations 之间无强依赖
4. 允许 medium / large 工作量（不再只选 small）

## Iteration 拆分原则
- 每个 iteration 应**独立完成并可测试通过**
- iterations 之间**无强依赖**（后面的不依赖前面的才能编译）
- 优先拆分：数据/逻辑层 → UI 组件层 → 联调优化层
- 每个 iteration 预估工作量：small（15~30min）或 medium（30~60min）

## 输出格式

### 分支 B（新 Epic）输出：

```json
{
  "selectedEpic": {
    "id": "epic-001",
    "title": "Epic 标题"
  },
  "currentEpic": {
    "id": "epic-001",
    "title": "Epic 标题",
    "description": "Epic 描述",
    "iterations": [
      {"id": "iter-001", "title": "迭代1标题", "scope": "frontend-only", "status": "in_progress"},
      {"id": "iter-002", "title": "迭代2标题", "scope": "frontend-only", "status": "pending"},
      {"id": "iter-003", "title": "迭代3标题", "scope": "frontend-only", "status": "pending"}
    ],
    "currentIterationIndex": 0
  },
  "plan": {
    "iterationId": "iter-001",
    "iterationTitle": "当前迭代标题",
    "scope": "frontend-only",
    "steps": [
      "Step 1: 具体行动",
      "Step 2: 具体行动"
    ],
    "filesToModify": [
      "src/...",
      "src/..."
    ],
    "filesToCreate": [
      "src/components/..."
    ],
    "dependencies": [],
    "testStrategy": "需要测试的点"
  }
}
```

### 分支 A（已有 Epic）输出：

```json
{
  "plan": {
    "iterationId": "iter-002",
    "iterationTitle": "当前迭代标题",
    "scope": "frontend-only",
    "steps": [
      "Step 1: 具体行动",
      "Step 2: 具体行动"
    ],
    "filesToModify": [
      "src/...",
      "src/..."
    ],
    "filesToCreate": [
      "src/components/..."
    ],
    "dependencies": [],
    "testStrategy": "需要测试的点"
  }
}
```

同时更新 `currentEpic.currentIterationIndex` 和对应 iteration 的 `status` 为 `in_progress`。

## 输出
1. 将结果写入 `.claude/evolution/state.json`
2. 更新 `status` 为 `IMPLEMENT`
