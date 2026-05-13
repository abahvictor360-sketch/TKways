const db = require('../database');

// Handles POST /webhook/stripe
// Registered in server.js with express.raw() BEFORE express.json() is applied globally
module.exports = async function stripeWebhook(req, res) {
  const payment = db.prepare('SELECT stripe_webhook_secret, stripe_secret_key FROM payment_settings WHERE id = 1').get();
  if (!payment || !payment.stripe_secret_key) {
    return res.sendStatus(200);
  }

  const Stripe = require('stripe');
  const stripe = Stripe(payment.stripe_secret_key);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, payment.stripe_webhook_secret || '');
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`[Webhook] Payment completed — session: ${session.id}`);
  }

  res.sendStatus(200);
};
