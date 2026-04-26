const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const FILE = path.join(__dirname, 'index.html');
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { users: {} }; }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/login' && req.method === 'POST') {
    const { username } = await parseBody(req);
    const name = (username || '').trim();
    if (name.length < 2) return json(res, 400, { error: 'Mindestens 2 Zeichen erforderlich.' });
    const store = loadData();
    const isNew = !store.users[name];
    if (isNew) {
      store.users[name] = { created: new Date().toISOString(), lastSeen: new Date().toISOString(), assessment: {} };
    } else {
      store.users[name].lastSeen = new Date().toISOString();
    }
    saveData(store);
    return json(res, 200, { username: name, assessment: store.users[name].assessment, isNew });
  }

  if (url.pathname.startsWith('/api/assessment/') && req.method === 'POST') {
    const username = decodeURIComponent(url.pathname.slice('/api/assessment/'.length));
    const { assessment } = await parseBody(req);
    const store = loadData();
    if (!store.users[username]) return json(res, 404, { error: 'Benutzer nicht gefunden.' });
    store.users[username].assessment = assessment;
    store.users[username].lastSeen = new Date().toISOString();
    saveData(store);
    return json(res, 200, { ok: true });
  }

  if ((url.pathname === '/' || url.pathname === '/index.html') && req.method === 'GET') {
    fs.readFile(FILE, (err, data) => {
      if (err) { res.writeHead(500); return res.end('Server error'); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}).listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
