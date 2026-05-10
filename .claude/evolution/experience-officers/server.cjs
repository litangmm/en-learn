#!/usr/bin/env node
/**
 * 体验官审批服务
 * - Serve review.html
 * - 接收审批结果并写入 pending-reviews.json
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const SCRIPT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.md': 'text/markdown'
};

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // POST 接收审批结果
  if (req.method === 'POST' && req.url === '/api/review') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const filePath = path.join(SCRIPT_DIR, 'pending-reviews.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log('✅ 审批结果已保存:', filePath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: '已保存到 pending-reviews.json' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Serve 静态文件
  let filePath = req.url === '/' || req.url === '/review.html'
    ? path.join(SCRIPT_DIR, 'review.html')
    : path.join(SCRIPT_DIR, req.url);

  // 安全检查：防止目录遍历
  if (!filePath.startsWith(SCRIPT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = Object.values(require('os').networkInterfaces())
    .flat()
    .find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

  console.log(`
🎮 En-Learn 体验官审批服务

📱 手机访问：http://${ip}:${PORT}/review.html
💻 本机访问：http://localhost:${PORT}/review.html

📋 API 端点：POST /api/review

按 Ctrl+C 停止服务
`);
});
