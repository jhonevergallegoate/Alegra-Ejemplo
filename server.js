// Dev server local
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

// Cargar .env.local
const envFile = join(process.cwd(), '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
  }
}

// Importar handlers de API
const handlers = {
  '/api/auth/login':    (await import('./api/auth/login.js')).default,
  '/api/auth/callback': (await import('./api/auth/callback.js')).default,
  '/api/auth/embed':    (await import('./api/auth/embed.js')).default,
  '/api/auth/me':       (await import('./api/auth/me.js')).default,
  '/api/auth/logout':   (await import('./api/auth/logout.js')).default,
  '/':                  (await import('./api/serve.js')).default,
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const STATIC = {
  '/login':        'login.html',
  '/favicon.png':  'favicon.png',
  '/logo.png':     'logo.png',
  '/logo-verde.png': 'logo-verde.png',
};

function makeReq(req, body, pathname, searchParams) {
  const cookies = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) cookies[k.trim()] = decodeURIComponent(v.join('='));
  }
  req.query   = Object.fromEntries(searchParams);
  req.body    = body;
  req.cookies = cookies;
  return req;
}

function makeRes(res) {
  const _setHeader = res.setHeader.bind(res);
  const _end       = res.end.bind(res);

  res.status   = (code) => { res.statusCode = code; return res; };
  res.setHeader = (k, v) => { _setHeader(k, v); return res; };
  res.json     = (data) => { _setHeader('Content-Type', 'application/json'); _end(JSON.stringify(data)); };
  res.send     = (body) => { _end(body); };
  res.redirect = (url)  => { res.statusCode = 302; _setHeader('Location', url); _end(); };
  return res;
}

const server = createServer(async (req, res) => {
  const url      = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // Archivos estáticos
  if (STATIC[pathname]) {
    const file = join(process.cwd(), STATIC[pathname]);
    if (existsSync(file)) {
      const ext = extname(STATIC[pathname]);
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      return res.end(readFileSync(file));
    }
  }

  const handler = handlers[pathname] ?? handlers['/'];
  if (!handler) { res.statusCode = 404; return res.end('Not found'); }

  let body = {};
  if (req.method === 'POST') {
    const raw = await new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)); });
    try { body = JSON.parse(raw); } catch { body = {}; }
  }

  try {
    await handler(makeReq(req, body, pathname, url.searchParams), makeRes(res));
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.end('Server error');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
