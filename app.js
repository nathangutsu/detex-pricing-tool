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
  // Quotes intentionally do NOT persist across page loads — every visit starts with an empty
  // quote so stale line items from an earlier session can never linger. Clean up any quote
  // data a prior version of this app may have left in localStorage.
  try { localStorage.removeItem(STORAGE_QUOTE); } catch (e) {}
}

function saveQuote() {
  // No-op by design — see loadState(). Kept as a named function since it's called throughout
  // the quote-editing code paths; state.quote itself is still the in-memory source of truth
  // for the current page session.
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
  return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  container.innerHTML = results.map(r => catalogCardHtml(r, DETEX_DATA.indexOf(r), 'qty')).join('');
}

// One catalog row as a card with qty + Add to Quote. `prefix` keeps the qty input ids unique per tab.
function catalogCardHtml(r, idx, prefix) {
  const net = r.price * multiplierFromPct(state.discountPct);
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
          <input type="number" class="qty-input" min="1" value="1" id="${prefix}-${idx}">
          <button class="btn" onclick="addToQuote(${idx}, '${prefix}')">Add to Quote</button>
        </div>
      </div>
    </div>
  `;
}

// Catalog part-number matching for the Device Builder: case-insensitive, ignoring the catalog's
// trailing "*" footnote marks and "(std.)" tags.
function catalogKey(part) {
  return String(part).toUpperCase().replace(/\s*\(STD\.\)\s*$/, '').replace(/[\s*]+$/, '').trim();
}
let _catalogIndex = null;
function catalogIndex() {
  if (!_catalogIndex) {
    _catalogIndex = new Map();
    DETEX_DATA.forEach(r => {
      const k = catalogKey(r.part);
      if (!_catalogIndex.has(k)) _catalogIndex.set(k, []);
      _catalogIndex.get(k).push(r);
    });
  }
  return _catalogIndex;
}
function findCatalogExact(q) {
  return catalogIndex().get(catalogKey(q)) || [];
}
function findCatalogNear(q, limit) {
  const key = catalogKey(q);
  const starts = [], contains = [];
  catalogIndex().forEach((recs, k) => {
    if (k.startsWith(key)) starts.push([k, recs]);
    else if (k.includes(key)) contains.push([k, recs]);
  });
  const byLen = (x, y) => x[0].length - y[0].length || x[0].localeCompare(y[0]);
  return starts.sort(byLen).concat(contains.sort(byLen)).flatMap(x => x[1]).slice(0, limit || 25);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

window.addToQuote = function (idx, prefix) {
  const r = DETEX_DATA[idx];
  const qtyInput = document.getElementById(`${prefix || 'qty'}-${idx}`);
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

  const typed = raw.trim().toUpperCase();
  const exact = findCatalogExact(typed);
  if (exact.length) {
    container.innerHTML = `<div class="results-meta">Catalog part number ${escapeHtml(typed)} — priced straight from the price list.</div>`
      + exact.map(r => catalogCardHtml(r, DETEX_DATA.indexOf(r), 'skuqty')).join('');
    return;
  }

  const result = buildAssembledSku(raw);
  if (result.error) {
    const near = typed.length >= 3 ? findCatalogNear(typed) : [];
    if (near.length) {
      container.innerHTML = `<div class="results-meta">No exact catalog match for ${escapeHtml(typed)} and it isn't a buildable device string — closest catalog part numbers:</div>`
        + near.map(r => catalogCardHtml(r, DETEX_DATA.indexOf(r), 'skuqty')).join('');
      return;
    }
    container.innerHTML = `<div class="card"><div class="card-body"><div class="note-flag">⚠ ${escapeHtml(result.error)}</div></div></div>`;
    return;
  }

  const mult = multiplierFromPct(state.discountPct);
  const net = result.total * mult;

  const rows = result.lines.map(l => `
    <tr>
      <td>${escapeHtml(l.label)}${l.info ? `<div class="info-line">${escapeHtml(l.info)}</div>` : ''}${l.note ? `<div class="note-flag">⚠ ${escapeHtml(l.note)}</div>` : ''}</td>
      <td class="num">${money(l.price)}</td>
      <td class="fam-line">${l.page ? 'p.' + l.page : 'flat catalog'}</td>
    </tr>
  `).join('');

  const warnings = result.unresolved.length
    ? `<div class="note-flag" style="flex-direction:column; align-items:flex-start;">⚠ ${result.unresolved.map(escapeHtml).join('<br>⚠ ')}</div>`
    : '';

  container.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span class="part-no">${escapeHtml(result.partNumber)}</span>
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
      part: result.partNumber,
      desc: result.lines.map(l => l.label).join('; '),
      breakdown: result.lines.map(l => ({ label: l.label, price: l.price, info: l.info || null })),
      cat: `DEVICE BUILDER — ${result.seriesLabel}`,
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
function renderQuoteDesc(l) {
  if (!l.breakdown || l.breakdown.length === 0) return escapeHtml(l.desc);
  return `<div class="qb-breakdown">${l.breakdown.map(b => `
    <div class="qb-breakdown-item">
      <div class="qb-breakdown-row"><span>${escapeHtml(b.label)}</span><span class="num">${money(b.price)}</span></div>
      ${b.info ? `<div class="info-line">${escapeHtml(b.info)}</div>` : ''}
    </div>
  `).join('')}</div>`;
}

function renderQuote() {
  const tbody = document.getElementById('quoteBody');
  const wrap = document.getElementById('quoteTableWrap');
  const emptyMsg = document.getElementById('quoteEmpty');

  if (state.quote.length === 0) {
    wrap.style.display = 'none';
    emptyMsg.style.display = 'block';
    document.getElementById('quoteTotals').style.display = 'none';
    updateEmailPreview();
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
        <td style="max-width:320px;">${renderQuoteDesc(l)}${l.note ? `<div class="note-flag">⚠ ${escapeHtml(l.note)}</div>` : ''}</td>
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

  updateEmailPreview();
}

function buildEmailText() {
  if (state.quote.length === 0) return '';
  const lines = [];
  lines.push('DETEX Pricing');
  lines.push('Prepared ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  lines.push('');

  let listTotal = 0, netTotal = 0;
  state.quote.forEach((l, i) => {
    const mult = multiplierFromPct(l.discountPct);
    const netUnit = l.listPrice * mult;
    const extNet = netUnit * l.qty;
    listTotal += l.listPrice * l.qty;
    netTotal += extNet;
    lines.push(`Line ${i + 1}: ${l.part}`);
    if (l.breakdown && l.breakdown.length) {
      l.breakdown.forEach(b => {
        lines.push(`   - ${b.label}: ${money(b.price)}`);
        if (b.info) lines.push(`     ${b.info}`);
      });
    } else if (l.desc) {
      lines.push(`   ${l.desc}`);
    }
    lines.push(`   List: ${money(l.listPrice)}`);
    const multStr = mult.toFixed(2).replace(/^0\./, '.');
    lines.push(`   Qty ${l.qty} x ${money(netUnit)} = ${money(extNet)}  (net @ ${multStr})`);
    lines.push('');
  });

  lines.push('----------------------------------------');
  lines.push(`List Total:  ${money(listTotal)}`);
  lines.push(`Net Total:   ${money(netTotal)}`);

  return lines.join('\n');
}

function updateEmailPreview() {
  const box = document.getElementById('emailPreviewBox');
  const wrap = document.getElementById('emailPreviewWrap');
  if (state.quote.length === 0) {
    wrap.style.display = 'none';
    box.value = '';
    return;
  }
  wrap.style.display = '';
  box.value = buildEmailText();
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

  document.getElementById('emailQuoteBtn').addEventListener('click', () => {
    if (state.quote.length === 0) return;
    const text = buildEmailText();
    navigator.clipboard.writeText(text).then(() => showToast('Quote copied — paste into your email')).catch(() => {
      const box = document.getElementById('emailPreviewBox');
      box.select();
      document.execCommand('copy');
      showToast('Quote copied — paste into your email');
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
