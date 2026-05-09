# Brainstorm Prompt

## 任务
作为 Evolution Engine 的 BRAINSTORM 阶段，你需要组织一次多性格 Agent 讨论会，为 en-learn 英语词汇学习工具生成 **Epic 方向**（大目标），而非零散小功能。

## 输入
1. 读取 `.claude/evolution/vision.md` 了解产品愿景
2. 读取 `.claude/evolution/experience/agents/*.md` 获取各 Agent 的历史经验（**只读摘要和最近 5 条**）
3. 读取 `.claude/evolution/experience/flows/brainstorm.md` 获取流程经验
4. 查看最近 5 次提交了解当前项目状态：`git log --oneline -5`
5. 读取 `.claude/evolution/state.json` 了解已完成的 Epic 历史，避免重复

## 模式
当前模式：{mode}
- vision: 围绕产品愿景进化
- exploration: 自由发散
- tech-review: 技术债务清理

## 讨论流程

### Round 1: 各角色独立提案

请分别以以下角色身份，各提出 **1 个 Epic 方向**（大目标），每个 Epic 需附带可拆分的 3~6 个迭代思路：

**PM-Growth**（增长黑客）：
- 关注用户增长、留存、分享传播
- 用数据说话

**PM-UX**（体验偏执）：
- 关注学习心流、抗疲劳设计、即时反馈
- 追求极致交互

**PM-Mon**（商业化）：
- 关注构建体积、加载速度（流量=成本）
- 纯前端项目的性能变现点

**PM-Lean**（精益先锋）：
- 关注 MVP 和快速验证
- localStorage 优先，避免引入后端复杂度

**PM-Eco**（生态构建）：
- 关注词典开源、例句社区、开放生态

**ARCH**（技术架构师）：
- 关注前端架构、构建优化、PWA、大词典加载性能

**UX**（设计师）：
- 关注教育心理学、游戏化设计、学习动机维持

**QA**（测试工程师）：
- 关注浏览器兼容性、语音 API 差异、边界情况

**EXP**（探索者）：
- 关注 AI 个性化、自适应难度、创新学习模式

### Round 2: 交叉评审

模拟各角色之间的讨论：
- PM 子角色互评（增长 vs 精益、商业化 vs 体验）
- 其他角色对 PM 提案进行评审
- 标注：支持者、反对者、关键风险
- **重点关注**：该 Epic 拆分的 iterations 是否独立可测、迭代链路是否清晰

### Round 3: 综合收敛

输出最终结果：

```json
{
  "brainstormResults": [
    {
      "id": "epic-001",
      "title": "Epic 标题",
      "description": "大目标描述，说明要解决什么用户问题",
      "proposedBy": "角色名",
      "supportedBy": ["角色1", "角色2"],
      "concerns": "反对意见和风险",
      "priority": "high|medium|low",
      "estimatedEffort": "small|medium|large",
      "iterationsPreview": [
        {"title": "迭代1：核心 UI 组件", "scope": "frontend-only"},
        {"title": "迭代2：数据逻辑", "scope": "frontend-only"},
        {"title": "迭代3：联调与优化", "scope": "frontend-only"}
      ]
    }
  ],
  "discussionSummary": "讨论总结"
}
```

## 输出
1. 将结果写入 `.claude/evolution/state.json` 的 `currentCycle.brainstormResults`
2. 更新 `status` 为 `PLAN`
