# Deploy Prompt

## 任务
作为 Evolution Engine 的 DEPLOY 阶段，将本次功能部署到 Vercel，并创建 git tag 记录版本。

## 环境
- **生产环境**：Vercel 静态站点托管
- 构建命令：`npm run build`
- 输出目录：`dist/`

## 部署步骤

### 方式 A：部署脚本（推荐，自动打tag + 记录发布历史）

```bash
# 1. 获取当前最新 tag
CURRENT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")

# 2. 计算下一个版本号（递增 minor）
# 例如 v0.3.0 → v0.4.0

# 3. 执行部署脚本（传入版本号、迭代ID、迭代标题）
./scripts/evolution/deploy.sh v0.X.0 iter-XXX "迭代标题"
```

**脚本会自动完成**：
1. `npm run build` 构建
2. `npx vercel --prod --yes` 部署到 Vercel
3. `git tag -a v0.X.0` 创建带注释的 git tag
4. 更新 `.claude/evolution/releases.json` 发布历史

### 方式 B：手动命令（备用）
```bash
npm run build
npx vercel --prod --yes
```

**前提**：Vercel CLI 已登录（`npx vercel login` 已完成）

## 版本号规则
- 格式：`v主版本.次版本.修订号`（如 v0.4.0）
- 每次迭代递增 **次版本**（minor）：v0.3.0 → v0.4.0
- 紧急修复递增 **修订号**（patch）：v0.3.0 → v0.3.1

## 验证
部署后访问生产 URL，确认：
1. 页面正常加载
2. 核心功能可用（词典切换、练习流程）
3. 无控制台报错

## 双向沟通触发点

**部署前必须检查**：
- Vercel CLI 是否已登录？运行 `npx vercel whoami` 验证
- 如果没有登录或提示需要 token → **立即触发 AWAITING_INPUT**
- 不要尝试 `npx vercel login`（交互式命令在非交互环境会失败）

## 失败处理
- 构建失败：检查 TypeScript 错误，修复后重试
- 部署失败：检查 Vercel CLI 登录状态、网络连接
  - 如果是未登录导致的失败 → **触发 AWAITING_INPUT** 而不是重试

## 输出
1. 记录部署结果到 `.claude/evolution/state.json` 的 `deployStatus`：
   ```json
   {
     "deployed": true/false,
     "target": "vercel",
     "url": "https://...",
     "deployedAt": "ISO时间",
     "error": "失败原因（如有）"
   }
   ```
2. 确保 `.claude/evolution/releases.json` 已更新本次发布记录
3. 确保 git tag 已创建（可运行 `git tag -l` 验证）
4. 部署成功则更新 `status` 为 `REPORT`
4. 部署成功后执行 `git push --tags` 推送 tag
5. 部署失败则更新 `status` 为 `AUTO_FIX`，记录失败原因
