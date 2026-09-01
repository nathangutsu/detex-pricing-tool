// DETEX Pricing Tool — lookup, quote builder, discount calculator.
// Data comes from data.js (DETEX_DATA, DETEX_META), generated from 8-2026-Excel-Price-List.xlsx.

const STORAGE_QUOTE = 'detex_quote_v1';
const STORAGE_DISCOUNT = 'detex_discount_pct_v1';

const state = {
  discountPct: 65, // % off list -> default net multiplier 0.35, current standing default
  quote: [], // { part, desc, cat, uoi, listPrice, qty, discountPct, note }
};

function loadState() {
  try {
    const d = localStorage.getItem(STORAGE_DISCOUNT);
    if (d !== null && !isNaN(parseFloat(d))) state.discountPct = parseFloat(d);
  } catch (e) {}
  try {
    const q = localStorage.getItem(STORAGE_QUOTE);
    if (q) state.quote = JSON.parse(q);
  } catch (e) {}
}

function saveQuote() {
  try { localStorage.setItem(STORAGE_QUOTE, JSON.stringify(state.quote)); } catch (e) {}
}
function saveDiscount() {
  try { localStorage.setItem(STORAGE_DISCOUNT, String(state.discountPct)); } catch (e) {}
}

function multiplierFromPct(pct) {
  return Math.max(0, (100 - pct) / 100);
}
function pctFromMultiplier(mult) {
  return Math.max(0, (1 - mult) * 100);
}
function money(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- Tabs ----------
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.panel).classList.add('active');
      if (btn.dataset.panel === 'panel-quote') renderQuote();
      if (btn.dataset.panel === 'panel-sku') document.getElementById('skuInput').focus();
    });
  });
}

// ---------- Lookup ----------
function populateCategoryFilter() {
  const sel = document.getElementById('catFilter');
  const cats = Array.from(new Set(DETEX_DATA.map(r => r.cat))).sort();
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c + ' (' + DETEX_DATA.filter(r => r.cat === c).length + ')';
    sel.appendChild(opt);
  });
}

function searchRecords(query, cat) {
  const q = query.trim().toLowerCase();
  let results = DETEX_DATA;
  if (cat) results = results.filter(r => r.cat === cat);
  if (q) {
    results = results.filter(r =>
      r.part.toLowerCase().includes(q) ||
      r.desc.toLowerCase().includes(q) ||
      r.fam.toLowerCase().includes(q)
    );
  }
  return results;
}

function renderResults() {
  const query = document.getElementById('searchInput').value;
  const cat = document.getElementById('catFilter').value;
  const container = document.getElementById('results');
  const meta = document.getElementById('resultsMeta');

  if (!query.trim() && !cat) {
    container.innerHTML = '';
    meta.textContent = `Type a part number, keyword, or description to search ${DETEX_DATA.length.toLocaleString()} priced items — or pick a category.`;
    return;
  }

  const results = searchRecords(query, cat).slice(0, 250);
  meta.textContent = `${results.length.toLocaleString()} result${results.length === 1 ? '' : 's'} shown${results.length === 250 ? ' (showing first 250 — refine your search)' : ''}`;

  if (results.length === 0) {
    container.innerHTML = '<div class="empty-state">No matches in the current price list. Check the spelling, or this SKU may not exist in the current catalog — do not assume a price.</div>';
    return;
  }

  container.innerHTML = results.map((r, i) => {
    const mult = multiplierFromPct(state.discountPct);
    const net = r.price * mult;
    const idx = DETEX_DATA.indexOf(r);
    return `
      <div class="card">
        <div class="card-head">
          <span class="part-no">${escapeHtml(r.part)}</span>
          <span class="cat-pill">${escapeHtml(r.cat)}</span>
        </div>
        <div class="card-body">
          <div class="desc">
            ${escapeHtml(r.desc || '(no description)')}
            <div class="fam-line">${escapeHtml(r.fam)} · ${escapeHtml(r.uoi)}${r.warr ? ' · ' + escapeHtml(r.warr) : ''}</div>
            ${r.note ? `<div class="note-flag">⚠ ${escapeHtml(r.note)}</div>` : ''}
          </div>
          <div class="price-block">
            <div class="list-price">${money(r.price)}</div>
            <div class="net-price">net ${money(net)} @ ${state.discountPct}% off</div>
          </div>
          <div class="add-controls">
            <input type="number" class="qty-input" min="1" value="1" id="qty-${idx}">
            <button class="btn" onclick="addToQuote(${idx})">Add to Quote</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

window.addToQuote = function (idx) {
  const r = DETEX_DATA[idx];
  const qtyInput = document.getElementById(`qty-${idx}`);
  const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
  const existing = state.quote.find(l => l.part === r.part && l.cat === r.cat);
  if (existing) {
    existing.qty += qty;
  } else {
    state.quote.push({
      part: r.part,
      desc: r.desc,
      cat: r.cat,
      uoi: r.uoi,
      listPrice: r.price,
      qty: qty,
      discountPct: state.discountPct,
      note: r.note || null,
    });
  }
  saveQuote();
  showToast(`Added ${qty} × ${r.part} to quote`);
};

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---------- SKU Builder ----------
function renderSkuResult() {
  const raw = document.getElementById('skuInput').value;
  const container = document.getElementById('skuResult');
  if (!raw.trim()) { container.innerHTML = ''; return; }

  const result = buildAssembledSku(raw);
  if (result.error) {
    container.innerHTML = `<div class="card"><div class="card-body"><div class="note-flag">⚠ ${escapeHtml(result.error)}</div></div></div>`;
    return;
  }

  const mult = multiplierFromPct(state.discountPct);
  const net = result.total * mult;

  const rows = result.lines.map(l => `
    <tr>
      <td>${escapeHtml(l.label)}${l.note ? `<div class="note-flag">⚠ ${escapeHtml(l.note)}</div>` : ''}</td>
      <td class="num">${money(l.price)}</td>
      <td class="fam-line">p.${l.page}</td>
    </tr>
  `).join('');

  const warnings = result.unresolved.length
    ? `<div class="note-flag" style="flex-direction:column; align-items:flex-start;">⚠ ${result.unresolved.map(escapeHtml).join('<br>⚠ ')}</div>`
    : '';

  container.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="part-no">${escapeHtml(raw.trim())}</span>
        <span class="cat-pill">${escapeHtml(result.seriesLabel)}</span>
      </div>
      <div class="card-body" style="display:block;">
        <table class="quote-table" style="margin-bottom:12px;">
          <thead><tr><th>Component</th><th>Price</th><th>Source</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${warnings}
        <div style="display:flex; justify-content:flex-end; gap:24px; margin-top:12px; align-items:center;">
          <div class="price-block">
            <div class="list-price">${money(result.total)}</div>
            <div class="net-price">net ${money(net)} @ ${state.discountPct}% off</div>
          </div>
          <button class="btn" id="skuAddToQuote">Add to Quote</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('skuAddToQuote').addEventListener('click', () => {
    state.quote.push({
      part: raw.trim(),
      desc: result.lines.map(l => l.label).join('; '),
      cat: `SKU BUILDER — ${result.seriesLabel}`,
      uoi: 'EA.',
      listPrice: result.total,
      qty: 1,
      discountPct: state.discountPct,
      note: result.unresolved.length ? `Unresolved items were not priced: ${result.unresolved.join(' ')}` : null,
    });
    saveQuote();
    showToast('Added assembled SKU to quote');
  });
}

function initSkuBuilder() {
  document.getElementById('skuPriceBtn').addEventListener('click', renderSkuResult);
  document.getElementById('skuInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') renderSkuResult();
  });
}

// ---------- Discount bar (shared: drives default % for new lookups & quote lines) ----------
function initDiscountBar() {
  const pctInput = document.getElementById('discountPctInput');
  const multInput = document.getElementById('discountMultInput');

  pctInput.value = state.discountPct;
  multInput.value = multiplierFromPct(state.discountPct).toFixed(4);

  pctInput.addEventListener('input', () => {
    const v = parseFloat(pctInput.value);
    if (isNaN(v)) return;
    state.discountPct = v;
    multInput.value = multiplierFromPct(v).toFixed(4);
    saveDiscount();
    renderResults();
  });

  multInput.addEventListener('input', () => {
    const v = parseFloat(multInput.value);
    if (isNaN(v)) return;
    state.discountPct = pctFromMultiplier(v);
    pctInput.value = Number(state.discountPct.toFixed(4));
    saveDiscount();
    renderResults();
  });

  document.getElementById('applyDiscountAll').addEventListener('click', () => {
    state.quote.forEach(l => l.discountPct = state.discountPct);
    saveQuote();
    renderQuote();
    showToast(`Applied ${state.discountPct}% off to all quote lines`);
  });
}

// ---------- Quote builder ----------
function renderQuote() {
  const tbody = document.getElementById('quoteBody');
  const wrap = document.getElementById('quoteTableWrap');
  const emptyMsg = document.getElementById('quoteEmpty');

  if (state.quote.length === 0) {
    wrap.style.display = 'none';
    emptyMsg.style.display = 'block';
    document.getElementById('quoteTotals').style.display = 'none';
    return;
  }
  wrap.style.display = '';
  emptyMsg.style.display = 'none';
  document.getElementById('quoteTotals').style.display = 'flex';

  let listTotal = 0, netTotal = 0;

  tbody.innerHTML = state.quote.map((l, i) => {
    const mult = multiplierFromPct(l.discountPct);
    const netUnit = l.listPrice * mult;
    const extList = l.listPrice * l.qty;
    const extNet = netUnit * l.qty;
    listTotal += extList;
    netTotal += extNet;
    return `
      <tr>
        <td>${i + 1}</td>
        <td><input type="number" class="qb-qty" min="1" value="${l.qty}" onchange="updateQuoteLine(${i}, 'qty', this.value)"></td>
        <td>
          <div class="part-no">${escapeHtml(l.part)}</div>
          <div class="fam-line">${escapeHtml(l.cat)}</div>
        </td>
        <td style="max-width:280px;">${escapeHtml(l.desc)}${l.note ? `<div class="note-flag">⚠ ${escapeHtml(l.note)}</div>` : ''}</td>
        <td class="num">${money(l.listPrice)}</td>
        <td><input type="number" class="qb-disc" min="0" max="100" step="0.1" value="${l.discountPct}" onchange="updateQuoteLine(${i}, 'discountPct', this.value)">%</td>
        <td class="num">${money(netUnit)}</td>
        <td class="num">${money(extNet)}</td>
        <td><button class="btn danger small" onclick="removeQuoteLine(${i})">✕</button></td>
      </tr>
    `;
  }).join('');

  document.getElementById('totListVal').textContent = money(listTotal);
  document.getElementById('totNetVal').textContent = money(netTotal);
  document.getElementById('totSavingsVal').textContent = money(listTotal - netTotal);
}

window.updateQuoteLine = function (i, field, value) {
  const v = parseFloat(value);
  if (isNaN(v) || v < 0) return;
  state.quote[i][field] = v;
  saveQuote();
  renderQuote();
};

window.removeQuoteLine = function (i) {
  state.quote.splice(i, 1);
  saveQuote();
  renderQuote();
};

function initQuoteActions() {
  document.getElementById('clearQuoteBtn').addEventListener('click', () => {
    if (state.quote.length === 0) return;
    if (!confirm('Clear all lines from the current quote?')) return;
    state.quote = [];
    saveQuote();
    renderQuote();
  });

  document.getElementById('printQuoteBtn').addEventListener('click', () => window.print());

  document.getElementById('csvQuoteBtn').addEventListener('click', () => {
    const rows = [['Qty', 'Part Number', 'Category', 'Description', 'List Price', 'Discount %', 'Net Unit', 'Extended Net']];
    state.quote.forEach(l => {
      const mult = multiplierFromPct(l.discountPct);
      const netUnit = l.listPrice * mult;
      rows.push([l.qty, l.part, l.cat, l.desc, l.listPrice.toFixed(2), l.discountPct, netUnit.toFixed(2), (netUnit * l.qty).toFixed(2)]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    navigator.clipboard.writeText(csv).then(() => showToast('Quote copied to clipboard as CSV')).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = csv;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Quote copied to clipboard as CSV');
    });
  });
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  document.getElementById('sourceLine').textContent =
    `Source: ${DETEX_META.sourceFile} — ${DETEX_META.recordCount.toLocaleString()} priced items — Effective ${DETEX_META.effectiveDate}. Cross-checked against ${DETEX_META.pdfCrossRef} where flagged.`;
  document.getElementById('correctionsList').innerHTML = DETEX_META.corrections.map(c => `<li>${escapeHtml(c)}</li>`).join('');

  populateCategoryFilter();
  initTabs();
  initDiscountBar();
  initQuoteActions();
  initSkuBuilder();

  document.getElementById('searchInput').addEventListener('input', renderResults);
  document.getElementById('catFilter').addEventListener('change', renderResults);

  renderResults();
  renderQuote();
});
