const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { sql } = require('../database');

// ── POST /checkout/create-session ─────────────────────────────────────────────
router.post('/create-session', async (req, res) => {
  const [payment] = await sql`SELECT * FROM payment_settings WHERE id = 1`;
  if (!payment?.stripe_secret_key) {
    return res.status(503).json({ success: false, error: 'Payment not configured yet.' });
  }

  const [book] = await sql`SELECT filename FROM book WHERE id = 1`;
  if (!book?.filename) {
    return res.status(503).json({ success: false, error: 'Book not available yet.' });
  }

  const Stripe    = require('stripe');
  const stripe    = Stripe(payment.stripe_secret_key);
  const siteUrl   = process.env.SITE_URL || `https://${req.headers.host}`;
  const dlToken   = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: payment.price_usd_cents,
          product_data: { name: payment.product_name || 'Turkey Buying Guide' }
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${siteUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/?payment=cancelled`
    });
  } catch (err) {
    console.error('Stripe session error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to create checkout session.' });
  }

  await sql`
    INSERT INTO download_tokens (id, stripe_session_id, expires_at)
    VALUES (${dlToken}, ${session.id}, ${expiresAt})
  `;

  res.json({ success: true, sessionId: session.id, checkoutUrl: session.url, downloadToken: dlToken });
});

module.exports = router;
