const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../database');

// ── GET / — Landing page ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_content').all();
  const siteData = {};
  for (const row of rows) {
    try { siteData[row.key] = JSON.parse(row.value); } catch { siteData[row.key] = {}; }
  }

  const payment = db.prepare('SELECT stripe_publishable_key, price_usd_cents, product_name FROM payment_settings WHERE id = 1').get() || {};
  const book = db.prepare('SELECT id, filename FROM book WHERE id = 1').get() || {};

  const paymentPublic = {
    publishableKey: payment.stripe_publishable_key || '',
    priceUsdCents: payment.price_usd_cents || 1999,
    productName: payment.product_name || 'Turkey Buying Guide',
    bookAvailable: !!(book && book.filename),
    stripeConfigured: !!(payment.stripe_publishable_key)
  };

  let html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  const inject = `<script>
window.__SITE_DATA__ = ${JSON.stringify(siteData)};
window.__PAYMENT__ = ${JSON.stringify(paymentPublic)};
</script>`;
  html = html.replace('</head>', inject + '\n</head>');

  res.send(html);
});

// ── GET /download — Secure PDF download via token ─────────────────────────────
router.get('/download', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.redirect('/?error=invalid_token');

  const record = db.prepare('SELECT * FROM download_tokens WHERE id = ?').get(token);
  if (!record) return res.redirect('/?error=invalid_token');
  if (record.used) return res.redirect('/?error=token_used');

  const now = new Date().toISOString();
  if (record.expires_at < now) return res.redirect('/?error=token_expired');

  const payment = db.prepare('SELECT stripe_secret_key FROM payment_settings WHERE id = 1').get();
  if (!payment || !payment.stripe_secret_key) return res.redirect('/?error=not_configured');

  try {
    const Stripe = require('stripe');
    const stripe = Stripe(payment.stripe_secret_key);
    const session = await stripe.checkout.sessions.retrieve(record.stripe_session_id);
    if (session.payment_status !== 'paid') return res.redirect('/?error=payment_not_verified');
  } catch (err) {
    console.error('Stripe verify error:', err.message);
    return res.redirect('/?error=verification_failed');
  }

  const bookRow = db.prepare('SELECT file_path, original_name FROM book WHERE id = 1').get();
  if (!bookRow || !bookRow.file_path) return res.redirect('/?error=no_book');
  if (!fs.existsSync(bookRow.file_path)) return res.redirect('/?error=file_missing');

  db.prepare('UPDATE download_tokens SET used = 1 WHERE id = ?').run(token);

  const filename = bookRow.original_name || 'turkey-guide.pdf';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  fs.createReadStream(bookRow.file_path).pipe(res);
});

module.exports = router;
