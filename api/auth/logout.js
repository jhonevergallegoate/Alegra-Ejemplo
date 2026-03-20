export default function handler(req, res) {
  res.setHeader(
    'Set-Cookie',
    'auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
  );
  res.redirect('/login');
}
