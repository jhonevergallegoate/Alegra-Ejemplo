import { jwtVerify } from 'jose';
import { readFileSync } from 'fs';
import { join } from 'path';

function parseCookies(cookieHeader = '') {
  const map = {};
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) map[k.trim()] = decodeURIComponent(v.join('='));
  }
  return map;
}

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token   = cookies.auth_token;

  if (!token) return res.redirect('/login');

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
  } catch {
    return res.redirect('/login');
  }

  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(html);
}
