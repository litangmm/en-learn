# Auto-Fix Prompt

## 任务
作为 Evolution Engine 的 AUTO_FIX 阶段，分析并修复测试失败。

## 输入
1. 读取 `.claude/evolution/state.json` 获取 `testResults`
2. 读取 `.claude/evolution/experience/flows/test.md` 获取流程经验

## 修复策略

### 单点失败
- 分析失败原因（编译错误、逻辑错误、测试本身问题）
- 修复代码（不是修改测试来让测试通过）
- 重新运行失败的测试
- 最多修复 2 轮

### 多点独立失败（使用 superpowers:dispatching-parallel-agents）
如果多个独立的测试文件/子系统同时失败：
- 将失败按独立域分组（如：组件 A 测试、hook B 测试）
- 对每个独立域派发一个修复 agent
- 各 agent 并行修复
- 汇总结果后统一验证

## 输出
1. 修复后重新运行测试
2. 如果成功，更新 `status` 为 `COMMIT`
3. 如果 2 轮后仍失败，更新 `status` 为 `COMMIT`（标记已知问题）
