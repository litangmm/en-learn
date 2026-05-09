/**
 * Unified Evolution Engine Dashboard Server
 * Manages multiple projects from a single UI
 *
 * Usage: node scripts/evolution/dashboard/server.cjs
 * Port: 3456
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

const PORT = 3456;

const PROJECTS = {
  'en-learn': {
    name: 'en-learn',
    label: 'en-learn · React + Vite',
    dir: path.resolve(__dirname, '../../..'),
    launchAgent: 'com.enlearn.evolution',
  },
  'clouth-ai-web': {
    name: 'clouth-ai-web',
    label: 'clouth-ai-web · Vue + Node.js',
    dir: path.resolve(__dirname, '../../../../clouth-ai-web'),
    launchAgent: 'com.clouth.evolution',
  },
};

function getPaths(projectKey) {
  const proj = PROJECTS[projectKey];
  const evoDir = path.join(proj.dir, '.claude/evolution');
  return {
    state: path.join(evoDir, 'state.json'),
    directives: path.join(evoDir, 'directives.json'),
    inbox: path.join(evoDir, 'inbox/replies.json'),
    log: path.join(evoDir, 'log.txt'),
  };
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return {}; }
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

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try { callback(JSON.parse(body || '{}')); }
    catch { callback({}); }
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

  if (pathname === '/' || pathname === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
    res.writeHead(200, { ...CORS, 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (pathname === '/api/health') {
    sendJSON(res, { status: 'ok', projects: Object.keys(PROJECTS) });
    return;
  }

  const projectMatch = pathname.match(/^\/api\/([^/]+)(?:\/(.+))?$/);
  if (!projectMatch) {
    sendError(res, 'Not found', 404);
    return;
  }

  const projectKey = projectMatch[1];
  const subPath = projectMatch[2] || '';

  if (!PROJECTS[projectKey]) {
    sendError(res, 'Unknown project: ' + projectKey, 404);
    return;
  }

  const paths = getPaths(projectKey);

  if (!paths.state) {
    sendError(res, 'Unknown project: ' + projectKey);
    return;
  }

  if (subPath === 'state' && req.method === 'GET') {
    const state = readJSON(paths.state);
    state._project = projectKey;
    sendJSON(res, state);
    return;
  }

  if (subPath === 'directives' && req.method === 'GET') {
    sendJSON(res, readJSON(paths.directives));
    return;
  }

  if (subPath === 'directives' && req.method === 'POST') {
    parseBody(req, (body) => {
      const directives = readJSON(paths.directives);
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
      writeJSON(paths.directives, directives);
      sendJSON(res, { success: true, directive: newDir });
    });
    return;
  }

  if (subPath.startsWith('directives/') && req.method === 'DELETE') {
    const id = subPath.split('/').pop();
    const directives = readJSON(paths.directives);
    directives.pending = (directives.pending || []).filter(d => d.id !== id);
    writeJSON(paths.directives, directives);
    sendJSON(res, { success: true });
    return;
  }

  if (subPath === 'inbox' && req.method === 'GET') {
    const state = readJSON(paths.state);
    sendJSON(res, {
      status: state.status,
      awaitingInputSince: state.awaitingInputSince || null,
      questions: state.pendingQuestions || [],
    });
    return;
  }

  if (subPath === 'inbox' && req.method === 'POST') {
    parseBody(req, (body) => {
      const replies = readJSON(paths.inbox);
      if (!replies.replies) replies.replies = [];
      replies.replies.push({
        questionId: body.questionId,
        answer: body.answer,
        repliedAt: new Date().toISOString(),
      });
      writeJSON(paths.inbox, replies);
      sendJSON(res, { success: true });
    });
    return;
  }

  if (subPath.startsWith('control/') && req.method === 'POST') {
    const action = subPath.split('/').pop();
    const proj = PROJECTS[projectKey];
    if (action === 'pause') {
      const state = readJSON(paths.state);
      state.status = 'IDLE';
      writeJSON(paths.state, state);
      sendJSON(res, { success: true, status: 'IDLE' });
    } else if (action === 'trigger') {
      exec(`launchctl start ${proj.launchAgent}`, (err) => {
        if (err) return sendError(res, 'Failed: ' + err.message);
        sendJSON(res, { success: true, message: 'Triggered' });
      });
      return;
    } else {
      sendError(res, 'Unknown action: ' + action);
    }
    return;
  }

  if (subPath === 'log' && req.method === 'GET') {
    try {
      const text = fs.readFileSync(paths.log, 'utf-8');
      sendJSON(res, { log: text });
    } catch {
      sendJSON(res, { log: 'No log available' });
    }
    return;
  }

  if (subPath === 'releases' && req.method === 'GET') {
    try {
      const releasesPath = path.join(paths.state, '..', 'releases.json');
      const releases = readJSON(releasesPath);
      sendJSON(res, releases);
    } catch {
      sendJSON(res, { version: '1.0', releases: [] });
    }
    return;
  }

  sendError(res, 'Not found', 404);
});

// ─── Secretary Chat ──────────────────────────────────────────

function getProjectSummary(projectKey) {
  const paths = getPaths(projectKey);
  const state = readJSON(paths.state);
  const epic = state.currentEpic;
  const iteration = epic && epic.iterations && epic.currentIterationIndex != null
    ? epic.iterations[epic.currentIterationIndex]
    : null;
  const pendingQs = (state.pendingQuestions || []).filter(q => q.blocking && !q.answer).length;
  return {
    status: state.status || 'IDLE',
    epicId: epic ? epic.id : 'none',
    epicTitle: epic ? epic.title : 'none',
    iterationTitle: iteration ? iteration.title : 'none',
    cycleCount: state.cycleCount || 0,
    pendingQuestions: pendingQs,
  };
}

function buildSecretaryPrompt(userMessage) {
  const e = getProjectSummary('en-learn');
  const c = getProjectSummary('clouth-ai-web');

  return `You are the Secretary of the Evolution Engine. The user is chatting with you via a web UI.

Current project status:
- en-learn (React+Vite English learning app):
  Status: ${e.status}
  Epic: ${e.epicId} — ${e.epicTitle}
  Current iteration: ${e.iterationTitle}
  Completed cycles: ${e.cycleCount}
  Blocking questions: ${e.pendingQuestions}

- clouth-ai-web (Vue+Node.js wardrobe app):
  Status: ${c.status}
  Epic: ${c.epicId} — ${c.epicTitle}
  Current iteration: ${c.iterationTitle}
  Completed cycles: ${c.cycleCount}
  Blocking questions: ${c.pendingQuestions}

You can perform these actions by returning them in the JSON "actions" array:
1. {"type":"directive","project":"en-learn|clouth-ai-web","data":{"type":"skip_to_epic|priority_change|insert_epic|custom","target":"...","action":"...","reason":"..."}}
2. {"type":"reply","project":"...","questionId":"q-xxx","answer":"..."}
3. {"type":"control","project":"...","action":"pause|trigger"}

If the user asks about status, summarize it naturally.
If the user gives a strategic order, translate it into the appropriate action.
If the user asks something general, just reply helpfully.

Respond in Chinese (since the user speaks Chinese).

IMPORTANT: Your entire response must be valid JSON in this exact format:
{"reply":"你的中文回复","actions":[]}

User message: ${userMessage}`;
}

function extractJSON(text) {
  // Try to find JSON object in the response
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); }
  catch { return null; }
}

function handleChat(req, res) {
  parseBody(req, (body) => {
    const msg = (body.message || '').trim();
    if (!msg) return sendError(res, 'Empty message');

    const prompt = buildSecretaryPrompt(msg);

    try {
      const result = execSync(
        `launchctl asuser $(id -u) /Users/litang/.local/bin/claude -p --dangerously-skip-permissions`,
        {
          input: prompt,
          encoding: 'utf-8',
          timeout: 60000,
          env: { ...process.env, PATH: '/Users/litang/.local/bin:/Users/litang/.volta/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin' },
        }
      );

      const parsed = extractJSON(result);
      if (!parsed) {
        // Fallback: treat entire output as reply
        sendJSON(res, { reply: result.trim(), actions: [] });
        return;
      }

      const reply = parsed.reply || '已处理';
      const actions = parsed.actions || [];

      // Execute actions
      const executed = [];
      for (const act of actions) {
        try {
          if (act.type === 'directive') {
            const paths = getPaths(act.project);
            const directives = readJSON(paths.directives);
            if (!directives.pending) directives.pending = [];
            directives.pending.push({
              id: `dir-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
              type: act.data.type || 'custom',
              target: act.data.target || null,
              action: act.data.action || '',
              reason: act.data.reason || 'Secretary added',
              createdAt: new Date().toISOString(),
            });
            writeJSON(paths.directives, directives);
            executed.push({ type: 'directive', project: act.project, ok: true });
          } else if (act.type === 'reply') {
            const paths = getPaths(act.project);
            const replies = readJSON(paths.inbox);
            if (!replies.replies) replies.replies = [];
            replies.replies.push({
              questionId: act.questionId,
              answer: act.answer,
              repliedAt: new Date().toISOString(),
            });
            writeJSON(paths.inbox, replies);
            executed.push({ type: 'reply', project: act.project, ok: true });
          } else if (act.type === 'control') {
            const proj = PROJECTS[act.project];
            if (act.action === 'pause') {
              const paths = getPaths(act.project);
              const state = readJSON(paths.state);
              state.status = 'IDLE';
              writeJSON(paths.state, state);
            } else if (act.action === 'trigger') {
              exec(`launchctl start ${proj.launchAgent}`);
            }
            executed.push({ type: 'control', project: act.project, action: act.action, ok: true });
          }
        } catch (e) {
          executed.push({ type: act.type, project: act.project, ok: false, error: e.message });
        }
      }

      sendJSON(res, { reply, executed });
    } catch (e) {
      sendJSON(res, { reply: 'Claude 调用失败：' + e.message, actions: [], error: true });
    }
  });
}

// Add chat route outside the project-scoped router
const _originalHandler = server.listeners('request')[0];
server.removeAllListeners('request');
server.on('request', (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204); res.end(); return;
    }
    handleChat(req, res);
    return;
  }
  _originalHandler(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Unified Evolution Dashboard`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Projects: en-learn, clouth-ai-web`);
});
