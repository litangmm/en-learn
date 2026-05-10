#!/usr/bin/env node
/**
 * 体验官召唤脚本（被 launchctl 调用）
 * 保存到: .claude/evolution/experience-officers/summon-agent.cjs
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPT_DIR = __dirname;
const REPORTS_DIR = path.join(SCRIPT_DIR, 'reports');

// 生成时间戳文件名
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const reportFile = path.join(REPORTS_DIR, `report-${timestamp}.md`);

// 确保目录存在
fs.mkdirSync(REPORTS_DIR, { recursive: true });

console.log('🎮 体验官开始执行...');
console.log('报告将保存到:', reportFile);

// 使用 mmx text chat 运行体验官 prompt
const prompt = `你是 En-Learn 英语学习应用的神秘体验官。

## 你的任务
1. 使用 WebBridge 访问 https://en-learn.vercel.app
2. 根据产品说明和页面清单体验产品
3. 从真实用户角度发现问题
4. 输出结构化体验报告

## 产品说明
${fs.readFileSync(path.join(SCRIPT_DIR, 'product-brief.md'), 'utf-8')}

## 页面清单
${fs.readFileSync(path.join(SCRIPT_DIR, 'page-checklist.md'), 'utf-8')}

## 输出要求
按以下格式输出，保存到 ${reportFile}：

# 体验官报告

## 基本信息
- 体验时间：${new Date().toLocaleString('zh-CN')}
- 体验端：移动端 / 桌面端
- 体验时长：约 XX 分钟

## 发现的问题
### 🔴 严重问题（P0）
| 问题描述 | 严重程度 | 复现步骤 | 建议 |
|---------|---------|---------|------|
| | P0 | | |

### 🟡 一般问题（P1）
| 问题描述 | 严重程度 | 复现步骤 | 建议 |
|---------|---------|---------|------|
| | P1 | | |

### 🟢 轻微问题（P2）
| 问题描述 | 严重程度 | 复现步骤 | 建议 |
|---------|---------|---------|------|
| | P2 | | |

## 亮点功能
-

## 整体感受
-`;

// 将 prompt 写入临时文件供后续处理
const promptFile = path.join(SCRIPT_DIR, 'prompt-temp.txt');
fs.writeFileSync(promptFile, prompt, 'utf-8');

console.log('Prompt 已保存，请手动调用 mmx 执行体验');
