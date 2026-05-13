(function () {
  'use strict';

  const D = window.__ADMIN_DATA__ || {};
  const CSRF = window.__CSRF_TOKEN__ || '';

  // ── Toast ──────────────────────────────────────────────────────────────────
  function toast(msg, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast ' + (type || '');
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3800);
  }

  // ── Tab navigation ─────────────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const tab = link.dataset.tab;
        document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        link.classList.add('active');
        const panel = document.getElementById('tab-' + tab);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ── Escape HTML ────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── AJAX helper ───────────────────────────────────────────────────────────
  async function apiFetch(url, method, body) {
    const headers = { 'X-CSRF-Token': CSRF };
    let init = { method, headers };
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      init.body = body;
    }
    const res = await fetch(url, init);
    return res.json();
  }

  // ── Overview ───────────────────────────────────────────────────────────────
  function initOverview() {
    const el = document.getElementById('overviewCards');
    if (!el) return;
    const book = D.book || {};
    const pay  = D.payment || {};

    el.innerHTML = `
      <div class="ov-card">
        <div class="ov-card-label">Book File</div>
        <div class="ov-card-value">${book.filename ? '<span class="badge-ok">Uploaded</span>' : '<span class="badge-no">Not uploaded</span>'}</div>
        <div class="ov-card-sub">${book.originalName ? esc(book.originalName) : 'No file yet'}</div>
      </div>
      <div class="ov-card">
        <div class="ov-card-label">Stripe</div>
        <div class="ov-card-value">${pay.stripeConfigured ? '<span class="badge-ok">Connected</span>' : '<span class="badge-no">Not configured</span>'}</div>
        <div class="ov-card-sub">${pay.stripeConfigured ? esc(pay.productName) + ' · $' + ((pay.priceUsdCents||0)/100).toFixed(2) : 'Add keys in Payment Settings'}</div>
      </div>
      <div class="ov-card">
        <div class="ov-card-label">Content Sections</div>
        <div class="ov-card-value">${Object.keys(D.content || {}).length}</div>
        <div class="ov-card-sub">All editable in Content Editor</div>
      </div>
    `;

    const adminUsernameEl = document.getElementById('adminUsername');
    if (adminUsernameEl) adminUsernameEl.textContent = D.username || 'admin';

    const webhookEl = document.getElementById('webhookUrl');
    if (webhookEl) webhookEl.textContent = window.location.origin + '/webhook/stripe';
  }

  // ── Book status ────────────────────────────────────────────────────────────
  function initBookSection() {
    const statusEl = document.getElementById('bookStatus');
    const deleteCard = document.getElementById('deleteBookCard');
    const book = D.book || {};

    if (statusEl) {
      if (book.filename) {
        statusEl.className = 'info-card has-book';
        const kb = book.fileSize ? (book.fileSize / 1024).toFixed(0) + ' KB' : '';
        statusEl.innerHTML = `<strong>Current book:</strong> ${esc(book.originalName || book.filename)} ${kb ? '(' + kb + ')' : ''} — uploaded ${esc(book.uploadedAt || '')}`;
        if (deleteCard) deleteCard.style.display = 'block';
      } else {
        statusEl.className = 'info-card no-book';
        statusEl.textContent = 'No book uploaded yet. Upload a PDF below to enable purchases.';
      }
    }

    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
      uploadForm.addEventListener('submit', async e => {
        e.preventDefault();
        const fileInput = document.getElementById('bookFile');
        if (!fileInput.files[0]) return;

        const fd = new FormData();
        fd.append('book', fileInput.files[0]);
        fd.append('_csrf', CSRF);

        const progressWrap = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressLabel = document.getElementById('progressLabel');
        if (progressWrap) progressWrap.style.display = 'flex';

        const btn = uploadForm.querySelector('button[type=submit]');
        btn.disabled = true; btn.textContent = 'Uploading…';

        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/admin/book/upload');
          xhr.setRequestHeader('X-CSRF-Token', CSRF);
          xhr.upload.addEventListener('progress', ev => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              if (progressFill) progressFill.style.width = pct + '%';
              if (progressLabel) progressLabel.textContent = pct + '%';
            }
          });
          xhr.onload = () => {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              toast('Book uploaded successfully!', 'success');
              setTimeout(() => location.reload(), 1000);
            } else {
              toast('Upload failed: ' + data.error, 'error');
              if (progressWrap) progressWrap.style.display = 'none';
              btn.disabled = false; btn.textContent = 'Upload PDF';
            }
          };
          xhr.onerror = () => { toast('Upload failed. Please try again.', 'error'); btn.disabled = false; btn.textContent = 'Upload PDF'; };
          xhr.send(fd);
        } catch (err) {
          toast('Error: ' + err.message, 'error');
          btn.disabled = false; btn.textContent = 'Upload PDF';
        }
      });
    }

    const deleteBtn = document.getElementById('deleteBookBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete the book file? Purchases will be disabled until a new file is uploaded.')) return;
        const data = await apiFetch('/admin/book', 'DELETE');
        if (data.success) { toast('Book deleted.', 'success'); setTimeout(() => location.reload(), 800); }
        else toast('Error: ' + data.error, 'error');
      });
    }
  }

  // ── Payment settings ───────────────────────────────────────────────────────
  function initPaymentSection() {
    const pay = D.payment || {};
    const pubKeyInput = document.getElementById('pubKeyInput');
    const productNameInput = document.getElementById('productNameInput');
    const priceInput = document.getElementById('priceInput');

    if (pubKeyInput) pubKeyInput.value = pay.publishableKey || '';
    if (productNameInput) productNameInput.value = pay.productName || '';
    if (priceInput) priceInput.value = pay.priceUsdCents || 1999;

    const form = document.getElementById('paymentForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Saving…';
      const statusEl = document.getElementById('stripeStatus');

      const body = {
        stripe_publishable_key: form.stripe_publishable_key.value.trim(),
        stripe_secret_key:      form.stripe_secret_key.value.trim(),
        stripe_webhook_secret:  form.stripe_webhook_secret.value.trim(),
        product_name:           form.product_name.value.trim(),
        price_usd_cents:        parseInt(form.price_usd_cents.value, 10)
      };

      try {
        const data = await apiFetch('/admin/payment', 'POST', body);
        if (data.success) {
          toast('Payment settings saved!', 'success');
          if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.className = 'status-badge ' + (data.connected ? 'ok' : 'err');
            statusEl.textContent = data.connected ? '✓ Stripe connection verified' : '⚠ Could not verify Stripe connection — check your keys';
          }
        } else {
          toast('Error: ' + data.error, 'error');
        }
      } catch (err) {
        toast('Error: ' + err.message, 'error');
      }
      btn.disabled = false; btn.textContent = 'Save Payment Settings';
    });
  }

  // ── Change password ────────────────────────────────────────────────────────
  function initPasswordSection() {
    const form = document.getElementById('passwordForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Updating…';

      const body = {
        current_password: form.current_password.value,
        new_password:     form.new_password.value,
        confirm_password: form.confirm_password.value
      };

      try {
        const data = await apiFetch('/admin/change-password', 'POST', body);
        if (data.success) { toast('Password updated successfully!', 'success'); form.reset(); }
        else toast('Error: ' + data.error, 'error');
      } catch (err) {
        toast('Error: ' + err.message, 'error');
      }
      btn.disabled = false; btn.textContent = 'Update Password';
    });
  }

  // ── Content editor ─────────────────────────────────────────────────────────
  const SECTION_LABELS = {
    hero:          'Hero Section',
    stats:         'Stats Strip',
    chapters:      'Chapters / What\'s Inside',
    bonus_topics:  'Bonus Topics',
    testimonials:  'Testimonials',
    purchase_card: 'Purchase Card',
    faq:           'FAQ',
    footer:        'Footer'
  };

  function initContentEditor() {
    const container = document.getElementById('contentEditor');
    if (!container) return;
    const content = D.content || {};

    const sections = ['hero','stats','chapters','bonus_topics','testimonials','purchase_card','faq','footer'];
    container.innerHTML = sections.map(key => buildSectionPanel(key, content[key] || {})).join('');

    container.querySelectorAll('.section-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const body = toggle.nextElementSibling;
        toggle.classList.toggle('open');
        body.classList.toggle('open');
      });
    });

    container.querySelectorAll('.section-save-btn').forEach(btn => {
      btn.addEventListener('click', () => saveSection(btn.dataset.section, container));
    });

    container.querySelectorAll('.btn-add-row').forEach(btn => {
      btn.addEventListener('click', () => addRow(btn));
    });

    container.addEventListener('click', e => {
      if (e.target.classList.contains('btn-remove-row')) {
        e.target.closest('.repeat-row').remove();
      }
    });
  }

  function buildSectionPanel(key, data) {
    return `
      <div class="content-section" data-section="${key}">
        <div class="section-toggle">
          <h3>${SECTION_LABELS[key] || key}</h3>
          <span class="chevron">▼</span>
        </div>
        <div class="section-body">
          ${buildSectionFields(key, data)}
          <button class="btn-primary section-save-btn mt-1" data-section="${key}">Save ${SECTION_LABELS[key] || key}</button>
        </div>
      </div>`;
  }

  function buildSectionFields(key, data) {
    switch (key) {
      case 'hero':
        return `
          ${field('headline','Headline', data.headline||'')}
          ${field('subheadline','Subheadline', data.subheadline||'', 'textarea')}
          ${field('price','Price (e.g. 19.99)', data.price||'')}
          ${field('original_price','Original Price', data.original_price||'')}
          ${field('cta_text','CTA Button Text', data.cta_text||'')}`;

      case 'stats':
        return repeatSection('stat', (data.items||[]).map(i =>
          `<div class="repeat-row-inner"><input name="number" value="${esc(i.number||'')}" placeholder="Number"><input name="label" value="${esc(i.label||'')}" placeholder="Label"></div>`
        ), ['number','label']);

      case 'chapters':
        return repeatSection('chapter', (data.items||[]).map(i =>
          `<div class="repeat-row-fields">
            <div class="repeat-row-inner">
              <input name="number" value="${esc(i.number||'')}" placeholder="No." style="max-width:60px">
              <input name="title" value="${esc(i.title||'')}" placeholder="Title">
            </div>
            <textarea name="description" placeholder="Description">${esc(i.description||'')}</textarea>
           </div>`
        ), ['number','title','description']);

      case 'bonus_topics':
        return `
          ${field('title','Title', data.title||'')}
          ${field('body','Body Text', data.body||'', 'textarea')}
          <div class="form-group">
            <label>Pills (tags)</label>
            ${repeatSection('pill', (data.pills||[]).map(p =>
              `<div class="repeat-row-inner"><input name="pill" value="${esc(p||'')}" placeholder="Tag text"></div>`
            ), ['pill'], true)}
          </div>`;

      case 'testimonials':
        return repeatSection('testimonial', (data.items||[]).map(i =>
          `<div class="repeat-row-fields">
            <div class="repeat-row-inner">
              <input name="initials" value="${esc(i.initials||'')}" placeholder="Initials" style="max-width:70px">
              <input name="name" value="${esc(i.name||'')}" placeholder="Full Name">
              <input name="location" value="${esc(i.location||'')}" placeholder="Location">
            </div>
            <textarea name="text" placeholder="Testimonial text">${esc(i.text||'')}</textarea>
           </div>`
        ), ['initials','name','location','text']);

      case 'purchase_card':
        return `
          ${field('title','Title', data.title||'')}
          ${field('subtitle','Subtitle', data.subtitle||'')}
          <div class="form-group">
            <label>Features List</label>
            ${repeatSection('feature', (data.features||[]).map(f =>
              `<div class="repeat-row-inner"><input name="feature" value="${esc(f||'')}" placeholder="Feature text"></div>`
            ), ['feature'], true)}
          </div>`;

      case 'faq':
        return repeatSection('faq', (data.items||[]).map(i =>
          `<div class="repeat-row-fields">
            <input name="question" value="${esc(i.question||'')}" placeholder="Question">
            <textarea name="answer" placeholder="Answer">${esc(i.answer||'')}</textarea>
           </div>`
        ), ['question','answer']);

      case 'footer':
        return `
          ${field('brand_name','Brand Name', data.brand_name||'')}
          ${field('tagline','Tagline', data.tagline||'')}
          ${field('email','Support Email', data.email||'')}
          ${field('copyright','Copyright Text', data.copyright||'')}`;

      default: return `<pre>${esc(JSON.stringify(data,null,2))}</pre>`;
    }
  }

  function field(name, label, value, type) {
    if (type === 'textarea') {
      return `<div class="form-group"><label>${label}</label><textarea name="${name}">${esc(value)}</textarea></div>`;
    }
    return `<div class="form-group"><label>${label}</label><input type="text" name="${name}" value="${esc(value)}"></div>`;
  }

  function repeatSection(rowType, rowsHtml, fieldNames, compact) {
    return `
      <div class="repeat-list" data-row-type="${rowType}" data-fields="${fieldNames.join(',')}">
        ${rowsHtml.map(r => `<div class="repeat-row">${r}<button class="btn-remove-row" title="Remove">✕</button></div>`).join('')}
      </div>
      <button type="button" class="btn-add-row" data-row-type="${rowType}" data-fields="${fieldNames.join(',')}">+ Add row</button>`;
  }

  function addRow(btn) {
    const rowType = btn.dataset.rowType;
    const fields = btn.dataset.fields.split(',');
    const list = btn.previousElementSibling;
    if (!list) return;

    let inner = '';
    if (fields.length === 1) {
      inner = `<div class="repeat-row-inner"><input name="${fields[0]}" placeholder="${fields[0]}"></div>`;
    } else if (fields.includes('description') || fields.includes('answer') || fields.includes('text')) {
      // Multi-field with textarea
      inner = `<div class="repeat-row-fields">
        <div class="repeat-row-inner">${fields.filter(f => f !== 'description' && f !== 'answer' && f !== 'text').map(f => `<input name="${f}" placeholder="${f}">`).join('')}</div>
        ${fields.filter(f => f === 'description' || f === 'answer' || f === 'text').map(f => `<textarea name="${f}" placeholder="${f}"></textarea>`).join('')}
      </div>`;
    } else {
      inner = `<div class="repeat-row-inner">${fields.map(f => `<input name="${f}" placeholder="${f}">`).join('')}</div>`;
    }

    const row = document.createElement('div');
    row.className = 'repeat-row';
    row.innerHTML = inner + '<button class="btn-remove-row" title="Remove">✕</button>';
    list.appendChild(row);
  }

  function collectSection(key, container) {
    const panel = container.querySelector(`[data-section="${key}"]`);
    if (!panel) return {};

    switch (key) {
      case 'hero': case 'footer': {
        const obj = {};
        panel.querySelectorAll('input[name], textarea[name]').forEach(el => { obj[el.name] = el.value.trim(); });
        return obj;
      }
      case 'stats':
        return { items: collectRows(panel, ['number','label']) };
      case 'chapters':
        return { items: collectRows(panel, ['number','title','description']) };
      case 'bonus_topics': {
        const obj = {};
        panel.querySelectorAll('input[name="title"], textarea[name="body"]').forEach(el => { obj[el.name] = el.value.trim(); });
        obj.pills = [];
        panel.querySelectorAll('input[name="pill"]').forEach(el => { if (el.value.trim()) obj.pills.push(el.value.trim()); });
        return obj;
      }
      case 'testimonials':
        return { items: collectRows(panel, ['initials','name','location','text']) };
      case 'purchase_card': {
        const obj = {};
        panel.querySelectorAll('input[name="title"], input[name="subtitle"]').forEach(el => { obj[el.name] = el.value.trim(); });
        obj.features = [];
        panel.querySelectorAll('input[name="feature"]').forEach(el => { if (el.value.trim()) obj.features.push(el.value.trim()); });
        return obj;
      }
      case 'faq':
        return { items: collectRows(panel, ['question','answer']) };
      default: return {};
    }
  }

  function collectRows(panel, fieldNames) {
    const rows = [];
    panel.querySelectorAll('.repeat-row').forEach(row => {
      const obj = {};
      fieldNames.forEach(f => {
        const el = row.querySelector(`[name="${f}"]`);
        if (el) obj[f] = el.value.trim();
      });
      rows.push(obj);
    });
    return rows;
  }

  async function saveSection(key, container) {
    const btn = container.querySelector(`[data-section="${key}"] .section-save-btn`);
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    try {
      const body = collectSection(key, container);
      const data = await apiFetch(`/admin/content/${key}`, 'POST', body);
      if (data.success) toast('Saved!', 'success');
      else toast('Error: ' + data.error, 'error');
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = 'Save ' + (SECTION_LABELS[key] || key); }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initOverview();
    initBookSection();
    initPaymentSection();
    initPasswordSection();
    initContentEditor();
  });
})();
