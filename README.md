# TurkeyGuide — Digital Book Sales Platform

A full-stack platform for selling a PDF guide about buying in Turkey. Built with Node.js, Express, SQLite, and Stripe.

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Installation

```bash
# 1. Clone / enter the project
cd TKway

# 2. Install dependencies
npm install

# 3. Copy the environment file
cp .env.example .env
```

Edit `.env` and set a strong `SESSION_SECRET` (any long random string).

---

## Running the App

```bash
node server.js
# or for auto-reload during development:
npm run dev
```

The server starts at **http://localhost:3000**

---

## First Login

Visit **http://localhost:3000/admin/login**

| Username | Password     |
|----------|-------------|
| `admin`  | `changeme123` |

> ⚠️ **Change this password immediately** via Admin → Change Password.

---

## Configure Stripe

1. Create a [Stripe account](https://stripe.com) (test mode is fine to start)
2. Go to **Admin → Payment Settings**
3. Enter your:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)
   - **Product name** and **price** (in cents, e.g. `1999` = $19.99)
4. Click **Save Payment Settings** — the dashboard will confirm the Stripe connection

---

## Upload the Book

1. Go to **Admin → Book Upload**
2. Select your PDF file (max 100MB)
3. Click **Upload PDF**

Once uploaded, the buy button on the landing page becomes active.

---

## Stripe Webhook Setup

To receive payment confirmation events:

1. In your [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks), click **Add endpoint**
2. Set the URL to: `https://yourdomain.com/webhook/stripe`
3. Select event: `checkout.session.completed`
4. Copy the **Webhook signing secret** (starts with `whsec_`)
5. Paste it into **Admin → Payment Settings → Webhook Secret**

For local development, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/webhook/stripe
```

---

## Payment Flow

1. Visitor clicks **Buy** → POST `/checkout/create-session` → redirect to Stripe Checkout
2. After payment → Stripe redirects to `/?payment=success&session_id=...`
3. Client JS retrieves stored download token from `sessionStorage`
4. Auto-redirect to `/download?token=...` → PDF streams as a download
5. Token is single-use and expires after 24 hours

---

## Content Editing

All landing page text is editable live via **Admin → Content Editor** — no restart needed. Changes appear on the site immediately.

---

## Deployment (VPS / Railway / Render)

### Environment variables to set in production

```
PORT=3000
SESSION_SECRET=<long random string>
SITE_URL=https://yourdomain.com
NODE_ENV=production
```

### Nginx reverse proxy (VPS)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Railway / Render

- Set the environment variables above in the platform dashboard
- Build command: `npm install`
- Start command: `node server.js`
- The `data/` directory (SQLite) will be ephemeral on free tiers — use a persistent volume or upgrade

---

## Security Notes

- Admin routes are session-protected — unauthenticated requests redirect to `/admin/login`
- Book PDFs are never served directly from `/uploads` — only via signed, single-use, time-limited download tokens
- Stripe secret key is stored in the database and never sent to the browser
- All admin forms are CSRF-protected
- Rate limiting: 5 login attempts/min, 10 checkout attempts/min per IP

---

## Project Structure

```
├── server.js           Entry point
├── database.js         SQLite schema, migrations, seeds
├── routes/
│   ├── public.js       Landing page + download endpoint
│   ├── payment.js      Stripe checkout session creation
│   ├── webhook.js      Stripe webhook handler
│   └── admin.js        Admin dashboard (all protected routes)
├── middleware/
│   └── auth.js         Session guard
├── public/
│   ├── index.html      Landing page shell
│   ├── assets/
│   │   ├── style.css   Landing page styles
│   │   ├── main.js     Client-side rendering + Stripe flow
│   │   ├── admin.css   Admin dashboard styles
│   │   └── admin.js    Admin dashboard logic
│   └── admin/
│       ├── login.html
│       └── dashboard.html
├── uploads/books/      PDF files (gitignored)
└── data/               SQLite database (gitignored)
```
