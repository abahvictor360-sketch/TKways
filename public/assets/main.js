(function () {
  'use strict';

  const S = window.__SITE_DATA__ || {};
  const P = window.__PAYMENT__ || {};

  // ── Toast helper ────────────────────────────────────────────────────────────
  function showToast(msg, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast ' + (type || '');
    // force reflow
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3800);
  }

  // ── Renderers ────────────────────────────────────────────────────────────────

  function renderTopbar() {
    const el = document.getElementById('topbar');
    if (!el) return;
    const h = S.hero || {};
    el.innerHTML = `<span>🇹🇷 Limited Offer:</span> Get the complete Turkey Buying Guide for only <span>$${h.price || '19.99'}</span> — instant PDF download`;
  }

  function renderHero() {
    const el = document.getElementById('hero');
    if (!el) return;
    const h = S.hero || {};
    const savePct = h.original_price && h.price
      ? Math.round((1 - parseFloat(h.price) / parseFloat(h.original_price)) * 100)
      : 50;

    el.innerHTML = `
      <div class="hero-visual">
        <div class="book-cover-wrap">
          <svg viewBox="0 0 280 380" xmlns="http://www.w3.org/2000/svg">
            <rect width="280" height="380" rx="8" fill="#8B1A1A"/>
            <rect x="12" y="12" width="256" height="356" rx="6" fill="#6a1414"/>
            <rect x="24" y="24" width="232" height="332" rx="4" fill="#7a1717"/>
            <!-- Decorative border -->
            <rect x="30" y="30" width="220" height="320" rx="3" fill="none" stroke="#C9973A" stroke-width="1.5"/>
            <!-- Crescent and star -->
            <text x="140" y="110" font-size="48" text-anchor="middle" fill="#C9973A">🇹🇷</text>
            <!-- Title -->
            <text x="140" y="175" font-size="15" font-weight="bold" text-anchor="middle" fill="#FAF6EF" font-family="serif">THE COMPLETE</text>
            <text x="140" y="200" font-size="20" font-weight="bold" text-anchor="middle" fill="#C9973A" font-family="serif">TURKEY</text>
            <text x="140" y="222" font-size="20" font-weight="bold" text-anchor="middle" fill="#C9973A" font-family="serif">BUYING</text>
            <text x="140" y="244" font-size="20" font-weight="bold" text-anchor="middle" fill="#C9973A" font-family="serif">GUIDE</text>
            <line x1="60" y1="262" x2="220" y2="262" stroke="#C9973A" stroke-width="1" opacity=".6"/>
            <text x="140" y="285" font-size="10" text-anchor="middle" fill="rgba(250,246,239,.7)" font-family="sans-serif">Real Estate • Gold • Carpets</text>
            <text x="140" y="300" font-size="10" text-anchor="middle" fill="rgba(250,246,239,.7)" font-family="sans-serif">Electronics • Spices & More</text>
            <!-- Spine shadow -->
            <rect x="0" y="0" width="18" height="380" rx="8" fill="rgba(0,0,0,.3)"/>
          </svg>
        </div>
      </div>
      <div class="hero-copy">
        <div class="hero-badge">New Edition 2024/2025</div>
        <h1>${escHtml(h.headline || 'The Ultimate Guide to Buying in Turkey')}</h1>
        <p class="subheadline">${escHtml(h.subheadline || '')}</p>
        <div class="price-row">
          <span class="price-current">$${escHtml(h.price || '19.99')}</span>
          <span class="price-original">$${escHtml(h.original_price || '39.99')}</span>
          <span class="price-label">Save ${savePct}%</span>
        </div>
        <button class="btn-buy" id="buyBtn" onclick="handleBuy(event)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 16l4-4-4-4M8 12h8"/><circle cx="12" cy="12" r="10"/></svg>
          ${escHtml(h.cta_text || 'Get the Guide Now')}
        </button>
        <div class="hero-trust">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Secure checkout · Instant download · 30-day money-back guarantee
        </div>
        <div id="maintenance-msg" style="margin-top:1rem;padding:.75rem 1rem;background:#fff3e0;color:#8B1A1A;border-radius:8px;font-size:.88rem;display:none;">
          The book is not available for purchase yet. Please check back soon.
        </div>
      </div>
    `;
    checkBuyAvailability();
  }

  function renderStats() {
    const el = document.getElementById('stats');
    if (!el) return;
    const items = (S.stats && S.stats.items) || [];
    el.innerHTML = `<div class="stats-inner">${items.map(i => `
      <div class="stat-item">
        <span class="stat-number">${escHtml(i.number)}</span>
        <span class="stat-label">${escHtml(i.label)}</span>
      </div>`).join('')}</div>`;
  }

  function renderChapters() {
    const el = document.getElementById('chapters');
    if (!el) return;
    const items = (S.chapters && S.chapters.items) || [];
    el.innerHTML = `
      <div class="section-header">
        <div class="section-eyebrow">What's Inside</div>
        <h2>Everything Covered, Chapter by Chapter</h2>
      </div>
      <div class="chapters-grid">
        ${items.map(c => `
          <div class="chapter-card">
            <div class="chapter-num">${escHtml(c.number)}</div>
            <h3>${escHtml(c.title)}</h3>
            <p>${escHtml(c.description)}</p>
          </div>`).join('')}
      </div>`;
  }

  function renderBonus() {
    const el = document.getElementById('bonus');
    if (!el) return;
    const b = S.bonus_topics || {};
    const pills = (b.pills || []).map(p => `<span class="pill">${escHtml(p)}</span>`).join('');
    el.innerHTML = `
      <div class="bonus-inner">
        <div class="section-eyebrow" style="color:rgba(201,151,58,.7)">Bonus Content</div>
        <h2>${escHtml(b.title || 'Insider Tips')}</h2>
        <p>${escHtml(b.body || '')}</p>
        <div class="pills">${pills}</div>
      </div>`;
  }

  function renderTestimonials() {
    const el = document.getElementById('testimonials');
    if (!el) return;
    const items = (S.testimonials && S.testimonials.items) || [];
    el.innerHTML = `
      <div class="testimonials-inner">
        <div class="section-header">
          <div class="section-eyebrow">Reader Reviews</div>
          <h2>What Buyers Are Saying</h2>
        </div>
        <div class="testimonials-grid">
          ${items.map(t => `
            <div class="testimonial-card">
              <div class="testimonial-header">
                <div class="avatar">${escHtml(t.initials)}</div>
                <div>
                  <div class="reviewer-name">${escHtml(t.name)}</div>
                  <div class="reviewer-loc">${escHtml(t.location)}</div>
                </div>
              </div>
              <div class="stars">★★★★★</div>
              <p>"${escHtml(t.text)}"</p>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function renderPurchase() {
    const el = document.getElementById('purchase');
    if (!el) return;
    const pc = S.purchase_card || {};
    const features = (pc.features || []).map(f => `<li>${escHtml(f)}</li>`).join('');
    const price = S.hero ? S.hero.price : '19.99';
    const origPrice = S.hero ? S.hero.original_price : '39.99';
    const ctaText = S.hero ? S.hero.cta_text : 'Get the Guide Now';

    el.innerHTML = `
      <div class="purchase-card">
        <h2>${escHtml(pc.title || 'Get Instant Access')}</h2>
        <p class="purchase-subtitle">${escHtml(pc.subtitle || 'One-time payment. Immediate PDF download.')}</p>
        <ul class="purchase-features">${features}</ul>
        <div class="purchase-price-row">
          <span class="purchase-price">$${escHtml(price || '19.99')}</span>
          <span class="purchase-original">$${escHtml(origPrice || '39.99')}</span>
        </div>
        <button class="btn-buy purchase-cta" id="buyBtn2" onclick="handleBuy(event)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 16l4-4-4-4M8 12h8"/><circle cx="12" cy="12" r="10"/></svg>
          ${escHtml(ctaText || 'Get the Guide Now')}
        </button>
        <p class="purchase-guarantee">🔒 Secure payment via Stripe · 30-day money-back guarantee</p>
        <div id="maintenance-msg2" style="margin-top:1rem;padding:.75rem 1rem;background:#fff3e0;color:#8B1A1A;border-radius:8px;font-size:.88rem;display:none;">
          The book is not available for purchase yet. Please check back soon.
        </div>
      </div>`;
    checkBuyAvailability();
  }

  function renderFaq() {
    const el = document.getElementById('faq');
    if (!el) return;
    const items = (S.faq && S.faq.items) || [];
    el.innerHTML = `
      <div class="faq-inner">
        <div class="section-header">
          <div class="section-eyebrow">FAQ</div>
          <h2>Frequently Asked Questions</h2>
        </div>
        ${items.map(item => `
          <details>
            <summary>${escHtml(item.question)}</summary>
            <p>${escHtml(item.answer)}</p>
          </details>`).join('')}
      </div>`;
  }

  function renderFooter() {
    const el = document.getElementById('footer');
    if (!el) return;
    const f = S.footer || {};
    el.innerHTML = `
      <div class="footer-inner">
        <div class="footer-brand">${escHtml(f.brand_name || 'TurkeyGuide')}</div>
        <p class="footer-tagline">${escHtml(f.tagline || '')}</p>
        <div class="footer-email"><a href="mailto:${escAttr(f.email || '')}">${escHtml(f.email || '')}</a></div>
        <p class="footer-copy">${escHtml(f.copyright || '')}</p>
      </div>`;
  }

  function checkBuyAvailability() {
    const unavailable = !P.bookAvailable || !P.stripeConfigured;
    ['buyBtn', 'buyBtn2'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = unavailable;
    });
    ['maintenance-msg', 'maintenance-msg2'].forEach(id => {
      const msg = document.getElementById(id);
      if (msg) msg.style.display = unavailable ? 'block' : 'none';
    });
  }

  // ── Stripe buy flow ──────────────────────────────────────────────────────────
  window.handleBuy = async function handleBuy(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Processing…';

    try {
      const res = await fetch('/checkout/create-session', { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Unknown error');
      sessionStorage.setItem('dlToken', data.downloadToken);
      window.location.href = data.checkoutUrl;
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  };

  // ── Payment success / cancel handling on page load ───────────────────────────
  function handlePaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment');
    if (!status) return;

    // Clean the URL
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);

    if (status === 'success') {
      const token = sessionStorage.getItem('dlToken');
      if (token) {
        sessionStorage.removeItem('dlToken');
        showToast('Payment successful! Your download is starting…', 'success');
        setTimeout(() => { window.location.href = `/download?token=${token}`; }, 800);
      } else {
        showToast('Payment received! Please check your email for download instructions.', 'success');
      }
    } else if (status === 'cancelled') {
      showToast('Checkout cancelled. No charge was made.', '');
    }

    const errCode = params.get('error');
    if (errCode) {
      const msgs = {
        invalid_token: 'Download link is invalid.',
        token_used: 'This download link has already been used.',
        token_expired: 'This download link has expired (valid for 24 hours).',
        payment_not_verified: 'Payment could not be verified.',
        no_book: 'The book file is not available yet.',
        file_missing: 'Book file is missing. Please contact support.'
      };
      showToast(msgs[errCode] || 'An error occurred.', 'error');
    }
  }

  // ── Spin animation for loading state ─────────────────────────────────────────
  const spinStyle = document.createElement('style');
  spinStyle.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(spinStyle);

  // ── Utility ──────────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escAttr(str) { return escHtml(str); }

  // ── Init ─────────────────────────────────────────────────────────────────────
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
