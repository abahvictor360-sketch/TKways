/* ═══════════════════════════════════════════════════════════════════
   TurkeyGuide — Admin Dashboard
   UI/UX Pro Max rules applied:
   ✓ No emojis — all icons are inline SVG
   ✓ cursor-pointer on all clickable elements (via CSS)
   ✓ Hover/focus states 150–220ms
   ✓ Focus-visible states for keyboard navigation
   ✓ Touch targets ≥ 44px
   ✓ Loading states on async buttons
   ✓ Mobile sidebar off-canvas drawer
   ✓ prefers-reduced-motion via CSS
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const D    = window.__ADMIN_DATA__  || {};
  const CSRF = window.__CSRF_TOKEN__  || '';

  /* ── SVG icons ──────────────────────────────────────────────────── */
  const ICO = {
    check:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
    warn:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    book:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
    card:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    edit:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    plus:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    trash:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
    spin:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true" style="animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
    upload: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>`,
    globe:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  };

  /* ── Toast ──────────────────────────────────────────────────────── */
  function toast(msg, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = (type === 'success' ? ICO.check : type === 'error' ? ICO.warn : '') + `<span>${esc(msg)}</span>`;
    el.className = 'toast ' + (type || '');
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
  }

  /* ── Escape ─────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* ── AJAX ───────────────────────────────────────────────────────── */
  async function api(url, method, body) {
    const headers = { 'X-CSRF-Token': CSRF };
    const init = { method, headers };
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      init.body = body;
    }
    const res = await fetch(url, init);
    return res.json();
  }

  /* ── Button loading state ───────────────────────────────────────── */
  function setLoading(btn, loading, label) {
    if (loading) {
      btn._origHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `${ICO.spin} ${label || 'Saving…'}`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn._origHTML || label || 'Save';
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     MOBILE SIDEBAR
     ══════════════════════════════════════════════════════════════════ */
  function initMobileSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const toggle   = document.getElementById('sidebarToggle');
    const close    = document.getElementById('sidebarClose');
    const overlay  = document.getElementById('sidebarOverlay');
    if (!sidebar || !toggle) return;

    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('open');
      overlay.removeAttribute('aria-hidden');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', openSidebar);
    if (close)   close.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     TAB NAVIGATION
     ══════════════════════════════════════════════════════════════════ */
  const TAB_LABELS = {
    overview: 'Overview',
    content:  'Content Editor',
    book:     'Book Upload',
    payment:  'Payment Settings',
    password: 'Change Password',
  };

  function initTabs() {
    const sidebar = document.getElementById('sidebar');
    document.querySelectorAll('.nav-item[data-tab]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        switchTab(link.dataset.tab);
        // Close mobile sidebar after nav
        if (sidebar && sidebar.classList.contains('open')) {
          document.getElementById('sidebarClose')?.click();
        }
      });
      // Keyboard support
      link.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); link.click(); }
      });
    });
  }

  function switchTab(tabKey) {
    document.querySelectorAll('.nav-item[data-tab]').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const link  = document.querySelector(`.nav-item[data-tab="${tabKey}"]`);
    const panel = document.getElementById(`tab-${tabKey}`);
    if (link)  link.classList.add('active');
    if (panel) panel.classList.add('active');
    const titleEl = document.getElementById('topbarTitle');
    if (titleEl) titleEl.textContent = TAB_LABELS[tabKey] || tabKey;
  }

  /* ══════════════════════════════════════════════════════════════════
     OVERVIEW
     ══════════════════════════════════════════════════════════════════ */
  function initOverview() {
    // User avatar / username
    const username = D.username || 'admin';
    const initial  = username[0].toUpperCase();
    const footerAvatar   = document.getElementById('footerAvatarInitial');
    const footerUsername = document.getElementById('footerUsername');
    if (footerAvatar)   footerAvatar.textContent = initial;
    if (footerUsername) footerUsername.textContent = username;

    // Overview cards
    const cardsEl = document.getElementById('overviewCards');
    const book    = D.book    || {};
    const pay     = D.payment || {};
    const content = D.content || {};

    const bookUploaded = !!book.filename;
    const stripeOk     = !!pay.stripeConfigured;
    const sections     = Object.keys(content).length;

    if (cardsEl) {
      cardsEl.innerHTML = `
        <div class="ov-card">
          <div class="ov-label">Book File</div>
          <div class="ov-value">
            ${bookUploaded
              ? `<span class="badge badge--green badge--dot">Uploaded</span>`
              : `<span class="badge badge--orange badge--dot">Not uploaded</span>`}
          </div>
          <div class="ov-sub">${bookUploaded ? esc(book.originalName || book.filename) : 'Upload a PDF to enable purchases'}</div>
        </div>
        <div class="ov-card">
          <div class="ov-label">Stripe</div>
          <div class="ov-value">
            ${stripeOk
              ? `<span class="badge badge--green badge--dot">Connected</span>`
              : `<span class="badge badge--orange badge--dot">Not configured</span>`}
          </div>
          <div class="ov-sub">${stripeOk
            ? `${esc(pay.productName)} · $${((pay.priceUsdCents || 0) / 100).toFixed(2)}`
            : 'Add Stripe keys in Payment Settings'}</div>
        </div>
        <div class="ov-card">
          <div class="ov-label">Content Sections</div>
          <div class="ov-value">${sections} <span style="font-size:1rem;font-family:Inter,sans-serif;font-weight:400;color:var(--text-lt)">sections</span></div>
          <div class="ov-sub">All editable in Content Editor</div>
        </div>
      `;
    }

    // Quick actions
    const qaEl = document.getElementById('quickActions');
    if (qaEl) {
      qaEl.innerHTML = `
        <button class="btn-primary" onclick="switchToTab('content')">
          ${ICO.edit} Edit Content
        </button>
        <button class="btn-secondary" onclick="switchToTab('book')">
          ${ICO.upload} Upload Book
        </button>
        <button class="btn-secondary" onclick="switchToTab('payment')">
          ${ICO.card} Payment Settings
        </button>
      `;
    }

    // Webhook URL
    const whEl = document.getElementById('webhookUrl');
    if (whEl) whEl.textContent = window.location.origin + '/webhook/stripe';
  }

  window.switchToTab = function(key) { switchTab(key); };

  /* ══════════════════════════════════════════════════════════════════
     BOOK SECTION
     ══════════════════════════════════════════════════════════════════ */
  function initBookSection() {
    const statusEl    = document.getElementById('bookStatus');
    const deleteCard  = document.getElementById('deleteBookCard');
    const book        = D.book || {};

    if (statusEl) {
      if (book.filename) {
        statusEl.className = 'info-card has-book';
        const kb = book.fileSize ? (book.fileSize / 1024).toFixed(0) + ' KB' : '';
        statusEl.innerHTML = `
          ${ICO.book}
          <span>
            <strong>${esc(book.originalName || book.filename)}</strong>
            ${kb ? `· ${kb}` : ''}
            ${book.uploadedAt ? `· Uploaded ${esc(book.uploadedAt.split('T')[0] || book.uploadedAt)}` : ''}
          </span>`;
        if (deleteCard) deleteCard.style.display = 'block';
      } else {
        statusEl.className = 'info-card no-book';
        statusEl.innerHTML = `${ICO.warn} <span>No book uploaded yet. Upload a PDF below to enable purchases.</span>`;
      }
    }

    // Upload form — XHR to server, server puts to Vercel Blob
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
      uploadForm.addEventListener('submit', e => {
        e.preventDefault();
        const fileInput = document.getElementById('bookFile');
        if (!fileInput?.files[0]) return;

        const progressWrap  = document.getElementById('uploadProgress');
        const progressFill  = document.getElementById('progressFill');
        const progressLabel = document.getElementById('progressLabel');
        const btn = uploadForm.querySelector('button[type=submit]');

        setLoading(btn, true, 'Uploading…');
        if (progressWrap) progressWrap.style.display = 'flex';

        const fd = new FormData();
        fd.append('book', fileInput.files[0]);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/admin/book/upload');
        // CSRF token sent as header — csurf reads headers before multer parses body
        xhr.setRequestHeader('X-CSRF-Token', CSRF);

        xhr.upload.addEventListener('progress', ev => {
          if (!ev.lengthComputable) return;
          const pct = Math.round((ev.loaded / ev.total) * 100);
          if (progressFill)  progressFill.style.width  = pct + '%';
          if (progressLabel) progressLabel.textContent = pct + '%';
        });

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              toast('Book uploaded successfully!', 'success');
              setTimeout(() => location.reload(), 900);
            } else {
              toast('Upload failed: ' + (data.error || 'Unknown error'), 'error');
              setLoading(btn, false);
              if (progressWrap) progressWrap.style.display = 'none';
            }
          } catch {
            toast('Unexpected server response. Please try again.', 'error');
            setLoading(btn, false);
            if (progressWrap) progressWrap.style.display = 'none';
          }
        };

        xhr.onerror = () => {
          toast('Network error — please try again.', 'error');
          setLoading(btn, false);
          if (progressWrap) progressWrap.style.display = 'none';
        };

        xhr.send(fd);
      });
    }

    // Delete book
    const deleteBtn = document.getElementById('deleteBookBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete the book file? Purchases will be disabled until a new file is uploaded.')) return;
        setLoading(deleteBtn, true, 'Deleting…');
        try {
          const data = await api('/admin/book', 'DELETE');
          if (data.success) { toast('Book deleted.', 'success'); setTimeout(() => location.reload(), 800); }
          else { toast('Error: ' + data.error, 'error'); setLoading(deleteBtn, false); }
        } catch { toast('Network error.', 'error'); setLoading(deleteBtn, false); }
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     PAYMENT SETTINGS
     ══════════════════════════════════════════════════════════════════ */
  function initPaymentSection() {
    const pay = D.payment || {};
    const pubKeyInput     = document.getElementById('pubKeyInput');
    const productNameInput = document.getElementById('productNameInput');
    const priceInput      = document.getElementById('priceInput');

    if (pubKeyInput)      pubKeyInput.value      = pay.publishableKey || '';
    if (productNameInput) productNameInput.value = pay.productName    || '';
    if (priceInput)       priceInput.value       = pay.priceUsdCents  || 1999;

    const form = document.getElementById('paymentForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      setLoading(btn, true, 'Saving…');
      const statusEl = document.getElementById('stripeStatus');

      const body = {
        stripe_publishable_key: (form.stripe_publishable_key?.value || '').trim(),
        stripe_secret_key:      (form.stripe_secret_key?.value      || '').trim(),
        stripe_webhook_secret:  (form.stripe_webhook_secret?.value  || '').trim(),
        product_name:           (form.product_name?.value           || '').trim(),
        price_usd_cents:        parseInt(form.price_usd_cents?.value || 1999, 10),
      };

      try {
        const data = await api('/admin/payment', 'POST', body);
        if (data.success) {
          toast('Payment settings saved!', 'success');
          if (statusEl) {
            statusEl.style.display = 'flex';
            statusEl.className = 'stripe-status ' + (data.connected ? 'stripe-status--ok' : 'stripe-status--err');
            statusEl.innerHTML = data.connected
              ? `${ICO.check} Stripe connection verified`
              : `${ICO.warn} Could not verify Stripe — check your secret key`;
          }
        } else {
          toast('Error: ' + data.error, 'error');
        }
      } catch { toast('Network error. Please try again.', 'error'); }
      setLoading(btn, false);
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     CHANGE PASSWORD
     ══════════════════════════════════════════════════════════════════ */
  function initPasswordSection() {
    const form = document.getElementById('passwordForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      setLoading(btn, true, 'Updating…');

      const body = {
        current_password: form.current_password.value,
        new_password:     form.new_password.value,
        confirm_password: form.confirm_password.value,
      };

      try {
        const data = await api('/admin/change-password', 'POST', body);
        if (data.success) { toast('Password updated!', 'success'); form.reset(); }
        else toast('Error: ' + data.error, 'error');
      } catch { toast('Network error.', 'error'); }
      setLoading(btn, false);
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     CONTENT EDITOR
     ══════════════════════════════════════════════════════════════════ */
  const SECTION_META = {
    hero:          { label: 'Hero Section',         icon: ICO.globe  },
    stats:         { label: 'Stats Strip',           icon: ICO.edit   },
    chapters:      { label: 'Chapters',              icon: ICO.book   },
    bonus_topics:  { label: 'Bonus Topics',          icon: ICO.edit   },
    testimonials:  { label: 'Testimonials',          icon: ICO.edit   },
    purchase_card: { label: 'Purchase Card',         icon: ICO.card   },
    faq:           { label: 'FAQ',                   icon: ICO.edit   },
    footer:        { label: 'Footer',                icon: ICO.globe  },
  };

  function initContentEditor() {
    const container = document.getElementById('contentEditor');
    if (!container) return;
    const content = D.content || {};

    container.innerHTML = Object.keys(SECTION_META).map(key =>
      buildPanel(key, content[key] || {})
    ).join('');

    // Toggle open/close
    container.querySelectorAll('.section-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const body = toggle.nextElementSibling;
        const open = !body.classList.contains('open');
        body.classList.toggle('open', open);
        toggle.classList.toggle('open', open);
      });
      toggle.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); }
      });
    });

    // Save buttons
    container.querySelectorAll('.section-save-btn').forEach(btn => {
      btn.addEventListener('click', () => saveSection(btn.dataset.section, container));
    });

    // Add row buttons
    container.addEventListener('click', e => {
      if (e.target.closest('.btn-add-row')) addRow(e.target.closest('.btn-add-row'));
      if (e.target.closest('.btn-remove'))  e.target.closest('.repeat-row').remove();
    });
  }

  /* ── Panel builder ──────────────────────────────────────────────── */
  function buildPanel(key, data) {
    const meta = SECTION_META[key] || { label: key, icon: ICO.edit };
    return `
      <div class="content-section" data-section="${key}">
        <div class="section-toggle" role="button" tabindex="0" aria-expanded="false">
          <div class="section-toggle-left">
            ${meta.icon}
            <h3>${meta.label}</h3>
          </div>
          <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="section-body">
          ${buildFields(key, data)}
          <div class="section-actions">
            <button class="btn-primary section-save-btn" data-section="${key}">
              ${ICO.check} Save ${meta.label}
            </button>
          </div>
        </div>
      </div>`;
  }

  /* ── Field builders ─────────────────────────────────────────────── */
  function buildFields(key, data) {
    switch (key) {
      case 'hero': return `
        ${field('headline',      'Headline',        data.headline      || '', 'text')}
        ${field('subheadline',   'Subheadline',     data.subheadline   || '', 'textarea')}
        ${field('price',         'Price',           data.price         || '', 'text')}
        ${field('original_price','Original Price',  data.original_price|| '', 'text')}
        ${field('cta_text',      'CTA Button Text', data.cta_text      || '', 'text')}`;

      case 'stats': return `
        <label class="form-label">Stats (number + label pairs)</label>
        ${repeatBlock('stat', (data.items||[]).map(i => rowInline([
          { name:'number', val:i.number||'', ph:'e.g. 200+' },
          { name:'label',  val:i.label ||'', ph:'e.g. Pages' },
        ])), ['number','label'])}`;

      case 'chapters': return `
        <label class="form-label">Chapters</label>
        ${repeatBlock('chapter', (data.items||[]).map(i => rowComplex([
          rowInline([
            { name:'number', val:i.number||'', ph:'01', style:'max-width:70px' },
            { name:'title',  val:i.title ||'', ph:'Chapter title' },
          ]),
          { name:'description', val:i.description||'', ph:'Short description', type:'textarea' },
        ])), ['number','title','description'])}`;

      case 'bonus_topics': return `
        ${field('title','Title', data.title||'', 'text')}
        ${field('body', 'Body',  data.body ||'', 'textarea')}
        <label class="form-label" style="margin-top:.5rem">Pills / Tags</label>
        ${repeatBlock('pill', (data.pills||[]).map(p => rowInline([
          { name:'pill', val:p||'', ph:'Tag text' },
        ])), ['pill'])}`;

      case 'testimonials': return `
        <label class="form-label">Testimonials</label>
        ${repeatBlock('testimonial', (data.items||[]).map(i => rowComplex([
          rowInline([
            { name:'initials', val:i.initials||'', ph:'SR',  style:'max-width:70px' },
            { name:'name',     val:i.name    ||'', ph:'Full name' },
            { name:'location', val:i.location||'', ph:'City, Country' },
          ]),
          { name:'text', val:i.text||'', ph:'Testimonial text', type:'textarea' },
        ])), ['initials','name','location','text'])}`;

      case 'purchase_card': return `
        ${field('title',    'Title',    data.title   ||'', 'text')}
        ${field('subtitle', 'Subtitle', data.subtitle||'', 'text')}
        <label class="form-label" style="margin-top:.5rem">Features List</label>
        ${repeatBlock('feature', (data.features||[]).map(f => rowInline([
          { name:'feature', val:f||'', ph:'Feature text' },
        ])), ['feature'])}`;

      case 'faq': return `
        <label class="form-label">FAQ items</label>
        ${repeatBlock('faq-item', (data.items||[]).map(i => rowComplex([
          { name:'question', val:i.question||'', ph:'Question', type:'text' },
          { name:'answer',   val:i.answer  ||'', ph:'Answer',   type:'textarea' },
        ])), ['question','answer'])}`;

      case 'footer': return `
        ${field('brand_name','Brand Name',   data.brand_name||'', 'text')}
        ${field('tagline',   'Tagline',      data.tagline   ||'', 'text')}
        ${field('email',     'Email',        data.email     ||'', 'text')}
        ${field('copyright', 'Copyright',    data.copyright ||'', 'text')}`;

      default: return `<pre style="font-size:.75rem;color:var(--text-lt)">${esc(JSON.stringify(data,null,2))}</pre>`;
    }
  }

  function field(name, label, value, type) {
    if (type === 'textarea') {
      return `<div class="form-group"><label class="form-label">${label}</label><textarea name="${name}" class="form-textarea">${esc(value)}</textarea></div>`;
    }
    return `<div class="form-group"><label class="form-label">${label}</label><input type="text" name="${name}" class="form-input" value="${esc(value)}"></div>`;
  }

  function rowInline(fields) {
    return `<div class="repeat-row-inline">
      ${fields.map(f => `<input type="text" name="${f.name}" class="form-input" value="${esc(f.val)}" placeholder="${esc(f.ph||'')}" ${f.style ? `style="${f.style}"` : ''}>`).join('')}
    </div>`;
  }

  function rowComplex(parts) {
    return parts.map(p => {
      if (typeof p === 'string') return p; // already-rendered HTML
      if (p.type === 'textarea') return `<textarea name="${p.name}" class="form-textarea" placeholder="${esc(p.ph||'')}">${esc(p.val||'')}</textarea>`;
      return `<input type="text" name="${p.name}" class="form-input" value="${esc(p.val||'')}" placeholder="${esc(p.ph||'')}">`;
    }).join('');
  }

  function repeatBlock(rowType, rowsHtml, fieldNames) {
    return `
      <div class="repeat-list" data-fields="${fieldNames.join(',')}">
        ${rowsHtml.map(r => `
          <div class="repeat-row">
            <div class="repeat-row-fields">${r}</div>
            <button type="button" class="btn-remove" title="Remove row" aria-label="Remove row">${ICO.trash}</button>
          </div>`).join('')}
      </div>
      <button type="button" class="btn-add-row" data-fields="${fieldNames.join(',')}" data-row-type="${rowType}">
        ${ICO.plus} Add row
      </button>`;
  }

  /* ── Add a new empty row ────────────────────────────────────────── */
  function addRow(btn) {
    const fieldNames = (btn.dataset.fields || '').split(',');
    const list = btn.previousElementSibling;
    if (!list || !list.classList.contains('repeat-list')) return;

    const isComplex = fieldNames.some(f => ['description','answer','text','body'].includes(f));

    let inner = '';
    if (isComplex) {
      const simpleFields = fieldNames.filter(f => !['description','answer','text'].includes(f));
      const textareaFields = fieldNames.filter(f => ['description','answer','text'].includes(f));
      inner = `
        ${simpleFields.length ? `<div class="repeat-row-inline">${simpleFields.map(f => `<input type="text" name="${f}" class="form-input" placeholder="${f}">`).join('')}</div>` : ''}
        ${textareaFields.map(f => `<textarea name="${f}" class="form-textarea" placeholder="${f}"></textarea>`).join('')}`;
    } else {
      inner = `<div class="repeat-row-inline">${fieldNames.map(f => `<input type="text" name="${f}" class="form-input" placeholder="${f}">`).join('')}</div>`;
    }

    const row = document.createElement('div');
    row.className = 'repeat-row';
    row.innerHTML = `<div class="repeat-row-fields">${inner}</div><button type="button" class="btn-remove" title="Remove row" aria-label="Remove row">${ICO.trash}</button>`;
    list.appendChild(row);
    row.querySelector('input, textarea')?.focus();
  }

  /* ── Collect & save a section ───────────────────────────────────── */
  function collectSection(key, container) {
    const panel = container.querySelector(`[data-section="${key}"]`);
    if (!panel) return {};

    const getVal = name => panel.querySelector(`[name="${name}"]`)?.value?.trim() || '';

    switch (key) {
      case 'hero':   return { headline: getVal('headline'), subheadline: getVal('subheadline'), price: getVal('price'), original_price: getVal('original_price'), cta_text: getVal('cta_text') };
      case 'footer': return { brand_name: getVal('brand_name'), tagline: getVal('tagline'), email: getVal('email'), copyright: getVal('copyright') };
      case 'purchase_card': {
        const features = [];
        panel.querySelectorAll('[name="feature"]').forEach(el => { if (el.value.trim()) features.push(el.value.trim()); });
        return { title: getVal('title'), subtitle: getVal('subtitle'), features };
      }
      case 'bonus_topics': {
        const pills = [];
        panel.querySelectorAll('[name="pill"]').forEach(el => { if (el.value.trim()) pills.push(el.value.trim()); });
        return { title: getVal('title'), body: getVal('body'), pills };
      }
      case 'stats':
        return { items: collectRows(panel, ['number','label']) };
      case 'chapters':
        return { items: collectRows(panel, ['number','title','description']) };
      case 'testimonials':
        return { items: collectRows(panel, ['initials','name','location','text']) };
      case 'faq':
        return { items: collectRows(panel, ['question','answer']) };
      default: return {};
    }
  }

  function collectRows(panel, fields) {
    const rows = [];
    panel.querySelectorAll('.repeat-row').forEach(row => {
      const obj = {};
      fields.forEach(f => { obj[f] = row.querySelector(`[name="${f}"]`)?.value?.trim() || ''; });
      rows.push(obj);
    });
    return rows;
  }

  async function saveSection(key, container) {
    const btn = container.querySelector(`[data-section="${key}"] .section-save-btn`);
    const meta = SECTION_META[key] || { label: key };
    setLoading(btn, true, 'Saving…');
    try {
      const body = collectSection(key, container);
      const data = await api(`/admin/content/${key}`, 'POST', body);
      if (data.success) toast(`${meta.label} saved!`, 'success');
      else toast('Error: ' + data.error, 'error');
    } catch { toast('Network error.', 'error'); }
    setLoading(btn, false);
  }

  /* ── spin keyframe injection ────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);

  /* ══════════════════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    initMobileSidebar();
    initTabs();
    initOverview();
    initBookSection();
    initPaymentSection();
    initPasswordSection();
    initContentEditor();
  });
})();
