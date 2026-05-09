/**
 * Evolution Engine Dashboard Server
 * Zero-dependency Node.js HTTP server for managing directives & inbox
 *
 * Usage: node scripts/evolution/dashboard/server.js
 * Port: 3456 (en-learn)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3456;
const PROJECT_DIR = path.resolve(__dirname, '../../..');
const EVOLUTION_DIR = path.join(PROJECT_DIR, '.claude/evolution');
const STATE_FILE = path.join(EVOLUTION_DIR, 'state.json');
const DIRECTIVES_FILE = path.join(EVOLUTION_DIR, 'directives.json');
const INBOX_FILE = path.join(EVOLUTION_DIR, 'inbox/replies.json');

// CORS headers
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res, message, status = 400) {
  sendJSON(res, { error: message }, status);
}

// Parse request body
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      callback(JSON.parse(body || '{}'));
    } catch {
      callback({});
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Serve frontend
  if (pathname === '/' || pathname === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
    res.writeHead(200, { ...CORS, 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // API: Get state
  if (pathname === '/api/state' && req.method === 'GET') {
    sendJSON(res, readJSON(STATE_FILE));
    return;
  }

  // API: Get directives
  if (pathname === '/api/directives' && req.method === 'GET') {
    sendJSON(res, readJSON(DIRECTIVES_FILE));
    return;
  }

  // API: Add directive
  if (pathname === '/api/directives' && req.method === 'POST') {
    parseBody(req, (body) => {
      const directives = readJSON(DIRECTIVES_FILE);
      if (!directives.pending) directives.pending = [];
      const newDir = {
        id: body.id || `dir-${Date.now()}`,
        type: body.type || 'custom',
        target: body.target || null,
        action: body.action || '',
        reason: body.reason || '',
        createdAt: new Date().toISOString(),
      };
      directives.pending.push(newDir);
      writeJSON(DIRECTIVES_FILE, directives);
      sendJSON(res, { success: true, directive: newDir });
    });
    return;
  }

  // API: Delete directive
  if (pathname.startsWith('/api/directives/') && req.method === 'DELETE') {
    const id = pathname.split('/').pop();
    const directives = readJSON(DIRECTIVES_FILE);
    directives.pending = (directives.pending || []).filter(d => d.id !== id);
    writeJSON(DIRECTIVES_FILE, directives);
    sendJSON(res, { success: true });
    return;
  }

  // API: Get inbox
  if (pathname === '/api/inbox' && req.method === 'GET') {
    const state = readJSON(STATE_FILE);
    sendJSON(res, {
      status: state.status,
      awaitingInputSince: state.awaitingInputSince || null,
      questions: state.pendingQuestions || [],
    });
    return;
  }

  // API: Reply to inbox
  if (pathname === '/api/inbox' && req.method === 'POST') {
    parseBody(req, (body) => {
      const replies = readJSON(INBOX_FILE);
      if (!replies.replies) replies.replies = [];
      replies.replies.push({
        questionId: body.questionId,
        answer: body.answer,
        repliedAt: new Date().toISOString(),
      });
      writeJSON(INBOX_FILE, replies);
      sendJSON(res, { success: true });
    });
    return;
  }

  // API: Control (pause/resume/trigger)
  if (pathname.startsWith('/api/control/') && req.method === 'POST') {
    const action = pathname.split('/').pop();
    if (action === 'pause') {
      const state = readJSON(STATE_FILE);
      state.status = 'IDLE';
      writeJSON(STATE_FILE, state);
      sendJSON(res, { success: true, status: 'IDLE' });
    } else if (action === 'trigger') {
      exec('launchctl start com.enlearn.evolution', (err) => {
        if (err) return sendError(res, 'Failed to trigger: ' + err.message);
        sendJSON(res, { success: true, message: 'Triggered evolution run' });
      });
      return;
    } else {
      sendError(res, 'Unknown action: ' + action);
    }
    return;
  }

  // 404
  sendError(res, 'Not found', 404);
});

server.listen(PORT, () => {
  console.log(`🚀 Evolution Dashboard running at http://localhost:${PORT}`);
  console.log(`📁 Project: ${PROJECT_DIR}`);
});
