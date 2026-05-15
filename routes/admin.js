const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const csurf      = require('csurf');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const fs         = require('fs');
const { handleUpload } = require('@vercel/blob/client');
const { del }    = require('@vercel/blob');

const { sql }    = require('../database');
const { requireAuth, signAdminToken, COOKIE_NAME } = require('../middleware/auth');

// CSRF uses a cookie (no server-side session needed)
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax' } });

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.'
});

const VALID_SECTIONS = ['hero', 'stats', 'chapters', 'bonus_topics', 'testimonials', 'purchase_card', 'faq', 'footer'];

// ── Helper: inject <script> into HTML ─────────────────────────────────────────
function injectIntoHtml(htmlPath, scriptTag) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace('</head>', scriptTag + '\n</head>');
  return html;
}

// ── GET /admin/login ──────────────────────────────────────────────────────────
router.get('/login', csrfProtection, (req, res) => {
  // If already logged in via valid JWT cookie, redirect to dashboard
  const { requireAuth: _check, ...rest } = require('../middleware/auth');
  const jwt = require('jsonwebtoken');
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production');
      return res.redirect('/admin');
    } catch {}
  }

  const html = injectIntoHtml(
    path.join(__dirname, '../public/admin/login.html'),
    `<script>window.__CSRF__ = "${req.csrfToken()}";</script>`
  );
  res.send(html.replace('<!--CSRF_TOKEN-->', `<input type="hidden" name="_csrf" value="${req.csrfToken()}">`));
});

// ── POST /admin/login ─────────────────────────────────────────────────────────
router.post('/login', loginLimiter, csrfProtection, async (req, res) => {
  const { username, password } = req.body;
  const rows = await sql`SELECT * FROM admin_users WHERE username = ${username}`;
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.redirect('/admin/login?error=invalid');
  }
  const token = signAdminToken(user);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  res.redirect('/admin');
});

// ── GET /admin/logout ─────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect('/admin/login');
});

// ── Book upload (Vercel Blob client upload) ───────────────────────────────────
// Placed BEFORE requireAuth middleware — auth is verified manually inside
// onBeforeGenerateToken so the Vercel callback can hit onUploadCompleted freely.
router.post('/book/upload', express.json(), async (req, res) => {
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Verify admin JWT for the token-generation leg
        const jwt = require('jsonwebtoken');
        const adminToken = req.cookies && req.cookies[COOKIE_NAME];
        if (!adminToken) throw new Error('Not authenticated');
        jwt.verify(adminToken, process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production');

        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Delete old blob if it exists and is different
        const [existing] = await sql`SELECT file_path FROM book WHERE id = 1`;
        if (existing?.file_path && existing.file_path !== blob.url) {
          try { await del(existing.file_path); } catch {}
        }
        const originalName = blob.pathname.split('/').pop();
        await sql`
          UPDATE book SET
            filename      = ${blob.pathname},
            original_name = ${originalName},
            file_path     = ${blob.url},
            file_size     = ${blob.size || 0},
            uploaded_at   = NOW()
          WHERE id = 1
        `;
      },
    });
    return res.json(jsonResponse);
  } catch (err) {
    console.error('Book upload error:', err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ── All routes below require authentication ───────────────────────────────────
router.use(requireAuth);
router.use(csrfProtection);

// ── GET /admin ────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const rows = await sql`SELECT key, value FROM site_content`;
  const contentMap = {};
  for (const row of rows) {
    try { contentMap[row.key] = JSON.parse(row.value); } catch { contentMap[row.key] = {}; }
  }

  const [book]    = await sql`SELECT * FROM book WHERE id = 1`;
  const [payment] = await sql`SELECT stripe_publishable_key, stripe_secret_key, product_name, price_usd_cents FROM payment_settings WHERE id = 1`;

  const adminData = {
    content: contentMap,
    book: {
      filename:     book?.filename     || null,
      originalName: book?.original_name || null,
      fileSize:     book?.file_size    || null,
      uploadedAt:   book?.uploaded_at  || null
    },
    payment: {
      publishableKey:   payment?.stripe_publishable_key || '',
      secretKeyMasked:  payment?.stripe_secret_key ? '••••••••' + payment.stripe_secret_key.slice(-4) : '',
      productName:      payment?.product_name   || '',
      priceUsdCents:    payment?.price_usd_cents || 1999,
      stripeConfigured: !!(payment?.stripe_publishable_key && payment?.stripe_secret_key)
    },
    username: req.adminUsername
  };

  const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
  adminData.webhookUrl = `${siteUrl}/webhook/stripe`;

  const html = injectIntoHtml(
    path.join(__dirname, '../public/admin/dashboard.html'),
    `<script>window.__ADMIN_DATA__ = ${JSON.stringify(adminData)}; window.__CSRF_TOKEN__ = "${req.csrfToken()}";</script>`
  );
  res.send(html);
});

// ── GET /admin/content ────────────────────────────────────────────────────────
router.get('/content', async (req, res) => {
  const rows = await sql`SELECT key, value FROM site_content`;
  const result = {};
  for (const row of rows) {
    try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = {}; }
  }
  res.json({ success: true, content: result });
});

// ── POST /admin/content/:key ──────────────────────────────────────────────────
router.post('/content/:key', async (req, res) => {
  const { key } = req.params;
  if (!VALID_SECTIONS.includes(key)) {
    return res.status(400).json({ success: false, error: 'Invalid section key.' });
  }
  try {
    const value = JSON.stringify(req.body);
    await sql`UPDATE site_content SET value = ${value}, updated_at = NOW() WHERE key = ${key}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /admin/book/status ────────────────────────────────────────────────────
router.get('/book/status', async (req, res) => {
  const [book] = await sql`SELECT filename, original_name, file_size, uploaded_at FROM book WHERE id = 1`;
  res.json({
    success: true,
    book: book?.filename ? {
      filename:     book.filename,
      originalName: book.original_name,
      fileSize:     book.file_size,
      uploadedAt:   book.uploaded_at
    } : null
  });
});

// ── DELETE /admin/book ────────────────────────────────────────────────────────
router.delete('/book', async (req, res) => {
  const [book] = await sql`SELECT file_path FROM book WHERE id = 1`;
  if (book?.file_path) {
    try { await del(book.file_path); } catch (e) { console.warn('Blob delete failed:', e.message); }
  }
  await sql`UPDATE book SET filename = NULL, original_name = NULL, file_path = NULL, file_size = NULL, uploaded_at = NULL WHERE id = 1`;
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

  const [current] = await sql`SELECT * FROM payment_settings WHERE id = 1`;
  const pubKey   = stripe_publishable_key || current.stripe_publishable_key;
  const secKey   = stripe_secret_key      || current.stripe_secret_key;
  const whSecret = stripe_webhook_secret  || current.stripe_webhook_secret;
  const pName    = product_name           || current.product_name;
  const price    = parseInt(price_usd_cents, 10) || current.price_usd_cents;

  await sql`
    UPDATE payment_settings SET
      stripe_publishable_key = ${pubKey},
      stripe_secret_key      = ${secKey},
      stripe_webhook_secret  = ${whSecret},
      product_name           = ${pName},
      price_usd_cents        = ${price},
      updated_at             = NOW()
    WHERE id = 1
  `;

  let connected = false;
  if (secKey) {
    try {
      const Stripe = require('stripe');
      await Stripe(secKey).accounts.retrieve();
      connected = true;
    } catch {}
  }
  res.json({ success: true, connected });
});

// ── POST /admin/change-password ───────────────────────────────────────────────
router.post('/change-password', async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  if (new_password !== confirm_password) {
    return res.status(400).json({ success: false, error: 'New passwords do not match.' });
  }
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
  }

  const [user] = await sql`SELECT * FROM admin_users WHERE id = ${req.adminId}`;
  if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  await sql`UPDATE admin_users SET password_hash = ${newHash} WHERE id = ${user.id}`;
  res.json({ success: true });
});

module.exports = router;
