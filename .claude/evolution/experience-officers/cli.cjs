#!/usr/bin/env node
/**
 * 体验官系统 CLI 入口
 *
 * 用法:
 *   node cli.js summon      - 召唤体验官
 *   node cli.js review     - 运行 Review Agent
 *   node cli.js test       - 测试飞书通知
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

const SCRIPT_DIR = __dirname;
const FEISHU_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/144552f8-3672-452e-8b62-f4fda4be0539';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function info(msg) { log(colors.blue, 'INFO', msg); }
function success(msg) { log(colors.green, 'SUCCESS', msg); }
function warn(msg) { log(colors.yellow, 'WARN', msg); }
function error(msg) { log(colors.red, 'ERROR', msg); }

// 发送飞书消息
function sendFeishu(message) {
  return new Promise((resolve, reject) => {
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

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ code: -1, msg: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 召唤体验官命令
async function summonCommand() {
  info('🎮 开始召唤体验官...');
  console.log('');

  const productBrief = fs.readFileSync(path.join(SCRIPT_DIR, 'product-brief.md'), 'utf-8');
  const pageChecklist = fs.readFileSync(path.join(SCRIPT_DIR, 'page-checklist.md'), 'utf-8');
  const reportTemplate = fs.readFileSync(path.join(SCRIPT_DIR, 'report-template.md'), 'utf-8');

  const timestamp = new Date().toLocaleString('zh-CN');
  const officers = ['EO-001', 'EO-002', 'EO-003'];

  console.log('=========================================');
  console.log('       体验官召唤说明');
  console.log('=========================================');
  console.log('');
  console.log('每个体验官 Agent 将：');
  console.log('1. 使用 MiniMax + WebBridge 访问 https://en-learn.vercel.app');
  console.log('2. 根据产品说明和页面清单进行体验');
  console.log('3. 输出结构化体验报告');
  console.log('');
  console.log('=========================================');
  console.log('');

  // 显示召唤信息
  for (const officer of officers) {
    console.log(`📋 体验官 ${officer}:`);
    console.log(`   - 链接: https://en-learn.vercel.app`);
    console.log(`   - 报告保存位置: reports/report-${officer}.md`);
    console.log('');
  }

  // 提供体验官 Prompt 模板
  console.log('=========================================');
  console.log('   体验官 Prompt（可复制给 MiniMax Agent）');
  console.log('=========================================');
  console.log('');
  console.log(`你是 En-Learn 英语学习应用的神秘体验官，代号 {OFFICER_ID}。`);
  console.log('');
  console.log('## 你的任务');
  console.log('1. 通过浏览器访问 https://en-learn.vercel.app');
  console.log('2. 根据产品说明和关键页面清单进行体验');
  console.log('3. 从真实用户角度发现问题和亮点');
  console.log('4. 输出结构化体验报告');
  console.log('');
  console.log('## 产品说明');
  console.log(productBrief.substring(0, 500) + '...');
  console.log('');
  console.log('## 关键页面清单');
  console.log(pageChecklist.substring(0, 500) + '...');
  console.log('');
  console.log('## 输出格式');
  console.log('按报告模板输出，包含：');
  console.log('- 基本信息（时间、端、时长）');
  console.log('- 问题清单（P0/P1/P2分类，含复现步骤）');
  console.log('- 亮点功能');
  console.log('- 整体感受');
  console.log('');
  console.log('报告保存到：.claude/evolution/experience-officers/reports/');
  console.log('=========================================');
  console.log('');
  console.log('提示：复制上述 Prompt 给 MiniMax Agent（使用 mmx text chat）');
  console.log('或手动召唤 3-5 个体验官 Agent 进行体验');
  console.log('');
}

// Review 命令
async function reviewCommand() {
  info('🔍 运行 Review Agent...');

  const reviewAgent = path.join(SCRIPT_DIR, 'review-agent.cjs');
  if (fs.existsSync(reviewAgent)) {
    require(reviewAgent);
  } else {
    error('review-agent.cjs 不存在，请先创建');
    process.exit(1);
  }
}

// 测试飞书通知
async function testFeishuCommand() {
  info('🧪 测试飞书通知...');

  const result = await sendFeishu('🧪 测试消息：飞书通知功能正常\n时间：' + new Date().toLocaleString('zh-CN'));

  if (result.code === 0) {
    success('飞书通知发送成功！');
  } else {
    error(`飞书通知发送失败: ${result.msg}`);
  }
}

// 帮助信息
function showHelp() {
  console.log(`
🎮 En-Learn 体验官系统

用法:
  node cli.js <command>

命令:
  summon     召唤体验官（显示召唤说明和 Prompt 模板）
  review     运行 Review Agent 分析报告并生成审批页面
  test       测试飞书通知
  help       显示帮助信息

示例:
  node cli.js summon    # 召唤体验官
  node cli.js review    # 生成审批报告
  node cli.js test      # 测试飞书
`);
}

// 主入口
async function main() {
  const command = process.argv[2] || 'help';

  switch (command) {
    case 'summon':
      await summonCommand();
      break;
    case 'review':
      await reviewCommand();
      break;
    case 'test':
      await testFeishuCommand();
      break;
    case 'help':
    default:
      showHelp();
  }
}

main().catch(console.error);
