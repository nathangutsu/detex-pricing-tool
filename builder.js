// SKU Builder — decomposes an assembled DETEX device+trim+options string and prices each
// component against SERIES_RULES (rules.js) and the flat catalog (DETEX_DATA, data.js).
// Phase 1 scope: 10, 20, 40, 60 (Advantex) and V40, V50, V51 (Value Series).

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

// Electrified options exist as flat rows in DETEX_DATA (cat 'ADVANTEX' or 'VALUE SERIES')
// with per-code eligibility spelled out in their own descriptions. Prices are looked up live
// from DETEX_DATA (not hardcoded) so a data.js regeneration stays authoritative automatically;
// only the eligibility subsets and cross-requirement notes below were read off those descriptions.
const ELECTRIFIED_COMPOUND_CODES = ['EE ER EX', 'ER EX W', 'EB W', 'EEX W', 'EX W', 'EXV W', 'ER EX'];

const ELECTRIFIED_ELIGIBILITY = {
  ADVANTEX: {
    'EA':      { series: ['10','20','40','60'] },
    'EB W':    { series: ['10','20','40'], note: 'Not available on 60 Series.' },
    'ER EX':   { series: ['10','20','40','60'], note: 'Requires a logic controller & power supply, not included.' },
    'ER EX W': { series: ['10','20','40'], note: 'Not available on 60 Series. Requires the mechanical W option on the device as well, plus a logic controller/power supply (not included).' },
    'EI':      { series: ['10','40'], note: 'Requires a logic controller, not included.' },
    'ED':      { series: ['10','20','40','60'] },
    'EE':      { series: ['10','20','40','60'], note: 'Includes its own power supply.' },
    'EEX':     { series: ['10','20','40'], note: 'Not available on 60 Series. Non-weatherized devices only.' },
    'EEX W':   { series: ['10','20','40'], note: 'Not available on 60 Series. Requires the mechanical W option on the device as well.' },
    'EE ER EX': { series: ['10','20','40','60'], note: 'Delayed Egress with Latch Retraction. Requires an 84-800/85-800 series power supply controller (sold separately, but required — includes remote wall-mount keyswitch & horn).' },
    'ES':      { series: ['10','40'] },
    'EX':      { series: ['10','20','40','60'] },
    'EX W':    { series: ['10','20','40'], note: 'Not available on 60 Series.' },
    'EXV':     { series: ['10','20','40','60'] },
    'EXV W':   { series: ['10','20','40'], note: 'Not available on 60 Series.' },
    'LX':      { series: ['10','40','60'], note: 'Latch Bolt Signaling. Also available on 70/80 Series (not yet supported by this builder).' },
    'LXV':     { series: ['10','40'], note: 'Latch Bolt Signaling for High Current.' },
  },
  'VALUE SERIES': {
    'EA':      { series: ['V40','V50','V51'] },
    'EB':      { series: ['V40','V50','V51'] },
    'EB W':    { series: ['V40','V50','V51'], note: 'Requires the mechanical W option on the device as well.' },
    'ED':      { series: ['V40','V50','V51'] },
    'ER EX':   { series: ['V40','V50','V51'], note: 'Requires a logic controller & power supply, not included.' },
    'ER EX W': { series: ['V40','V50','V51'], note: 'Requires the mechanical W option on the device as well, plus a logic controller/power supply (not included).' },
    'ES':      { series: ['V40'] },
    'EE':      { series: ['V40','V50','V51'], note: 'Includes its own power supply.' },
    'EEX':     { series: ['V40','V50','V51'], note: 'Non-weatherized devices, 36" and longer, only.' },
    'EEX W':   { series: ['V40','V50','V51'], note: 'Requires the mechanical W option on the device as well.' },
    'EI':      { series: ['V40','V50','V51'], note: 'Requires a logic controller, not included.' },
    'EX':      { series: ['V40','V50','V51'] },
    'EX W':    { series: ['V40','V50','V51'], note: 'Requires the mechanical W option on the device as well.' },
    'EXV':     { series: ['V40','V50','V51'] },
    'EXV W':   { series: ['V40','V50','V51'], note: 'Requires the mechanical W option on the device as well.' },
  },
};

function mergeCompoundTokens(tokens) {
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    let matched = null;
    for (let span = 3; span >= 2; span--) {
      if (i + span > tokens.length) continue;
      const joined = tokens.slice(i, i + span).join(' ').toUpperCase();
      if (ELECTRIFIED_COMPOUND_CODES.includes(joined)) { matched = { span, joined }; break; }
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

function findDevicePrice(seriesKey, finish, width) {
  let pattern = `${seriesKey}x${finish}`;
  if (width && width !== '36') pattern += `x${width}`;
  const patUpper = pattern.toUpperCase();
  return DETEX_DATA.find(r => {
    if (r.cat !== 'ADVANTEX' && r.cat !== 'VALUE SERIES') return false;
    const clean = r.part.replace(/\s*\(std\.\)\s*$/i, '').toUpperCase();
    return clean === patUpper;
  }) || null;
}

function pickTrimPrice(trimEntry, requestedFinish) {
  if (requestedFinish && trimEntry.finishes[requestedFinish] != null) {
    return { price: trimEntry.finishes[requestedFinish], finish: requestedFinish, mixed: false };
  }
  // Fall back to the first available (non-null) finish in the table's own column order.
  const fallbackFinish = Object.keys(trimEntry.finishes).find(f => trimEntry.finishes[f] != null);
  if (fallbackFinish) {
    return { price: trimEntry.finishes[fallbackFinish], finish: fallbackFinish, mixed: true };
  }
  return null;
}

function buildAssembledSku(raw) {
  const input = (raw || '').trim();
  if (!input) return { error: 'Enter a SKU string, e.g. V40x08BNx36xLDxWxIC7' };

  // Series prefix never contains "x" (10/20/40/60/V40/V50/V51), so the blanket split is safe
  // for extracting just the first token.
  const seriesToken = input.split(/[-x]+/i)[0];
  const seriesKey = Object.keys(SERIES_RULES).find(k => k.toUpperCase() === seriesToken.toUpperCase());
  if (!seriesKey) {
    return {
      error: `Series "${seriesToken}" isn't recognized, or isn't supported yet by the Device Builder. Phase 1 covers 10, 20, 40, 60 (Advantex) and V40, V50, V51 (Value Series). Try the Lookup tab if this is meant to be a single flat part number instead.`
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

  let deviceFinishToken = null, trimFinishToken = null, widthToken = null, cylinderToken = null;
  const lines = [];
  const unresolved = [];

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
      const o = rules.options[upper];
      lines.push({ label: `${upper} — ${o.label}`, price: o.price, page: o.page });
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
      lines.push({ label: `${upper} — ${rec.desc}`, price: rec.price, page: null, note: elig.note });
      return;
    }
    if (GLOBAL_OPTION_INFO[upper]) {
      const g = GLOBAL_OPTION_INFO[upper];
      unresolved.push(`"${tok}" (${g.label}) isn't available on ${rules.label}${g.page ? ' — see p.' + g.page + ' options list' : ''}. Not priced.`);
      return;
    }
    unresolved.push(`"${tok}" didn't match a known finish, width, option, or trim code for ${rules.label}. Not priced — verify manually.`);
  });

  const finish = deviceFinishToken || DEVICE_FINISH_DEFAULT[seriesKey];
  const width = widthToken || '36';
  const finishAssumed = !deviceFinishToken;
  const widthAssumed = !widthToken;

  if (!rules.widths.includes(parseInt(width, 10))) {
    unresolved.push(`${width}" width isn't listed for ${rules.label} (available widths: ${rules.widths.join('", ')}").`);
  }

  const deviceRec = findDevicePrice(seriesKey, finish, width);
  const deviceLines = [];
  if (!deviceRec) {
    unresolved.push(`No catalog row found for ${seriesKey} device at finish ${finish}, ${width}" width. Check the finish/width combination against p.${rules.devicePage} — do not assume a price.`);
  } else {
    deviceLines.push({
      label: `${rules.label} device, ${finish}${finishAssumed ? ' (default, not specified)' : ''}, ${width}"${widthAssumed ? ' (standard, not specified)' : ''}`,
      price: deviceRec.price,
      page: rules.devicePage,
    });
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
    seriesKey, seriesLabel: rules.label, lines: allLines, unresolved, total,
    finish, width, trimCode,
  };
}
