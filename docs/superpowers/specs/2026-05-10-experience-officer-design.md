# En-Learn 体验官系统设计

## 背景

通过召唤外部 AI Agent 作为"体验官"，对 En-Learn 产品进行真实用户体验测试，弥补开发者视角的盲区。体验官不看代码，只通过浏览器实际操作，结合截图理解能力发现问题，输出结构化报告，经 Review Agent 汇总后由人工审批，最终生成进化指令。

## 核心设计

### 系统组成

```
触发条件 ──▶ 体验官召唤(3-5个Agent) ──▶ WebBridge浏览器操作 ──▶ 截图理解 ──▶ 体验报告
                                                                      │
                                                                      ▼
                                                            Review Agent汇总
                                                                      │
                                                                      ▼
                                                            飞书通知+审批页面
                                                                      │
                                                                      ▼
                                                            写入pending-reviews.json
                                                                      │
                                                                      ▼
                                                            进化引擎读取处理
```

### 触发条件

- **手动触发**：用户说"召唤体验官"或类似指令
- 当前 epic 完成后可触发

### 体验官配置

#### 产品说明 (product-brief.md)

产品定位、功能概览、使用流程，不含技术术语。

#### 关键页面清单 (page-checklist.md)

移动端/桌面端关键页面列表，引导体验官覆盖核心功能区域。

#### 体验报告模板 (report-template.md)

```
- 基本信息（时间、端、时长）
- 问题清单（P0/P1/P2分类，含复现步骤）
- 亮点功能
- 整体感受
- 关键截图
```

### 体验官召唤 Prompt

包含：
- 访问链接 https://en-learn.vercel.app
- 产品说明引用
- 页面清单引用
- 报告模板引用
- 使用 WebBridge + MiniMax 图片理解进行体验

### Review Agent

汇总所有体验报告：
- 去重合并相似问题
- 统计发现次数
- 按严重程度排序
- 输出结构化问题清单

### 审批流程

1. Review Agent 完成后，生成/更新 review.html（含问题清单）
2. 推送飞书消息，带链接指向 review.html
3. 用户打开 HTML 文件，对每个问题点击「批准」或「拒绝」
4. 提交后写入 pending-reviews.json

### 审批结果格式

```json
{
  "generatedAt": "2026-05-10T14:00:00Z",
  "reviewed": [
    { "id": "Q1", "decision": "approve", "note": "" },
    { "id": "Q2", "decision": "reject", "note": "轻微问题" }
  ]
}
```

## 文件结构

```
.claude/evolution/experience-officers/
├── product-brief.md       # 产品说明
├── page-checklist.md      # 关键页面清单
├── report-template.md     # 体验报告模板
├── prompt-officer.md      # 体验官召唤 prompt
├── prompt-review.md       # Review Agent prompt
├── reports/              # 体验报告存放目录
├── pending-reviews.json  # 审批结果
└── review.html           # 审批页面（生成）
```

## 飞书通知

```markdown
## 🎮 En-Learn 体验官报告已生成

**体验时间：** 2026-05-10 14:00
**体验官数量：** 5
**发现问题：** 8 个

### 问题概览
| 严重程度 | 数量 |
|---------|------|
| 🔴 P0 | 1 |
| 🟡 P1 | 4 |
| 🟢 P2 | 3 |

---

👇 [点击此处审批 →](本地文件路径/.claude/evolution/experience-officers/review.html)

_由 En-Learn 体验官系统自动生成_
```

## 实现优先级

1. 创建基础文件（product-brief.md, page-checklist.md, report-template.md）
2. 实现体验官召唤和报告收集
3. 实现 Review Agent 汇总
4. 实现 review.html + 审批流程
5. 实现飞书通知
6. 集成到进化引擎

## 注意事项

- 审批结果写入 pending-reviews.json 后，进化引擎需支持读取并生成对应指令
- 体验官每次召唤数量建议 3-5 个
- review.html 为静态 HTML，可通过 VS Code 打开或部署到任意静态托管
