import { jwtVerify } from 'jose';

export default async function handler(req, res) {
  const token = req.cookies?.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    res.json({ name: payload.name, email: payload.email, picture: payload.picture });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
