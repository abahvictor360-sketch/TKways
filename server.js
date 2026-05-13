require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Run DB migrations + seeds on startup
require('./database');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "https://js.stripe.com", "'unsafe-inline'"],
      styleSrc:   ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      frameSrc:   ["https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      imgSrc:     ["'self'", "data:", "https:"]
    }
  }
}));

// ── Stripe webhook MUST be before express.json() (needs raw body) ─────────────
const stripeWebhook = require('./routes/webhook');
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Session ───────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: JSON.stringify({ success: false, error: 'Too many requests. Please try again in a minute.' })
});

// ── Routes ────────────────────────────────────────────────────────────────────
const publicRoutes  = require('./routes/public');
const paymentRoutes = require('./routes/payment');
const adminRoutes   = require('./routes/admin');

app.use('/checkout', checkoutLimiter, paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(403).json({ success: false, error: 'Form tampered with. Please refresh and try again.' });
    }
    return res.status(403).send('Form tampered with. Please refresh and try again.');
  }
  console.error(err.stack);
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
  res.status(500).send('Internal server error.');
});

app.use((req, res) => res.status(404).send('Not found.'));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TurkeyGuide running  → http://localhost:${PORT}`);
  console.log(`Admin panel          → http://localhost:${PORT}/admin/login`);
});
