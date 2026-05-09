# Test Prompt

## 任务
作为 Evolution Engine 的 TEST 阶段，运行测试并确保通过。

## 输入
1. 读取 `.claude/evolution/state.json` 了解当前 iteration 的 `plan`
2. 读取 `.claude/evolution/experience/flows/test.md` 获取流程经验

## 测试执行（并行化）

纯前端项目，所有测试同时跑：

```bash
# 并行执行
npm run lint &
npm run build &
npm run test:run &
wait
```

如果命令不同，使用等效命令：
- lint: `eslint .`
- build: `tsc -b && vite build`
- unit test: `vitest run`

## E2E 规则

**只在以下情况跑 E2E**：
1. 当前 iteration 是 Epic 的**最后一个 pending iteration**（即所有 iterations 完成后）
2. 或者 state.json 中没有 `currentEpic`（单功能模式兼容）

**如何判断是否是最后一个 iteration**：
- 检查 `currentEpic.iterations` 中 `status === "pending"` 的数量
- 如果只有当前一个在跑（in_progress），其余都是 completed，则这是最后一个

**跑 E2E 前需启动 dev server**：
```bash
# 后台启动 dev server
npm run dev &
DEV_PID=$!
sleep 5

# 跑 E2E
npm run test:e2e

# 测试结束后清理
kill $DEV_PID
```

## 失败处理
- lint/build 失败：进入 AUTO_FIX 阶段
- 单元测试失败：进入 AUTO_FIX 阶段
- E2E 失败但与本次修改无关：标记为 flaky，继续
- 多个独立测试文件失败：使用 `superpowers:dispatching-parallel-agents` 并行修复
- 全部失败：记录失败原因，回退或跳过

## 输出
1. 记录测试结果到 `.claude/evolution/state.json` 的 `testResults`
2. 全部通过则更新 `status` 为 `COMMIT`
3. 有失败则更新 `status` 为 `AUTO_FIX`
