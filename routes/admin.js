const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csurf = require('csurf');
const rateLimit = require('express-rate-limit');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const csrfProtection = csurf({ cookie: false });

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.'
});

const VALID_SECTIONS = ['hero', 'stats', 'chapters', 'bonus_topics', 'testimonials', 'purchase_card', 'faq', 'footer'];

// ── Multer setup ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/books')),
  filename: (req, file, cb) => cb(null, `book-${Date.now()}.pdf`)
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// ── Helper: inject data into HTML ─────────────────────────────────────────────
function injectIntoHtml(htmlPath, scriptTag) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace('</head>', scriptTag + '\n</head>');
  return html;
}

// ── GET /admin/login ──────────────────────────────────────────────────────────
router.get('/login', csrfProtection, (req, res) => {
  if (req.session && req.session.adminId) return res.redirect('/admin');
  const html = injectIntoHtml(
    path.join(__dirname, '../public/admin/login.html'),
    `<script>window.__CSRF__ = "${req.csrfToken()}";</script>`
  );
  // Also inject CSRF hidden input into the login form
  res.send(html.replace('<!--CSRF_TOKEN-->', `<input type="hidden" name="_csrf" value="${req.csrfToken()}">`));
});

// ── POST /admin/login ─────────────────────────────────────────────────────────
router.post('/login', loginLimiter, csrfProtection, (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.redirect('/admin/login?error=invalid');
  }
  req.session.adminId = user.id;
  req.session.adminUsername = user.username;
  res.redirect('/admin');
});

// ── GET /admin/logout ─────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ── All routes below require authentication ───────────────────────────────────
router.use(requireAuth);
router.use(csrfProtection);

// ── GET /admin ────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const allContent = db.prepare('SELECT key, value FROM site_content').all();
  const contentMap = {};
  for (const row of allContent) {
    try { contentMap[row.key] = JSON.parse(row.value); } catch { contentMap[row.key] = {}; }
  }

  const book = db.prepare('SELECT * FROM book WHERE id = 1').get() || {};
  const payment = db.prepare('SELECT stripe_publishable_key, stripe_secret_key, product_name, price_usd_cents FROM payment_settings WHERE id = 1').get() || {};

  const adminData = {
    content: contentMap,
    book: {
      filename: book.filename || null,
      originalName: book.original_name || null,
      fileSize: book.file_size || null,
      uploadedAt: book.uploaded_at || null
    },
    payment: {
      publishableKey: payment.stripe_publishable_key || '',
      secretKeyMasked: payment.stripe_secret_key ? '••••••••' + payment.stripe_secret_key.slice(-4) : '',
      productName: payment.product_name || '',
      priceUsdCents: payment.price_usd_cents || 1999,
      stripeConfigured: !!(payment.stripe_publishable_key && payment.stripe_secret_key)
    },
    username: req.session.adminUsername
  };

  const html = injectIntoHtml(
    path.join(__dirname, '../public/admin/dashboard.html'),
    `<script>window.__ADMIN_DATA__ = ${JSON.stringify(adminData)}; window.__CSRF_TOKEN__ = "${req.csrfToken()}";</script>`
  );
  res.send(html);
});

// ── GET /admin/content — JSON endpoint ───────────────────────────────────────
router.get('/content', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_content').all();
  const result = {};
  for (const row of rows) {
    try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = {}; }
  }
  res.json({ success: true, content: result });
});

// ── POST /admin/content/:key ──────────────────────────────────────────────────
router.post('/content/:key', (req, res) => {
  const { key } = req.params;
  if (!VALID_SECTIONS.includes(key)) {
    return res.status(400).json({ success: false, error: 'Invalid section key.' });
  }
  try {
    const value = JSON.stringify(req.body);
    db.prepare('UPDATE site_content SET value = ?, updated_at = datetime(\'now\') WHERE key = ?').run(value, key);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /admin/book/upload ───────────────────────────────────────────────────
router.post('/book/upload', (req, res) => {
  upload.single('book')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    // Magic-byte validation: PDF starts with %PDF (0x25 0x50 0x44 0x46)
    const fd = fs.openSync(req.file.path, 'r');
    const magic = Buffer.alloc(4);
    fs.readSync(fd, magic, 0, 4, 0);
    fs.closeSync(fd);

    if (magic.toString('ascii') !== '%PDF') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'File is not a valid PDF.' });
    }

    // Delete previous book file if different
    const existing = db.prepare('SELECT file_path FROM book WHERE id = 1').get();
    if (existing && existing.file_path && existing.file_path !== req.file.path && fs.existsSync(existing.file_path)) {
      fs.unlinkSync(existing.file_path);
    }

    db.prepare(`
      UPDATE book SET
        filename      = ?,
        original_name = ?,
        file_path     = ?,
        file_size     = ?,
        uploaded_at   = datetime('now')
      WHERE id = 1
    `).run(req.file.filename, req.file.originalname, req.file.path, req.file.size);

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size
      }
    });
  });
});

// ── DELETE /admin/book ────────────────────────────────────────────────────────
router.delete('/book', (req, res) => {
  const book = db.prepare('SELECT file_path FROM book WHERE id = 1').get();
  if (book && book.file_path && fs.existsSync(book.file_path)) {
    fs.unlinkSync(book.file_path);
  }
  db.prepare('UPDATE book SET filename = NULL, original_name = NULL, file_path = NULL, file_size = NULL, uploaded_at = NULL WHERE id = 1').run();
  res.json({ success: true });
});

// ── POST /admin/payment ───────────────────────────────────────────────────────
router.post('/payment', async (req, res) => {
  const { stripe_publishable_key, stripe_secret_key, stripe_webhook_secret, product_name, price_usd_cents } = req.body;

  if (stripe_publishable_key && !stripe_publishable_key.startsWith('pk_')) {
    return res.status(400).json({ success: false, error: 'Publishable key must start with pk_' });
  }
  if (stripe_secret_key && !stripe_secret_key.startsWith('sk_')) {
    return res.status(400).json({ success: false, error: 'Secret key must start with sk_' });
  }

  const current = db.prepare('SELECT * FROM payment_settings WHERE id = 1').get();
  const pubKey  = stripe_publishable_key  || current.stripe_publishable_key;
  const secKey  = stripe_secret_key       || current.stripe_secret_key;
  const whSecret = stripe_webhook_secret  || current.stripe_webhook_secret;
  const pName   = product_name            || current.product_name;
  const price   = parseInt(price_usd_cents, 10) || current.price_usd_cents;

  db.prepare(`
    UPDATE payment_settings SET
      stripe_publishable_key = ?,
      stripe_secret_key      = ?,
      stripe_webhook_secret  = ?,
      product_name           = ?,
      price_usd_cents        = ?,
      updated_at             = datetime('now')
    WHERE id = 1
  `).run(pubKey, secKey, whSecret, pName, price);

  let connected = false;
  if (secKey) {
    try {
      const Stripe = require('stripe');
      const stripe = Stripe(secKey);
      await stripe.accounts.retrieve();
      connected = true;
    } catch {
      connected = false;
    }
  }

  res.json({ success: true, connected });
});

// ── POST /admin/change-password ───────────────────────────────────────────────
router.post('/change-password', (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  if (new_password !== confirm_password) {
    return res.status(400).json({ success: false, error: 'New passwords do not match.' });
  }
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.session.adminId);
  if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
  res.json({ success: true });
});

module.exports = router;
