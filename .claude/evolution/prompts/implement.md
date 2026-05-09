# Implement Prompt

## 任务
作为 Evolution Engine 的 IMPLEMENT 阶段，按照 iteration plan 执行编码。

## 输入
1. 读取 `.claude/evolution/state.json` 获取当前 iteration 的 `plan`
2. 读取 `.claude/evolution/experience/flows/implement.md` 获取流程经验

## 执行方式：Subagent-Driven Development

采用 `superpowers:subagent-driven-development` 流程执行编码。核心原则：**每个子任务用隔离上下文完成，编码后必须经过 spec review + code quality review 两轮审查**。

### Step 1: 拆分子任务
将当前 iteration plan 拆为 2~5 个原子子任务，每个子任务：
- 聚焦单一职责
- 可独立验证
- 不与其他子任务强耦合

### Step 2: 逐个子任务执行（单实例模拟 subagent 流程）

对每个子任务，按以下流程执行：

#### 2.1 Implementer 阶段
- 读取相关代码上下文
- 执行编码修改
- 运行 `npm run lint` 和 `npm run build` 确保无编译错误
- 自我 review：代码是否实现了子任务目标？

#### 2.2 Spec Reviewer 阶段
- 对照 plan，检查代码是否完整实现了子任务要求
- 检查是否有遗漏的边界情况
- 检查文件修改范围是否与 plan 一致
- 如有 gap，回到 2.1 修复

#### 2.3 Code Quality Reviewer 阶段
- 检查代码风格是否与项目一致
- 检查是否有重复代码可提取
- 检查命名是否清晰
- 检查是否有未使用的导入/变量
- 检查 TypeScript 类型是否完整
- 如有问题，回到 2.1 修复

### Step 3: 全部子任务完成后
- 运行 `npm run test:run` 执行单元测试
- 更新 `.claude/evolution/state.json` 的 `implementationStatus`
- 更新 iteration 状态为 `completed`
- 更新 `status` 为 `TEST`

## 约束
1. 只修改 plan 中的文件，禁止删除 `.claude/`、`docs/` 目录
2. 遵循项目现有代码风格（React hooks、shadcn/ui 组件模式）
3. 每次修改后运行 lint 和 build
4. 如果遇到困难，记录问题并继续

## 双向沟通触发点

编码过程中，如果遇到以下情况 **必须触发 AWAITING_INPUT**，不要猜测或绕过：

- **缺失外部资源**：设计稿、图标素材、第三方 API key、后端接口文档
- **依赖不可用**：需要安装的 npm 包因网络/权限无法安装
- **架构决策需要确认**：plan 中的方案在实际代码中发现不可行，需要用户选择替代方案
- **破坏性变更**：需要删除/重构大量已有代码，且 plan 中未明确授权

提问模板：
```json
{
  "id": "q-imp-001",
  "stage": "IMPLEMENT",
  "question": "具体问题描述",
  "blocking": true,
  "context": "为什么这个问题阻塞了实现"
}
```

## 输出
1. 执行编码
2. 更新 `.claude/evolution/state.json`：
   - `implementationStatus`：实现摘要
   - `currentEpic.iterations[N].status`：`completed`
3. 更新 `status` 为 `TEST`
