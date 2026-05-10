#!/usr/bin/env node
/**
 * Review Agent - 分析体验报告并生成审批文件
 *
 * 用法: node review-agent.js
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const REPORTS_DIR = path.join(SCRIPT_DIR, 'reports');
const OUTPUT_DIR = SCRIPT_DIR;
const FEISHU_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/144552f8-3672-452e-8b62-f4fda4be0539';

// 读取报告文件
function readReports() {
  const files = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.md'));
  const reports = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(REPORTS_DIR, file), 'utf-8');
    reports.push({ file, content });
  }

  return reports;
}

// 解析报告提取问题
function parseReports(reports) {
  const issues = [];
  let issueId = 1;

  reports.forEach(({ file, content }) => {
    // 匹配严重程度章节
    const p0Match = content.match(/###\s*[🟡🔴🟢]\s*[^（]*（P0）/g);
    const p1Match = content.match(/###\s*[🟡🔴🟢]\s*[^（]*（P1）/g);
    const p2Match = content.match(/###\s*[🟡🔴🟢]\s*[^（]*（P2）/g);

    const severities = [
      { pattern: /###\s*[🟡🔴🟢]\s*[^（]*（P0）/g, level: 'P0' },
      { pattern: /###\s*[🟡🔴🟢]\s*[^（]*（P1）/g, level: 'P1' },
      { pattern: /###\s*[🟡🔴🟢]\s*[^（]*（P2）/g, level: 'P2' }
    ];

    severities.forEach(({ pattern, level }) => {
      // 找到该严重程度章节后的内容
      let match;
      const regex = new RegExp(pattern.source, 'gi');
      while ((match = regex.exec(content)) !== null) {
        const start = match.index;
        const nextSection = content.indexOf('\n###', start + 1);
        const block = content.substring(start, nextSection > 0 ? nextSection : content.length);

        // 解析表格行
        const lines = block.split('\n');
        for (const line of lines) {
          if (line.includes('|') && line.includes(level)) {
            const cols = line.split('|').map(c => c.trim()).filter(c => c);
            if (cols.length >= 4 && cols[0] !== '问题描述' && !cols[0].includes('---')) {
              issues.push({
                id: `Q${issueId}`,
                description: cols[0].replace(/<br>/g, '\n'),
                severity: level,
                reproSteps: cols[2].replace(/<br>/g, '\n'),
                suggestion: cols[3] || '',
                foundCount: 1,
                source: file
              });
              issueId++;
            }
          }
        }
      }
    });
  });

  return issues;
}

// 去重合并问题
function deduplicateIssues(issues) {
  const deduped = [];
  const descMap = new Map();

  issues.forEach(issue => {
    const key = issue.description.toLowerCase().trim();
    if (descMap.has(key)) {
      const existing = descMap.get(key);
      existing.foundCount++;
      existing.source += `, ${issue.source}`;
    } else {
      descMap.set(key, issue);
      deduped.push(issue);
    }
  });

  return deduped;
}

// 生成 HTML
function generateHtml(issues, reviewData) {
  const p0Count = issues.filter(i => i.severity === 'P0').length;
  const p1Count = issues.filter(i => i.severity === 'P1').length;
  const p2Count = issues.filter(i => i.severity === 'P2').length;

  const issuesList = issues.map(issue => `
    <div class="issue-card" data-id="${issue.id}">
      <div class="issue-header">
        <span class="issue-id">${issue.id}</span>
        <span class="issue-severity severity-${issue.severity.toLowerCase()}">${issue.severity}</span>
      </div>
      <div class="issue-desc">${issue.description}</div>
      <div class="issue-repro">
        <strong>复现步骤：</strong><br>${issue.reproSteps.replace(/\n/g, '<br>')}
      </div>
      <div class="issue-suggestion"><strong>建议：</strong>${issue.suggestion}</div>
      <div class="issue-meta">发现次数：${issue.foundCount}/5 个体验官</div>
      <div class="issue-actions">
        <button class="btn btn-approve" onclick="setDecision('${issue.id}', 'approve')">✅ 批准</button>
        <button class="btn btn-reject" onclick="setDecision('${issue.id}', 'reject')">❌ 拒绝</button>
      </div>
      <input type="text" class="note-input" id="note-${issue.id}" placeholder="审批备注（可选）">
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>En-Learn 体验官报告审批</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header h1 { font-size: 24px; margin-bottom: 16px; }
    .stats { display: flex; gap: 16px; flex-wrap: wrap; }
    .stat { background: #f0f0f0; padding: 12px 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #666; }
    .stat.p0 .stat-value { color: #dc2626; }
    .stat.p1 .stat-value { color: #f59e0b; }
    .stat.p2 .stat-value { color: #22c55e; }
    .section { background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .section-title { font-size: 18px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #eee; }
    .issue-card { border: 1px solid #eee; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .issue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .issue-id { font-weight: bold; color: #666; font-size: 14px; }
    .issue-severity { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .severity-p0 { background: #fef2f2; color: #dc2626; }
    .severity-p1 { background: #fffbeb; color: #f59e0b; }
    .severity-p2 { background: #f0fdf4; color: #22c55e; }
    .issue-desc { margin-bottom: 12px; }
    .issue-repro { background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 14px; }
    .issue-repro strong { color: #666; }
    .issue-suggestion { color: #666; font-size: 14px; margin-bottom: 12px; }
    .issue-meta { font-size: 12px; color: #999; margin-bottom: 12px; }
    .issue-actions { display: flex; gap: 12px; margin-top: 12px; }
    .btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
    .btn-approve { background: #22c55e; color: white; }
    .btn-approve:hover { background: #16a34a; }
    .btn-approve.active { background: #16a34a; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3); }
    .btn-reject { background: #ef4444; color: white; }
    .btn-reject:hover { background: #dc2626; }
    .btn-reject.active { background: #dc2626; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3); }
    .submit-section { text-align: center; padding: 20px; }
    .btn-submit { background: #3b82f6; color: white; padding: 12px 40px; font-size: 16px; border-radius: 8px; }
    .btn-submit:hover { background: #2563eb; }
    .submitted { text-align: center; padding: 40px; }
    .submitted h2 { color: #22c55e; margin-bottom: 16px; }
    .submitted p { color: #666; margin-bottom: 8px; }
    .note-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; margin-top: 8px; }
    .btn-copy { background: #6b7280; color: white; margin-left: 12px; }
    .btn-copy:hover { background: #4b5563; }
    textarea { width: 100%; height: 150px; margin: 16px 0; font-family: monospace; font-size: 12px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 En-Learn 体验官报告审批</h1>
      <div class="stats">
        <div class="stat p0"><div class="stat-value">${p0Count}</div><div class="stat-label">🔴 P0 严重</div></div>
        <div class="stat p1"><div class="stat-value">${p1Count}</div><div class="stat-label">🟡 P1 一般</div></div>
        <div class="stat p2"><div class="stat-value">${p2Count}</div><div class="stat-label">🟢 P2 轻微</div></div>
        <div class="stat"><div class="stat-value">${issues.length}</div><div class="stat-label">📋 总计</div></div>
      </div>
    </div>
    <div class="section">
      <h2 class="section-title">问题清单</h2>
      <div id="issues-list">${issuesList}</div>
    </div>
    <div class="section submit-section">
      <button class="btn btn-submit" onclick="submitReview()">提交审批</button>
    </div>
    <div class="section submitted" id="submitted-section" style="display: none;">
      <h2>✅ 审批已提交</h2>
      <p>审批结果 JSON（请复制并替换 pending-reviews.json）</p>
      <textarea id="review-json" readonly></textarea>
      <button class="btn btn-copy" onclick="copyJson()">📋 复制 JSON</button>
    </div>
  </div>
  <script>
    let reviewData = ${JSON.stringify(reviewData)};
    function setDecision(id, decision) {
      const card = document.querySelector(\`[data-id="\${id}"]\`);
      card.querySelector('.btn-approve').classList.toggle('active', decision === 'approve');
      card.querySelector('.btn-reject').classList.toggle('active', decision === 'reject');
      const existing = reviewData.reviewed.find(r => r.id === id);
      if (existing) existing.decision = decision;
      else reviewData.reviewed.push({ id, decision, note: '' });
    }
    function submitReview() {
      reviewData.reviewed.forEach(r => {
        const noteInput = document.getElementById(\`note-\${r.id}\`);
        if (noteInput) r.note = noteInput.value;
      });
      document.getElementById('review-json').value = JSON.stringify(reviewData, null, 2);
      document.querySelector('.submit-section').style.display = 'none';
      document.getElementById('submitted-section').style.display = 'block';
    }
    function copyJson() {
      navigator.clipboard.writeText(document.getElementById('review-json').value)
        .then(() => alert('✅ JSON 已复制！请替换 pending-reviews.json'))
        .catch(() => { document.getElementById('review-json').select(); document.execCommand('copy'); alert('✅ JSON 已复制！请替换 pending-reviews.json'); });
    }
  </script>
</body>
</html>`;
}

// 发送飞书通知
function sendFeishuNotification(issues) {
  const p0Count = issues.filter(i => i.severity === 'P0').length;
  const p1Count = issues.filter(i => i.severity === 'P1').length;
  const p2Count = issues.filter(i => i.severity === 'P2').length;

  const message = `## 🎮 En-Learn 体验官报告已生成

**体验时间：** ${new Date().toLocaleString('zh-CN')}
**发现问题：** ${issues.length} 个

### 问题概览
| 严重程度 | 数量 |
|---------|------|
| 🔴 P0 | ${p0Count} |
| 🟡 P1 | ${p1Count} |
| 🟢 P2 | ${p2Count} |

---

👇 [点击此处审批 →](file:///Users/litang/WeChatProjects/en-learn/.claude/evolution/experience-officers/review.html)

_由 En-Learn 体验官系统自动生成_`;

  const https = require('https');

  const postData = JSON.stringify({
    msg_type: 'text',
    content: { text: message }
  });

  const options = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/bot/v2/hook/144552f8-3672-452e-8b62-f4fda4be0539',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 主函数
async function main() {
  console.log('🔍 Review Agent 开始分析...\n');

  // 1. 读取报告
  const reports = readReports();
  console.log(`📄 读取了 ${reports.length} 份体验报告`);

  if (reports.length === 0) {
    console.log('⚠️ 没有找到报告文件，请先召唤体验官生成报告');
    process.exit(1);
  }

  // 2. 解析问题
  const allIssues = parseReports(reports);
  console.log(`🔎 提取了 ${allIssues.length} 个问题`);

  // 3. 去重合并
  const issues = deduplicateIssues(allIssues);
  console.log(`🔄 去重后剩余 ${issues.length} 个问题`);

  // 4. 生成 review.json
  const reviewData = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    issues,
    reviewed: []
  };

  // 5. 生成 HTML
  const html = generateHtml(issues, reviewData);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'review.html'), html, 'utf-8');
  console.log('✅ 已生成 review.html');

  // 6. 发送飞书通知
  try {
    const result = await sendFeishuNotification(issues);
    if (result.code === 0) {
      console.log('✅ 飞书通知已发送');
    } else {
      console.log('⚠️ 飞书通知发送失败:', result.msg);
    }
  } catch (e) {
    console.log('⚠️ 飞书通知发送失败:', e.message);
  }

  console.log('\n📋 后续步骤:');
  console.log('1. 打开 review.html 审批问题');
  console.log('2. 复制审批结果 JSON');
  console.log('3. 替换 pending-reviews.json 内容');
  console.log('4. 审批结果将作为进化引擎的输入');
}

main().catch(console.error);
