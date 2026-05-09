# Report Prompt

## 任务
作为 Evolution Engine 的 REPORT 阶段，生成进化报告并更新经验沉淀。

## 输入
1. 读取 `.claude/evolution/state.json` 获取完整循环数据
2. 读取各 Agent 经验档案

## 报告内容
1. 本次 Epic / Iteration 实现摘要
2. 修改文件列表
3. 测试结果
4. 头脑风暴候选（未选中的 Epic）
5. Commit 信息
6. 下一轮预测

## 经验沉淀
1. 分析各 Agent 本次表现
2. 更新对应 Agent 经验档案（追加历史提案条目）
3. 更新流程经验档案
4. 如果某 Agent 连续 3 次未被选中，添加反思记录

## 归档与备份
1. **运行归档脚本**：`node scripts/evolution/archive-agent-exp.js`
   - 自动将超过 50 条的 Agent 经验档案归档到 `experience/archive/`
2. **创建 state.json 备份**：
   ```bash
   cp .claude/evolution/state.json .claude/evolution/backup/state-$(date +%Y-%m-%d-%H%M%S).json
   ```

## Epic 状态更新
- 如果当前 Epic 的所有 iterations 都已完成：
  - 将 `currentEpic.status` 设为 `completed`
  - 可选：将 `currentEpic` 设为 `null`（下次触发时选新 Epic）
- 如果还有 pending iterations：
  - 保持 `currentEpic` 不变
  - run.sh 会自动检测到 pending iterations 并继续 PLAN

## 输出
1. 生成报告文件 `.claude/evolution/history/YYYY-MM-DD-N.md`
2. 更新 `.claude/evolution/state.json`：
   - `cycleCount` + 1
   - `lastRun` = 当前时间
   - `failedAttempts` = 0
   - `currentCycle` = null
   - `status` = `IDLE`
3. 追加历史记录到 `history` 数组（格式：`{id, mode, stage, status, summary}`）
