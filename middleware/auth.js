const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const COOKIE_NAME = 'admin_token';

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.redirect('/admin/login');

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.adminId       = payload.id;
    req.adminUsername = payload.username;
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    res.redirect('/admin/login');
  }
}

function signAdminToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { requireAuth, signAdminToken, COOKIE_NAME };
