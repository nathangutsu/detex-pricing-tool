// SKU Builder — decomposes an assembled DETEX device+trim+options string and prices each
// component against SERIES_RULES (rules.js) and the flat catalog (DETEX_DATA, data.js).
// Covers Advantex 10, 20, 21, 27, 30, 40, 50, 51, 60-63, 70, 71, 80-83, 87 and Value Series V40, V50, V51
// (rules.js). Dummy devices (00/05, 01/04), the narrow-stile Value variants and FSB levers are not built here.

const GLOBAL_OPTION_INFO = {}; // code -> { label, page } across all series, for "not available on this series" messages
Object.keys(SERIES_RULES).forEach(sk => {
  const r = SERIES_RULES[sk];
  Object.keys(r.options).forEach(code => {
    if (!GLOBAL_OPTION_INFO[code]) GLOBAL_OPTION_INFO[code] = r.options[code];
  });
});
// Also register the well-known series-specific codes that some series simply omit,
// so we can explain *why* rather than just saying "unrecognized".
['W','H','FH','AM','SLR','96','120'].forEach(c => {
  if (!GLOBAL_OPTION_INFO[c]) GLOBAL_OPTION_INFO[c] = { label: c, page: null };
});

// Electrified FUNCTIONS (EA, EE, ER EX, ...) exist as flat rows in DETEX_DATA (cat 'ADVANTEX' or
// 'VALUE SERIES') with per-code eligibility spelled out in their own descriptions. Their prices are
// looked up live from DETEX_DATA so a data.js regeneration stays authoritative automatically; only
// the eligibility subsets and cross-requirement notes below were read off those descriptions.
// Each function's own OPTIONS and ACCESSORIES (conduit kits, keystop, silent arming, controllers,
// ...) live in ELECTRIFIED_OPTIONS (electrified.js, transcribed from the PDF's per-function pages).
const ELECTRIFIED_COMPOUND_CODES = ['EE ER EX', 'ER EX W', 'EB W', 'EEX W', 'EX W', 'EXV W', 'ER EX'];

// catGroup -> { CODE -> [ { host, kind: 'option'|'accessory', code, label, price, page, controller? } ] }
const ELEC_OPTION_INDEX = {};
const ELEC_DASHED_CODES = new Set(); // multi-piece codes typed with dashes, e.g. PT-5, EWH8-626, 81-800
Object.keys(ELECTRIFIED_OPTIONS).forEach(g => {
  const idx = {};
  Object.keys(ELECTRIFIED_OPTIONS[g]).forEach(host => {
    const h = ELECTRIFIED_OPTIONS[g][host];
    ['options', 'accessories'].forEach(kind => {
      Object.keys(h[kind]).forEach(code => {
        const key = code.toUpperCase();
        (idx[key] = idx[key] || []).push(Object.assign({ host, kind: kind === 'options' ? 'option' : 'accessory', code }, h[kind][code]));
        if (key.includes('-')) ELEC_DASHED_CODES.add(key);
      });
    });
  });
  ELEC_OPTION_INDEX[g] = idx;
});

// trim code -> series that offer it, so a trim typed for the wrong series gets a useful message
const TRIM_OFFERED = {};
Object.keys(SERIES_RULES).forEach(sk => {
  const r = SERIES_RULES[sk];
  Object.keys(Object.assign({}, r.pulls, r.levers)).forEach(code => {
    (TRIM_OFFERED[code.toUpperCase()] = TRIM_OFFERED[code.toUpperCase()] || []).push(sk);
  });
});

// Options that only apply to specific device series (per the option's own catalog line).
const OPTION_SERIES_RESTRICT = { 'LBM': ['V40'] };

// Functions the PDF lists as "Available on ... non-weatherized devices" (page numbers come from ELECTRIFIED_OPTIONS).
// Pairing one with a weatherized (W) device gets flagged, not blocked.
const ELEC_NON_WEATHERIZED = {
  'ADVANTEX': new Set(['EA', 'ER EX', 'EI', 'ED', 'EE', 'EEX', 'EE ER EX', 'ES', 'EX', 'LX', 'LXV', 'EXV']),
  'VALUE SERIES': new Set(['EA', 'EB', 'ED', 'ER EX', 'ES', 'EE', 'EEX', 'EI', 'EX', 'EXV']),
};

// Eligible Advantex series per electrified function, from the "Available on ..." line on each function page
// (PDF pp.35-41; where the spreadsheet's own description differs, the PDF page wins).
const ADV_ALL = ['10','20','21','27','30','40','50','51','60','61','62','63','70','71','80','81','82','83','87'];
const ADV_W = ['10','20','21','40','50','51'];
const ADV_LX = ['10','40','60','61','62','63','70','71','80','81','82','83'];

const ELECTRIFIED_ELIGIBILITY = {
  ADVANTEX: {
    'EA':      { series: ADV_ALL, info: 'EA alarm can be hardwired with 12V AC/DC through 24V AC/DC (PDF p.35).' },
    'EB W':    { series: ADV_W, requiresDeviceW: true },
    'ER EX':   { series: ADV_ALL, needsController: true },
    'ER EX W': { series: ADV_W, info: 'If mounting outside, NEMA enclosure required (PDF p.36).', requiresDeviceW: true, needsController: true },
    'EI':      { series: ['10','30','40'], needsController: true },
    'ED':      { series: ADV_ALL, warn: 'A 24V power supply or logic controller is required for ED but not included. Most applications with ED require a power switch — see PDF p.105 (note on p.37).' },
    'EE':      { series: ADV_ALL, info: 'Detex power supply required and included with the standard EE package; it can power the devices on a pair of doors — add PS0 (Less Power Supply, subtracts $225) to the second door\'s EE (PDF p.38: "specify 10 EE PS0 for second door").' },
    'EEX':     { series: ['10','20','30','40','50'], info: 'Non-weatherized devices, 36" and longer, only (PDF p.38).', needsController: true },
    'EEX W':   { series: ['10','20','40','50'], requiresDeviceW: true, needsController: true },
    'EE ER EX': { series: ADV_ALL, needsController: true, info: 'For options such as silent arming, arming times, set grant times, keystop (armed when key removed), rearm using key only, and access-control-only bypasses (RKO), see the power supply controllers on PDF pp.66-67.' },
    'ES':      { series: ['10','30','40'], warn: 'A logic controller is required but not included in the standard package (PDF p.39 — its wording says "EI", which looks like a typo for ES).' },
    'EX':      { series: ADV_ALL },
    'EX W':    { series: ADV_W, requiresDeviceW: true },
    'EXV':     { series: ADV_ALL },
    'EXV W':   { series: ADV_W, requiresDeviceW: true },
    'LX':      { series: ADV_LX },
    'LXV':     { series: ADV_LX },
  },
  'VALUE SERIES': {
    'EA':      { series: ['V40','V50','V51'] },
    'EB':      { series: ['V40','V50','V51'] },
    'EB W':    { series: ['V40','V50','V51'], requiresDeviceW: true },
    'ED':      { series: ['V40','V50','V51'], warn: 'A 24V power supply or logic controller is required for ED but not included. Most applications with ED require a power switch — see PDF p.105 (note on p.57).' },
    'ER EX':   { series: ['V40','V50','V51'], needsController: true },
    'ER EX W': { series: ['V40','V50','V51'], info: 'If mounting outside, NEMA enclosure required (PDF p.58).', requiresDeviceW: true, needsController: true },
    'ES':      { series: ['V40'], warn: 'A logic controller is required for ES but not included in the standard package (PDF p.58).' },
    'EE':      { series: ['V40','V50','V51'], info: 'Detex power supply required and included with the standard EE package; it can power both devices on a pair of doors — add PS0 (Less Power Supply, subtracts $225) to the second door\'s EE (PDF p.59: "specify V40 EExPS0 for second door").' },
    'EEX':     { series: ['V40','V50','V51'], info: 'Non-weatherized devices, 36" and longer, only (PDF p.59).', needsController: true },
    'EEX W':   { series: ['V40','V50','V51'], requiresDeviceW: true, needsController: true },
    'EI':      { series: ['V40','V50','V51'], needsController: true },
    'EX':      { series: ['V40','V50','V51'] },
    'EX W':    { series: ['V40','V50','V51'], requiresDeviceW: true },
    'EXV':     { series: ['V40','V50','V51'] },
    'EXV W':   { series: ['V40','V50','V51'], requiresDeviceW: true },
  },
};

function mergeCompoundTokens(tokens) {
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    let matched = null;
    for (let span = 3; span >= 2; span--) {
      if (i + span > tokens.length) continue;
      const slice = tokens.slice(i, i + span);
      const spaced = slice.join(' ').toUpperCase();
      if (ELECTRIFIED_COMPOUND_CODES.includes(spaced)) { matched = { span, joined: spaced }; break; }
      const dashed = slice.join('-').toUpperCase();
      if (ELEC_DASHED_CODES.has(dashed)) { matched = { span, joined: dashed }; break; }
    }
    if (matched) { out.push(matched.joined); i += matched.span; }
    else { out.push(tokens[i]); i += 1; }
  }
  return out;
}

// Several real codes contain a literal "X" (EX, EXV, LX, LXV) that collides with "x" used as a
// delimiter elsewhere (V40x08BN). "-" is unambiguous (no code contains a dash), so split on "-"
// first; only split a piece further on "x" if the whole piece doesn't already match something
// known for this series — that keeps EX/EXV/LX/LXV intact while still supporting pure-x input.
function isKnownWholeToken(piece, seriesKey, rules, trimKeysUpper, catGroup) {
  const upper = piece.toUpperCase();
  if (ALL_FINISHES.has(piece)) return true;
  if (piece === '36' || piece === '48' || piece === '60') return true;
  if (piece === '96' || piece === '120') return true;
  if (HANDING_CODES.has(upper)) return true;
  if (DOGGING_CODES.has(upper)) return true;
  if (CYLINDER_CODES[upper]) return true;
  if (rules.options[upper] !== undefined) return true;
  if (trimKeysUpper[upper]) return true;
  if (ELECTRIFIED_ELIGIBILITY[catGroup] && ELECTRIFIED_ELIGIBILITY[catGroup][upper]) return true;
  if (ELEC_OPTION_INDEX[catGroup] && ELEC_OPTION_INDEX[catGroup][upper]) return true;
  return false;
}

function smartSplitRest(afterSeriesStr, seriesKey, rules, trimKeysUpper, catGroup) {
  const dashPieces = afterSeriesStr.split(/-+/).map(s => s.trim()).filter(Boolean);
  const out = [];
  dashPieces.forEach(piece => {
    if (isKnownWholeToken(piece, seriesKey, rules, trimKeysUpper, catGroup) || !/x/i.test(piece)) {
      out.push(piece);
      return;
    }
    const subParts = piece.split(/x+/i).map(s => s.trim()).filter(Boolean);
    if (subParts.length > 1 && subParts.every(sp => isKnownWholeToken(sp, seriesKey, rules, trimKeysUpper, catGroup))) {
      out.push(...subParts);
    } else {
      out.push(piece);
    }
  });
  return out;
}

function findElectrifiedOption(catGroup, code) {
  const upper = code.toUpperCase();
  return DETEX_DATA.find(r => r.cat === catGroup && r.part.toUpperCase() === upper) || null;
}

// Width adders come straight from the PDF option lists: 48" is +$50 on every device page, and the
// 10 Series alone offers 60" (+$353, in 628/693/695 only). The spreadsheet's own width rows are NOT
// used: for the 20/21 and 60/61/62/63 Series they are scrambled (e.g. a 48" device cheaper than the 36").
function widthAdder(seriesKey, width, finish) {
  if (width === '36') return { add: 0 };
  if (width === '48') return { add: 50 };
  if (width === '60' && seriesKey === '10' && ['628', '693', '695'].includes(finish)) return { add: 353 };
  return null;
}

// When the string names no trim finish (or names one the trim isn't priced in) the trim's own standard
// finish is used: the row the price list tags "(std.)".
const TRIM_FINISH_ORDER = ['626', '630', '689', '628', '693', '695', '606', '612', '605', '611', '625', '629', '711'];
function pickTrimPrice(trimEntry, requestedFinish) {
  if (requestedFinish && trimEntry.finishes[requestedFinish] != null) {
    return { price: trimEntry.finishes[requestedFinish], finish: requestedFinish, mixed: false };
  }
  const fallbackFinish = (trimEntry.std && trimEntry.finishes[trimEntry.std] != null)
    ? trimEntry.std
    : TRIM_FINISH_ORDER.find(f => trimEntry.finishes[f] != null);
  if (fallbackFinish) {
    return { price: trimEntry.finishes[fallbackFinish], finish: fallbackFinish, mixed: true };
  }
  return null;
}

function buildAssembledSku(raw) {
  const input = (raw || '').trim().toUpperCase(); // typed case never matters; everything echoed back is capitals
  if (!input) return { error: 'Enter a SKU string, e.g. V40x08BNx36xLDxWxIC7' };

  // Series prefix never contains "x" (10/20/40/60/V40/V50/V51), so the blanket split is safe
  // for extracting just the first token.
  const seriesToken = input.split(/[-x]+/i)[0];
  const seriesKey = Object.keys(SERIES_RULES).find(k => k.toUpperCase() === seriesToken.toUpperCase());
  if (!seriesKey) {
    return {
      error: `Series "${seriesToken}" isn't recognized, or isn't supported yet by the Device Builder. The Device Builder covers ${Object.keys(SERIES_RULES).join(', ')}. Try the Lookup tab if this is meant to be a single flat part number instead.`
    };
  }
  const rules = SERIES_RULES[seriesKey];
  const catGroup = (seriesKey === 'V40' || seriesKey === 'V50' || seriesKey === 'V51') ? 'VALUE SERIES' : 'ADVANTEX';

  const trimTable = Object.assign({}, rules.pulls, rules.levers);
  const trimKeysUpper = {};
  Object.keys(trimTable).forEach(k => { trimKeysUpper[k.toUpperCase()] = k; });

  const afterSeries = input.slice(seriesToken.length).replace(/^[-x]+/i, '');
  const rest = mergeCompoundTokens(smartSplitRest(afterSeries, seriesKey, rules, trimKeysUpper, catGroup));

  let trimCode = null;
  rest.forEach(tok => {
    if (!trimCode && trimKeysUpper[tok.toUpperCase()]) trimCode = trimKeysUpper[tok.toUpperCase()];
  });

  const trimEntryPre = trimCode ? trimTable[trimCode] : null;
  const leverTrim = !!(trimEntryPre && trimEntryPre.lever);
  let deviceFinishToken = null, trimFinishToken = null, widthToken = null, cylinderToken = null;
  let deviceWAdded = false;
  const nonWFnLines = [];
  const lines = [];
  const unresolved = [];

  // Electrified functions (eligible on this series) present in the string. Each function's options and
  // accessories are only valid alongside the function that offers them, so options bind to these.
  const restUpper = rest.map(t => t.toUpperCase());
  const restSet = new Set(restUpper);
  const presentHosts = restUpper.filter((t, i) => {
    const e = ELECTRIFIED_ELIGIBILITY[catGroup][t];
    return e && e.series.includes(seriesKey) && restUpper.indexOf(t) === i;
  });

  rest.forEach(tok => {
    const upper = tok.toUpperCase();
    if (trimCode && upper === trimCode.toUpperCase()) return;

    if (ALL_FINISHES.has(tok)) {
      if (deviceFinishToken === null) deviceFinishToken = tok;
      else trimFinishToken = tok;
      return;
    }
    if (tok === '36' || tok === '48' || tok === '60') {
      widthToken = tok;
      return;
    }
    if (tok === '96' || tok === '120') {
      if (rules.heights && rules.heights[tok] !== undefined) {
        lines.push({ label: `${tok}" height adder`, price: rules.heights[tok], page: rules.devicePage });
      } else {
        unresolved.push(`${tok}" height option isn't offered for ${rules.label} (no height adder listed on p.${rules.devicePage} beyond the standard range).`);
      }
      return;
    }
    if (HANDING_CODES.has(upper)) {
      lines.push({ label: `${upper} — shipping handing (no charge)`, price: 0, page: rules.devicePage });
      return;
    }
    if (DOGGING_CODES.has(upper)) {
      const o = rules.options[upper];
      lines.push({ label: `${upper} — ${o ? o.label : 'dogging option'} (no charge)`, price: 0, page: rules.devicePage });
      return;
    }
    if (CYLINDER_CODES[upper]) {
      cylinderToken = upper;
      return;
    }
    if (rules.options[upper] !== undefined) {
      if (upper === 'W') {
        if (deviceWAdded) return; // already priced via an electrified *_W option's auto-add
        deviceWAdded = true;
      }
      const o = rules.options[upper];
      if (upper === 'T' && leverTrim) {
        unresolved.push(`"${tok}" is priced as the Tornado Rated device option on ${rules.label}, so lever style T can't be specified in the same string.`);
      }
      lines.push({ label: `${upper} — ${o.label}`, price: o.price, page: o.page });
      return;
    }
    if (upper === 'S' || upper === 'T' || upper === 'U') {
      if (!leverTrim) {
        unresolved.push(`"${tok}" is a lever style and only applies with a lever trim. Not priced.`);
        return;
      }
      lines.push({ label: `${upper} lever style (no charge)`, price: 0, page: trimEntryPre.page });
      return;
    }
    if (upper === 'LS' || upper === 'KN') {
      const lo = rules.leverOptions && rules.leverOptions[upper];
      if (!leverTrim || !lo) {
        unresolved.push(`"${tok}" (${upper === 'LS' ? 'lever switch' : 'knurling'}) ${leverTrim ? `isn't offered on ${rules.label} lever trims` : 'applies to lever trims only'}. Not priced.`);
        return;
      }
      lines.push({ label: `${upper} — ${lo.label} (${trimCode})`, price: lo.price, page: lo.page });
      return;
    }
    const elig = ELECTRIFIED_ELIGIBILITY[catGroup] && ELECTRIFIED_ELIGIBILITY[catGroup][upper];
    if (elig) {
      if (!elig.series.includes(seriesKey)) {
        unresolved.push(`"${tok}" (electrified option) isn't available on ${rules.label} — eligible series: ${elig.series.join(', ')}. Not priced.`);
        return;
      }
      const rec = findElectrifiedOption(catGroup, upper);
      if (!rec) {
        unresolved.push(`"${tok}" should be available on ${rules.label} per catalog notes, but no priced row was found in the current data — possible data gap. Not priced.`);
        return;
      }
      let price = rec.price;
      let label = `${upper} — ${rec.desc}`;
      let page = null;
      // A function that the catalog also lists as an option of another function in this string
      // (EX under ED, LX under EA/ER EX/ED/EE/...) is priced at that in-context option price.
      const ctx = (ELEC_OPTION_INDEX[catGroup][upper] || []).find(e =>
        e.kind === 'option' && e.host.toUpperCase() !== upper && presentHosts.includes(e.host.toUpperCase()));
      if (ctx) {
        price = ctx.price;
        label = `${upper} — ${ctx.label} (option of ${ctx.host})`;
        page = ctx.page;
      }
      let note = elig.warn;
      if (elig.needsController) {
        const hostData = ELECTRIFIED_OPTIONS[catGroup][upper];
        const ctrls = hostData ? Object.keys(hostData.accessories).filter(c => hostData.accessories[c].controller) : [];
        if (ctrls.length && !ctrls.some(c => restSet.has(c.toUpperCase()))) {
          const listing = ctrls.map(c => `${c} ($${hostData.accessories[c].price.toLocaleString()})`).join(' / ');
          note = [note, `Controller not included — options: ${listing}. Add one to this string to price it.`].filter(Boolean).join(' ');
        }
      }
      const fnLine = { label, price, page, note, info: elig.info };
      lines.push(fnLine);
      if (ELEC_NON_WEATHERIZED[catGroup].has(upper)) nonWFnLines.push({ line: fnLine, code: upper });
      if (elig.requiresDeviceW && !deviceWAdded && rules.options['W']) {
        deviceWAdded = true;
        lines.push({
          label: `W — ${rules.options['W'].label} (device, required with ${upper})`,
          price: rules.options['W'].price,
          page: rules.options['W'].page,
        });
      }
      return;
    }
    const optEntries = ELEC_OPTION_INDEX[catGroup] && ELEC_OPTION_INDEX[catGroup][upper];
    if (optEntries) {
      if (OPTION_SERIES_RESTRICT[upper] && !OPTION_SERIES_RESTRICT[upper].includes(seriesKey)) {
        unresolved.push(`"${tok}" is only available on ${OPTION_SERIES_RESTRICT[upper].join('/')} per the catalog, not ${rules.label}. Not priced.`);
        return;
      }
      const hits = optEntries.filter(e => presentHosts.includes(e.host.toUpperCase()));
      if (hits.length === 0) {
        const offered = [...new Set(optEntries.map(e => e.host))].join(', ');
        unresolved.push(`"${tok}" is an electrified ${optEntries[0].kind} offered under ${offered} — none of those functions are in this string, so it wasn't priced.`);
        return;
      }
      const e = hits[0];
      if (hits.some(h => h.price !== e.price)) {
        unresolved.push(`"${tok}" is priced differently depending on the function (${hits.map(h => `${h.host} $${h.price}`).join(' vs ')}) — priced under ${e.host}; confirm that's the one you meant.`);
      }
      const optLine = {
        label: `${e.code} — ${e.label} (${e.kind} of ${e.host})${e.price === 0 ? ' (no charge)' : ''}`,
        price: e.price,
        page: e.page,
      };
      if (e.pdfPrintedPrice !== undefined) {
        optLine.note = `PDF p.${e.page} prints $${e.pdfPrintedPrice} for ${e.code} under ${e.host}, but the same part number is $${e.price} on the other pages and in the price list — priced at $${e.price}. Confirm.`;
      }
      lines.push(optLine);
      return;
    }
    if (GLOBAL_OPTION_INFO[upper]) {
      const g = GLOBAL_OPTION_INFO[upper];
      unresolved.push(`"${tok}" (${g.label}) isn't available on ${rules.label} — see p.${rules.devicePage} options list. Not priced.`);
      return;
    }
    if (TRIM_OFFERED[upper]) {
      unresolved.push(`"${tok}" is a trim for ${TRIM_OFFERED[upper].join(', ')} — it isn't offered with ${rules.label}. Not priced.`);
      return;
    }
    unresolved.push(`"${tok}" didn't match a known finish, width, option, or trim code for ${rules.label}. Not priced — verify manually.`);
  });

  if (deviceWAdded) {
    nonWFnLines.forEach(({ line, code }) => {
      const msg = `${code} is listed for non-weatherized devices only (PDF p.${ELECTRIFIED_OPTIONS[catGroup][code].page}), but this device is weatherized (W) — verify before quoting.`;
      line.note = [line.note, msg].filter(Boolean).join(' ');
    });
  }

  const finish = deviceFinishToken || DEVICE_FINISH_DEFAULT[seriesKey];
  const width = widthToken || '36';
  const finishAssumed = !deviceFinishToken;
  const widthAssumed = !widthToken;

  const widthListed = rules.widths.includes(parseInt(width, 10));
  if (!widthListed) {
    unresolved.push(`${width}" width isn't listed for ${rules.label} (available widths: ${rules.widths.join('", ')}").`);
  }

  const deviceLines = [];
  const baseTable = DEVICE_BASE[seriesKey];
  const basePrice = baseTable ? baseTable.prices[finish] : undefined;
  const adder = widthAdder(seriesKey, width, finish);
  if (basePrice === undefined) {
    unresolved.push(`No ${finish} finish price for ${rules.label} on p.${rules.devicePage} — check the finish against the device page. Device not priced.`);
  } else if (!adder) {
    if (widthListed) unresolved.push(`${width}" width isn't offered for ${rules.label} in ${finish} finish (p.${baseTable.page}). Device not priced.`);
  } else {
    const finishNote = finishAssumed ? ' (default, not specified)' : '';
    if (adder.add === 0) {
      deviceLines.push({
        label: `${rules.label} device, ${finish}${finishNote}, ${width}"${widthAssumed ? ' (standard, not specified)' : ''}`,
        price: basePrice,
        page: baseTable.page,
      });
    } else {
      deviceLines.push({ label: `${rules.label} device, ${finish}${finishNote}, 36" base`, price: basePrice, page: baseTable.page });
      deviceLines.push({ label: `${width}" door width adder`, price: adder.add, page: baseTable.page });
    }
  }

  if (trimCode) {
    const trimEntry = trimTable[trimCode];
    const requestedTrimFinish = trimFinishToken || deviceFinishToken || null;
    const picked = pickTrimPrice(trimEntry, requestedTrimFinish);
    if (!picked) {
      unresolved.push(`Trim "${trimCode}" has no priced finish at all in the current catalog — flag as a possible data gap.`);
    } else {
      const line = {
        label: `${trimCode} trim — ${trimEntry.fn} (${picked.finish})`,
        price: picked.price,
        page: trimEntry.page,
      };
      if (picked.mixed && requestedTrimFinish && picked.finish !== requestedTrimFinish) {
        line.note = `Mixed finish: ${trimCode} is only priced in ${picked.finish} — no ${requestedTrimFinish} price exists for this trim (p.${trimEntry.page}).`;
      }
      deviceLines.push(line);
    }

    if (trimEntry.cyl) {
      if (cylinderToken) {
        const cylInfo = CYLINDER_CODES[cylinderToken];
        const cylLine = {
          label: `${cylinderToken} — ${cylInfo.label}, factory installed`,
          price: CYLINDER_INSTALLED_PRICE,
          page: CYLINDER_PAGE,
        };
        if (cylInfo.type !== trimEntry.cyl) {
          cylLine.note = `${trimCode} requires a ${trimEntry.cyl} cylinder, but ${cylinderToken} is a ${cylInfo.type} cylinder. Same $${CYLINDER_INSTALLED_PRICE} installed price either way, but the part number should likely be a ${trimEntry.cyl} cylinder code instead.`;
        }
        deviceLines.push(cylLine);
      } else {
        unresolved.push(`${trimCode} requires a ${trimEntry.cyl} cylinder (p.${CYLINDER_PAGE}) — none specified in this SKU, so no cylinder cost is included.`);
      }
    } else if (cylinderToken) {
      const cylInfo = CYLINDER_CODES[cylinderToken];
      deviceLines.push({
        label: `${cylinderToken} — ${cylInfo.label}, factory installed`,
        price: CYLINDER_INSTALLED_PRICE,
        page: CYLINDER_PAGE,
      });
    }
  } else if (cylinderToken) {
    const cylInfo = CYLINDER_CODES[cylinderToken];
    deviceLines.push({
      label: `${cylinderToken} — ${cylInfo.label}, factory installed`,
      price: CYLINDER_INSTALLED_PRICE,
      page: CYLINDER_PAGE,
    });
  }

  const allLines = deviceLines.concat(lines);
  const total = allLines.reduce((s, l) => s + (l.price || 0), 0);

  return {
    partNumber: input, seriesKey, seriesLabel: rules.label, lines: allLines, unresolved, total,
    finish, width, trimCode,
  };
}
