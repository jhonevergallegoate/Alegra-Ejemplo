import { SignJWT } from 'jose';

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect('/login?error=oauth_denied');
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host;
  const base  = process.env.APP_URL || `${proto}://${host}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  `${base}/api/auth/callback`,
      grant_type:    'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokens.access_token) {
    return res.redirect('/login?error=token_failed');
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json();

  if (!user.email || !user.email.endsWith('@alegra.com')) {
    return res.redirect('/login?error=domain_not_allowed');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const jwt = await new SignJWT({ email: user.email, name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(secret);

  const isSecure = base.startsWith('https');
  res.setHeader(
    'Set-Cookie',
    `auth_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=${isSecure ? 'None' : 'Lax'}; Max-Age=${60 * 60 * 24 * 365}`
  );
  res.redirect('/');
}
