# Commit Prompt

## 任务
作为 Evolution Engine 的 COMMIT 阶段，将代码更改提交到 git。

## 输入
1. 读取 `.claude/evolution/state.json` 了解本次功能

## 操作

### 提交 1：代码变更
1. `git status` 查看更改
2. `git add` 添加代码相关文件（src/、index.html、package.json 等改动）
3. `git commit -m "[EVOLUTION] feat: 功能描述"`

### 提交 2：进化文档（如有变更）
如果以下文件有变更，单独提交：
- `.claude/evolution/history/*.md`
- `.claude/evolution/experience/agents/*.md`
- `.claude/evolution/experience/flows/*.md`
- `.claude/evolution/vision.md`
- `.claude/evolution/rules.md`

**排除以下纯运行时文件**：
- `.claude/evolution/log.txt`
- `.claude/evolution/state.json`
- `.claude/evolution/state.json.bak`
- `.claude/evolution/launchd*.log`
- `.claude/evolution/deploy.log`

```bash
git add .claude/evolution/history/ .claude/evolution/experience/ .claude/evolution/vision.md .claude/evolution/rules.md
git diff --cached --quiet || git commit -m "[EVOLUTION] docs: update agent experiences and history"
```

## 提交规范
- 前缀：`[EVOLUTION]`
- 类型：`feat`（功能）、`refactor`（重构）、`fix`（修复）、`docs`（文档/经验档案）
- 描述：简洁明了

## 输出
1. 记录 commit hash 到 `.claude/evolution/state.json`
2. 更新 `status` 为 `REPORT`
