import { SignJWT } from 'jose';

function extractUser(raw) {
  let value = raw;
  for (let i = 0; i < 3 && typeof value === 'string'; i++) {
    try { value = JSON.parse(value); } catch { break; }
  }

  if (typeof value !== 'object' || value === null) return null;

  if (typeof value.value === 'string' && value.value.includes('.')) {
    try {
      const parts = value.value.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64url').toString('utf-8')
        );
        if (payload.email) {
          return { email: payload.email, name: payload.name, picture: payload.picture };
        }
      }
    } catch {}
  }

  if (value.email) {
    return { email: value.email, name: value.name, picture: value.picture };
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { profile } = req.body;
    const user = extractUser(profile);

    if (!user) {
      return res.status(400).json({ error: 'invalid_profile' });
    }

    if (!user.email.endsWith('@alegra.com')) {
      return res.status(403).json({ error: 'domain_not_allowed', email: user.email });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = await new SignJWT({ email: user.email, name: user.name, picture: user.picture })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .sign(secret);

    res.setHeader('Set-Cookie', `auth_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${60 * 60 * 24 * 365}`);
    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ error: 'server_error' });
  }
}
