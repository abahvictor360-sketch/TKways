/* ═══════════════════════════════════════════════════════════════════
   TurkeyGuide — Landing page client
   UI/UX Pro Max rules applied:
   ✓ No emojis — all icons are inline SVG (Heroicons/Lucide style)
   ✓ cursor-pointer on all clickable elements
   ✓ Hover states 150–300ms transitions
   ✓ Focus states visible (focus-visible)
   ✓ prefers-reduced-motion respected (via CSS)
   ✓ Touch targets ≥ 44px
   ✓ Loading state on buy button
   ✓ Error feedback near problem
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const S = window.__SITE_DATA__ || {};
  const P = window.__PAYMENT__   || {};

  /* ── SVG icon library (no emojis per skill rule) ──────────────────── */
  const ICONS = {
    lock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
    arrow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
    star: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    download: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    spin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true" style="animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
    shield: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    gift: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>`,
    book: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
    map: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
    plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    mail: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    flag: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  };

  /* ── Toast ────────────────────────────────────────────────────────── */
  function showToast(msg, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast ' + (type || '');
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
  }

  /* ── Escape helpers ───────────────────────────────────────────────── */
  function esc(s) {
    return String(s ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function escAttr(s) { return esc(s); }

  /* ── Buy availability ─────────────────────────────────────────────── */
  function applyBuyState() {
    const unavailable = !P.bookAvailable || !P.stripeConfigured;
    document.querySelectorAll('.btn-buy').forEach(btn => {
      btn.disabled = unavailable;
    });
    document.querySelectorAll('#maintenance-msg, #maintenance-msg2').forEach(el => {
      if (el) el.style.display = unavailable ? 'block' : 'none';
    });
  }

  /* ── Renderers ────────────────────────────────────────────────────── */

  function renderTopbar() {
    const el = document.getElementById('topbar');
    if (!el) return;
    const h = S.hero || {};
    el.innerHTML = `
      <div class="topbar-brand">
        ${ICONS.flag}
        <span>TurkeyGuide</span>
      </div>
      <p class="topbar-offer">
        Limited offer — get the complete guide for only <strong>$${esc(h.price || '19.99')}</strong> · Instant download
      </p>
      <button class="topbar-cta" onclick="handleBuy(event)" aria-label="Buy the guide now">
        ${ICONS.arrow} Buy Now
      </button>
    `;
  }

  function renderHero() {
    const el = document.getElementById('hero');
    if (!el) return;
    const h = S.hero || {};
    const savePct = (h.original_price && h.price)
      ? Math.round((1 - parseFloat(h.price) / parseFloat(h.original_price)) * 100)
      : 50;

    el.innerHTML = `
      <div class="hero-visual">
        <div class="book-stage">
          <div class="book-glow" aria-hidden="true"></div>
          <div class="book-particle" aria-hidden="true"></div>
          <div class="book-particle" aria-hidden="true"></div>
          <div class="book-particle" aria-hidden="true"></div>
          <div class="book-wrap">
            <svg viewBox="0 0 280 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Turkey Buying Guide book cover">
              <defs>
                <linearGradient id="coverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#7a1515"/>
                  <stop offset="100%" stop-color="#4a0d0d"/>
                </linearGradient>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#C9973A"/>
                  <stop offset="100%" stop-color="#e0b05a"/>
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <!-- Book body -->
              <rect width="280" height="380" rx="6" fill="url(#coverGrad)"/>
              <!-- Spine shadow -->
              <rect x="0" y="0" width="22" height="380" rx="6" fill="rgba(0,0,0,.35)"/>
              <!-- Pages edge -->
              <rect x="262" y="6" width="12" height="368" rx="2" fill="#e8d5b0" opacity=".6"/>
              <!-- Outer border -->
              <rect x="14" y="14" width="252" height="352" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="1"/>
              <!-- Inner border -->
              <rect x="22" y="22" width="236" height="336" rx="3" fill="none" stroke="rgba(201,151,58,.35)" stroke-width=".5"/>
              <!-- Decorative crescent top -->
              <g filter="url(#glow)" transform="translate(140,85)">
                <path d="M0-38 C14-38 26-28 26-14 C26 0 14 10 0 10 C-8 10 -16 6 -20 0 C-12 4 -2 2 6-4 C16-12 18-26 10-34 C6-38 2-40 0-38Z" fill="url(#goldGrad)" opacity=".9"/>
                <circle cx="18" cy="-28" r="5" fill="url(#goldGrad)" opacity=".85"/>
              </g>
              <!-- Title lines -->
              <text x="140" y="148" font-size="11" font-weight="700" text-anchor="middle" fill="rgba(250,246,239,.55)" font-family="Georgia,serif" letter-spacing="3">THE COMPLETE</text>
              <text x="140" y="182" font-size="26" font-weight="700" text-anchor="middle" fill="url(#goldGrad)" font-family="Georgia,serif" filter="url(#glow)">TURKEY</text>
              <text x="140" y="210" font-size="26" font-weight="700" text-anchor="middle" fill="url(#goldGrad)" font-family="Georgia,serif" filter="url(#glow)">BUYING</text>
              <text x="140" y="238" font-size="26" font-weight="700" text-anchor="middle" fill="url(#goldGrad)" font-family="Georgia,serif" filter="url(#glow)">GUIDE</text>
              <!-- Divider -->
              <line x1="56" y1="258" x2="224" y2="258" stroke="url(#goldGrad)" stroke-width="1" opacity=".5"/>
              <!-- Subtitle -->
              <text x="140" y="278" font-size="9.5" text-anchor="middle" fill="rgba(250,246,239,.6)" font-family="sans-serif" letter-spacing="1">Real Estate · Gold · Carpets</text>
              <text x="140" y="294" font-size="9.5" text-anchor="middle" fill="rgba(250,246,239,.6)" font-family="sans-serif" letter-spacing="1">Electronics · Spices &amp; More</text>
              <!-- Edition badge -->
              <rect x="90" y="316" width="100" height="22" rx="11" fill="rgba(201,151,58,.18)" stroke="rgba(201,151,58,.4)" stroke-width=".8"/>
              <text x="140" y="331" font-size="8.5" text-anchor="middle" fill="url(#goldGrad)" font-family="sans-serif" letter-spacing="1.5">2024 / 2025 EDITION</text>
            </svg>
          </div>
        </div>
      </div>

      <div class="hero-copy">
        <div class="hero-eyebrow">
          ${ICONS.book}
          <span>2024 / 2025 Edition · Instant PDF Download</span>
        </div>
        <h1>${esc(h.headline || 'The Ultimate Guide to <em>Buying in Turkey</em>')
          .replace('&lt;em&gt;','<em>').replace('&lt;/em&gt;','</em>')}</h1>
        <p class="hero-subline">${esc(h.subheadline || '')}</p>
        <div class="hero-price-row">
          <span class="price-current">$${esc(h.price || '19.99')}</span>
          <span class="price-original">$${esc(h.original_price || '39.99')}</span>
          <span class="price-save">Save ${savePct}%</span>
        </div>
        <div class="hero-actions">
          <button class="btn-buy" id="buyBtn" onclick="handleBuy(event)" aria-label="Buy the Turkey Buying Guide">
            ${ICONS.download}
            ${esc(h.cta_text || 'Get the Guide Now')}
          </button>
          <p class="hero-trust">
            ${ICONS.lock}
            Secure checkout &nbsp;·&nbsp; Instant download &nbsp;·&nbsp; 30-day guarantee
          </p>
        </div>
        <div id="maintenance-msg" role="alert" aria-live="polite">
          The book is not available for purchase yet. Please check back soon.
        </div>
      </div>
    `;
    applyBuyState();
  }

  function renderStats() {
    const el = document.getElementById('stats');
    if (!el) return;
    const items = (S.stats && S.stats.items) || [];
    el.innerHTML = `
      <div class="stats-inner">
        ${items.map(i => `
          <div class="stat-item">
            <span class="stat-number">${esc(i.number)}</span>
            <span class="stat-label">${esc(i.label)}</span>
          </div>`).join('')}
      </div>`;
  }

  function renderChapters() {
    const el = document.getElementById('chapters');
    if (!el) return;
    const items = (S.chapters && S.chapters.items) || [];
    el.innerHTML = `
      <div class="section-wrap">
        <div class="section-header-center">
          <span class="section-eyebrow">What's Inside</span>
          <h2 class="section-title">Everything Covered,<br>Chapter by Chapter</h2>
          <p class="section-subtitle">200+ pages of expert knowledge across every major buying category in Turkey.</p>
        </div>
        <div class="chapters-grid">
          ${items.map(c => `
            <article class="chapter-card">
              <div class="chapter-num" aria-hidden="true">${esc(c.number)}</div>
              <h3 class="chapter-title">${esc(c.title)}</h3>
              <p class="chapter-desc">${esc(c.description)}</p>
            </article>`).join('')}
        </div>
      </div>`;
  }

  function renderBonus() {
    const el = document.getElementById('bonus');
    if (!el) return;
    const b = S.bonus_topics || {};
    const pills = (b.pills || []).map(p => `<span class="pill">${esc(p)}</span>`).join('');
    el.innerHTML = `
      <div class="bonus-inner">
        <span class="section-eyebrow">Bonus Content</span>
        <h2 class="section-title">${esc(b.title || 'Insider Tips')}</h2>
        <p class="bonus-body">${esc(b.body || '')}</p>
        <div class="pills" role="list" aria-label="Bonus topics">${pills}</div>
      </div>`;
  }

  function renderTestimonials() {
    const el = document.getElementById('testimonials');
    if (!el) return;
    const items = (S.testimonials && S.testimonials.items) || [];
    const stars = Array(5).fill(ICONS.star).join('');
    el.innerHTML = `
      <div class="section-wrap">
        <div class="section-header-center">
          <span class="section-eyebrow">Reader Reviews</span>
          <h2 class="section-title">What Buyers Are Saying</h2>
          <p class="section-subtitle">Join thousands of readers who made smarter purchases in Turkey.</p>
        </div>
        <div class="testimonials-grid">
          ${items.map(t => `
            <article class="testimonial-card">
              <div class="t-header">
                <div class="t-avatar" aria-hidden="true">${esc(t.initials)}</div>
                <div>
                  <div class="t-name">${esc(t.name)}</div>
                  <div class="t-loc">${esc(t.location)}</div>
                </div>
              </div>
              <div class="t-stars" aria-label="5 stars">${stars}</div>
              <p class="t-text">${esc(t.text)}</p>
            </article>`).join('')}
        </div>
      </div>`;
  }

  function renderPurchase() {
    const el = document.getElementById('purchase');
    if (!el) return;
    const pc = S.purchase_card || {};
    const h  = S.hero || {};
    const features = (pc.features || []).map(f => `
      <li>
        ${ICONS.check}
        ${esc(f)}
      </li>`).join('');
    el.innerHTML = `
      <div class="purchase-wrap">
        <div class="purchase-card">
          <h2 class="purchase-title">${esc(pc.title || 'Get Instant Access')}</h2>
          <p class="purchase-subtitle">${esc(pc.subtitle || 'One-time payment. Immediate PDF download.')}</p>
          <ul class="purchase-features" aria-label="What's included">${features}</ul>
          <div class="purchase-price-row">
            <span class="purchase-price">$${esc(h.price || '19.99')}</span>
            <span class="purchase-original">$${esc(h.original_price || '39.99')}</span>
          </div>
          <button class="btn-buy purchase-cta" id="buyBtn2" onclick="handleBuy(event)" aria-label="Purchase the Turkey Buying Guide">
            ${ICONS.download}
            ${esc(h.cta_text || 'Get the Guide Now')}
          </button>
          <p class="purchase-guarantee">
            ${ICONS.shield}
            Secure payment via Stripe &nbsp;·&nbsp; 30-day money-back guarantee
          </p>
          <div id="maintenance-msg2" role="alert" aria-live="polite">
            The book is not available for purchase yet. Please check back soon.
          </div>
        </div>
      </div>`;
    applyBuyState();
  }

  function renderFaq() {
    const el = document.getElementById('faq');
    if (!el) return;
    const items = (S.faq && S.faq.items) || [];
    el.innerHTML = `
      <div class="section-wrap">
        <div class="section-header-center" style="margin-bottom:3rem">
          <span class="section-eyebrow">FAQ</span>
          <h2 class="section-title">Frequently Asked Questions</h2>
        </div>
        <div class="faq-list">
          ${items.map((item, i) => `
            <details ${i === 0 ? 'open' : ''}>
              <summary>
                ${esc(item.question)}
                <span class="faq-icon" aria-hidden="true">
                  ${ICONS.plus}
                </span>
              </summary>
              <p>${esc(item.answer)}</p>
            </details>`).join('')}
        </div>
      </div>`;
  }

  function renderFooter() {
    const el = document.getElementById('footer');
    if (!el) return;
    const f = S.footer || {};
    el.innerHTML = `
      <div class="footer-inner">
        <div>
          <div class="footer-brand-name">${esc(f.brand_name || 'TurkeyGuide')}</div>
          <p class="footer-tagline">${esc(f.tagline || '')}</p>
          <div class="footer-email">
            ${ICONS.mail}
            <a href="mailto:${escAttr(f.email || '')}">${esc(f.email || '')}</a>
          </div>
        </div>
        <p class="footer-copy">${esc(f.copyright || '')}</p>
      </div>`;
    // Add mail icon flex to footer-email
    const emailDiv = el.querySelector('.footer-email');
    if (emailDiv) {
      emailDiv.style.cssText = 'display:flex;align-items:center;gap:.4rem;margin-top:.4rem';
    }
  }

  /* ── Stripe buy flow ──────────────────────────────────────────────── */
  window.handleBuy = async function handleBuy(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `${ICONS.spin} Processing…`;

    try {
      const res = await fetch('/checkout/create-session', { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Unexpected error');
      sessionStorage.setItem('dlToken', data.downloadToken);
      window.location.href = data.checkoutUrl;
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = origHTML;
    }
  };

  /* ── Payment success / cancel on return ──────────────────────────── */
  function handlePaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment');
    const errCode = params.get('error');

    if (status || errCode) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (status === 'success') {
      const token = sessionStorage.getItem('dlToken');
      if (token) {
        sessionStorage.removeItem('dlToken');
        showToast('Payment successful! Your download is starting…', 'success');
        setTimeout(() => { window.location.href = `/download?token=${token}`; }, 900);
      } else {
        showToast('Payment received! Check your email for download instructions.', 'success');
      }
    } else if (status === 'cancelled') {
      showToast('Checkout was cancelled. No charge was made.', '');
    }

    if (errCode) {
      const msgs = {
        invalid_token:          'Download link is invalid.',
        token_used:             'This download link has already been used.',
        token_expired:          'This download link has expired (valid 24 hrs).',
        payment_not_verified:   'Payment could not be verified. Contact support.',
        no_book:                'The book file is temporarily unavailable.',
        file_missing:           'File missing — please contact support.',
      };
      showToast(msgs[errCode] || 'Something went wrong. Please contact support.', 'error');
    }
  }

  /* ── Init ─────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    renderTopbar();
    renderHero();
    renderStats();
    renderChapters();
    renderBonus();
    renderTestimonials();
    renderPurchase();
    renderFaq();
    renderFooter();
    handlePaymentReturn();
  });
})();
