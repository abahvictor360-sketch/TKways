const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Add it in Vercel → Settings → Environment Variables.');
}

const sql = neon(process.env.DATABASE_URL);

// ── Schema + seeds (run once per cold start, idempotent) ─────────────────────
async function initDb() {
  // Tables
  await sql`
    CREATE TABLE IF NOT EXISTS site_content (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS book (
      id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      filename      TEXT,
      original_name TEXT,
      file_path     TEXT,
      file_size     BIGINT,
      uploaded_at   TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payment_settings (
      id                     INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      stripe_publishable_key TEXT NOT NULL DEFAULT '',
      stripe_secret_key      TEXT NOT NULL DEFAULT '',
      stripe_webhook_secret  TEXT NOT NULL DEFAULT '',
      product_name           TEXT NOT NULL DEFAULT 'Turkey Buying Guide',
      price_usd_cents        INTEGER NOT NULL DEFAULT 1999,
      updated_at             TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id            SERIAL PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS download_tokens (
      id                TEXT PRIMARY KEY,
      stripe_session_id TEXT NOT NULL,
      used              BOOLEAN NOT NULL DEFAULT FALSE,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      expires_at        TIMESTAMPTZ NOT NULL
    )
  `;

  // ── Seeds ──────────────────────────────────────────────────────────────────

  // Admin user (only if none exists)
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM admin_users`;
  if (count === 0) {
    const hash = bcrypt.hashSync('changeme123', 10);
    await sql`INSERT INTO admin_users (username, password_hash) VALUES ('admin', ${hash})`;
  }

  // Singleton rows
  await sql`INSERT INTO payment_settings (id) VALUES (1) ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO book (id) VALUES (1) ON CONFLICT DO NOTHING`;

  // Default landing page content
  const defaults = {
    hero: {
      headline: 'The Ultimate Guide to Buying in Turkey',
      subheadline: 'Everything you need to know — real estate, carpets, gold, electronics, and more — from a local expert.',
      price: '19.99',
      original_price: '39.99',
      cta_text: 'Get the Guide Now'
    },
    stats: {
      items: [
        { number: '200+', label: 'Pages of Expert Content' },
        { number: '50+',  label: 'Product Categories Covered' },
        { number: '15',   label: 'Years of Local Knowledge' },
        { number: '10K+', label: 'Happy Readers' }
      ]
    },
    chapters: {
      items: [
        { number: '01', title: 'Navigating Turkish Markets',  description: 'Master the art of the bazaar — from the Grand Bazaar to modern malls.' },
        { number: '02', title: 'Buying Gold & Jewelry',       description: 'Understand karats, hallmarks, and how to get the best price on fine jewelry.' },
        { number: '03', title: 'Carpets & Kilims',            description: 'Identify authentic handmade pieces and avoid common tourist traps.' },
        { number: '04', title: 'Real Estate & Property',      description: 'Step-by-step guide to legally purchasing property as a foreigner.' },
        { number: '05', title: 'Electronics & Technology',    description: 'What to buy locally vs. what to bring from home — with price comparisons.' },
        { number: '06', title: 'Food, Spices & Souvenirs',    description: 'The best edible and artisan gifts, and how to bring them home safely.' }
      ]
    },
    bonus_topics: {
      title: 'Bonus: Insider Tips',
      body: 'Get access to exclusive negotiation scripts, seasonal buying calendars, and a curated list of trusted vendors in Istanbul, Ankara, and Antalya.',
      pills: ['Negotiation Scripts', 'Vendor Directory', 'Seasonal Calendar', 'Currency Guide', 'Customs Rules']
    },
    testimonials: {
      items: [
        { initials: 'SR', name: 'Sarah R.',   location: 'New York, USA',    text: 'Saved me thousands on my apartment purchase. The legal chapter alone was worth 10x the price.' },
        { initials: 'MK', name: 'Michael K.', location: 'London, UK',       text: 'Finally bought a genuine handmade carpet without getting ripped off. This guide is essential.' },
        { initials: 'AJ', name: 'Anika J.',   location: 'Toronto, Canada',  text: 'The gold buying section is incredibly detailed. I felt confident walking into any jeweler.' }
      ]
    },
    purchase_card: {
      title: 'Get Instant Access',
      subtitle: 'One-time payment. Immediate PDF download.',
      features: [
        'Complete 200+ page PDF guide',
        'Lifetime access — yours to keep',
        'All product categories covered',
        'Trusted vendor directory',
        'Negotiation phrase guide',
        '30-day money-back guarantee'
      ]
    },
    faq: {
      items: [
        { question: 'How do I receive the guide?',              answer: 'Immediately after payment you will be redirected to download your PDF.' },
        { question: 'Is this guide current?',                   answer: 'Yes — updated for 2024/2025 with the latest pricing, regulations, and vendor recommendations.' },
        { question: 'What format is the guide?',               answer: 'A high-quality PDF, readable on any device — phone, tablet, laptop, or e-reader.' },
        { question: 'Do you offer refunds?',                    answer: 'Yes. If you are not satisfied within 30 days of purchase, contact us for a full refund, no questions asked.' },
        { question: 'Is buying as a foreigner in Turkey legal?', answer: 'Yes — with the right paperwork. The guide covers exactly what documents you need for every category.' }
      ]
    },
    footer: {
      brand_name: 'TurkeyGuide',
      tagline: 'Your trusted companion for buying in Turkey.',
      email: 'support@turkeyguide.com',
      copyright: '© 2025 TurkeyGuide. All rights reserved.'
    }
  };

  for (const [key, value] of Object.entries(defaults)) {
    await sql`
      INSERT INTO site_content (key, value)
      VALUES (${key}, ${JSON.stringify(value)})
      ON CONFLICT DO NOTHING
    `;
  }
}

module.exports = { sql, initDb };
