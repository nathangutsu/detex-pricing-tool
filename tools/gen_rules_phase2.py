#!/usr/bin/env python3
"""Extend rules.js with the Phase 2 Advantex exit-device series and their trim tables.

Reads the current rules.js (Phase 1 data, JSON blocks), adds/patches series, verifies every
transcribed trim price against the PDF page text and the price-list spreadsheet, and rewrites
rules.js.  Usage:  python3 tools/gen_rules_phase2.py [PDF] [XLSX]
Sources: 8-2026-DETEX-Price-List.pdf (Effective August 1, 2026), pages 12-29, 46-53.
"""
import json, os, re, sys, copy
import pdfplumber, openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PDF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', '8-2026-DETEX-Price-List.pdf')
XLSX = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, '..', 'DETEX 8-2026-Excel-Price-List.xlsx')

# ------------------------------------------------------------------ load current rules.js
src = open(os.path.join(ROOT, 'rules.js')).read()
def grab(name):
    m = re.search(r'const %s = (\{.*?\n\});\n' % name, src, re.S)
    return json.loads(m.group(1))
SERIES_RULES = grab('SERIES_RULES')
CYLINDER_CODES = grab('CYLINDER_CODES')
DEVICE_FINISH_DEFAULT = json.loads(re.search(r'const DEVICE_FINISH_DEFAULT = (\{.*?\});', src).group(1))
CYL_PRICE = int(re.search(r'const CYLINDER_INSTALLED_PRICE = (\d+);', src).group(1))
CYL_PAGE = int(re.search(r'const CYLINDER_PAGE = (\d+);', src).group(1))
ALL_FINISHES = json.loads(re.search(r'const ALL_FINISHES = new Set\((\[.*?\])\);', src).group(1))
HANDING = json.loads(re.search(r'const HANDING_CODES = new Set\((\[.*?\])\);', src).group(1))
DOGGING = json.loads(re.search(r'const DOGGING_CODES = new Set\((\[.*?\])\);', src).group(1))

# ------------------------------------------------------------------ PDF page text for verification
NA = None
with pdfplumber.open(PDF) as pdf:
    PAGE = {n: re.sub(r'\s+', ' ', pdf.pages[n - 1].extract_text() or '') for n in (23, 24, 25, 26, 27, 49, 50, 52, 53)}

def expand(cols, vals):
    out = {}
    for c, v in zip(cols, vals):
        for code in c.split(','):
            out[code.strip()] = v
    return out

PULL5 = ['626', '630', '693,695', '606,612', '605,611,625,629']
LEV4 = ['626', '693,695', '606,612', '605,611,625,629']
ROWS = []   # (label, page, price tokens) for verification

def trim(page, cols, vals, cyl, fn, lever=False, **extra):
    d = {'finishes': expand(cols, vals), 'cyl': cyl, 'fn': fn, 'page': page}
    if lever: d['lever'] = True
    d.update(extra)
    ROWS.append((fn, page, [('N/A' if v is None else '$%s' % format(v, ',')) for v in vals]))
    return d

def T(page, cols, vals, cyl, fn, lever=False, **extra):
    return trim(page, cols, vals, cyl, fn, lever, **extra)

# ---- pull / plate trims (5 finish columns) ----
WIDE_PULLS_1020 = {
  '01W':  T(24, PULL5, [NA,256,292,299,299], None, 'Exit only, cover plate'),
  '03W':  T(24, PULL5, [NA,256,292,320,348], 'rim', 'Key retracts latch'),
  '03WS': T(24, PULL5, [247,NA,336,336,361], 'rim', 'Key retracts latch'),
  '01C':  T(24, PULL5, [NA,317,398,398,398], None, 'Exit only, cover plate'),
  '02C':  T(24, PULL5, [NA,480,568,510,510], None, 'Dummy pull'),
  '03C':  T(24, PULL5, [NA,498,697,585,585], 'rim', 'Key retracts latch'),
  '02Z':  T(24, PULL5, [NA,997,NA,NA,NA], None, 'Dummy vandal pull (specify handing)'),
  '03Z':  T(24, PULL5, [NA,997,NA,NA,NA], 'rim', 'Key retracts latch, vandal pull (specify handing)'),
}
WIDE_PULLS_30 = {
  '01WM': T(24, PULL5, [NA,256,292,299,299], None, 'Exit only, cover plate'),
  '03WM': T(24, PULL5, [NA,256,NA,320,348], 'mortise', 'Key retracts latch'),
  '01CM': T(24, PULL5, [NA,317,NA,398,398], None, 'Exit only, cover plate'),
  '02CM': T(24, PULL5, [NA,480,NA,510,510], None, 'Dummy pull'),
  '03CM': T(24, PULL5, [NA,498,NA,585,585], 'mortise', 'Key retracts latch'),
}
WIDE_PULLS_7080 = {
  '03WSV': T(24, PULL5, [397,NA,486,486,511], 'rim', 'Key retracts latch'),
  '01CV':  T(24, PULL5, [NA,308,397,397,397], None, 'Exit only, cover plate'),
  '02CV':  T(24, PULL5, [NA,413,554,500,500], None, 'Dummy pull'),
  '03CV':  T(24, PULL5, [NA,535,607,607,607], 'rim', 'Key retracts latch'),
  '02WP':  T(24, PULL5, [NA,354,NA,441,441], None, 'Dummy pull (wire)'),
}
NARROW_PULLS_4050 = {
  '03WS': T(25, PULL5, [247,NA,252,336,361], 'rim', 'Key retracts latch'),
  '01CN': T(25, PULL5, [NA,308,397,397,397], None, 'Exit only, cover plate'),
  '02CN': T(25, PULL5, [NA,467,568,511,511], None, 'Dummy pull'),
  '03CN': T(25, PULL5, [NA,500,713,602,602], 'rim', 'Key retracts latch'),
}
NARROW_PULLS_60 = {
  '01CNV': T(25, PULL5, [NA,308,397,397,397], None, 'Exit only, cover plate'),
  '02CNV': T(25, PULL5, [NA,413,554,500,500], None, 'Dummy pull'),
  '03CNV': T(25, PULL5, [NA,583,611,611,611], 'rim', 'Key retracts latch'),
  '02WP':  T(25, PULL5, [NA,354,NA,441,441], None, 'Dummy pull (wire)'),
  '03R':   T(25, PULL5, [NA,528,NA,NA,NA], 'rim', 'Key retracts latch (Night Latch)'),
}
# ---- lever trims (4 finish columns) ----
WIDE_LEVERS_1020 = {
  '01D': T(26, LEV4, [698,753,786,843], None, 'Blank escutcheon', True),
  '02D': T(26, LEV4, [698,753,786,843], None, 'Dummy lever', True),
  '08D': T(26, LEV4, [866,959,959,1011], 'mortise', 'Key locks/unlocks lever', True),
  '09D': T(26, LEV4, [866,959,959,1011], 'mortise', 'Key unlocks lever, locked when key removed', True),
  '14D': T(26, LEV4, [866,959,959,1011], None, 'Lever always active', True),
}
WIDE_LEVERS_10_ONLY = {
  '10D': T(26, LEV4, [1167,1203,1309,1309], 'mortise', 'Double cylinder', True, onlySeries=['10']),
}
WIDE_LEVERS_30 = {
  '01DM': T(26, LEV4, [698,753,786,843], None, 'Blank escutcheon', True),
  '02DM': T(26, LEV4, [698,753,786,843], None, 'Dummy lever', True),
  '08DM': T(26, LEV4, [866,959,959,1011], 'mortise', 'Key locks/unlocks lever', True),
  '09DM': T(26, LEV4, [866,959,959,1011], 'mortise', 'Key unlocks lever, locked when key removed', True),
  '10DM': T(26, LEV4, [1167,1203,1309,1309], 'mortise', 'Double cylinder', True),
  '14DM': T(26, LEV4, [866,959,959,1011], None, 'Lever always active', True),
}
WIDE_LEVERS_7080 = {
  '01DV': T(26, LEV4, [755,806,806,855], None, 'Blank escutcheon', True),
  '02DV': T(26, LEV4, [755,806,806,855], None, 'Dummy lever', True),
  '08DV': T(26, LEV4, [851,963,971,999], 'mortise', 'Key locks/unlocks lever', True),
  '09DV': T(26, LEV4, [851,963,971,999], 'mortise', 'Key unlocks lever, locked when key removed', True),
  '14DV': T(26, LEV4, [851,963,971,999], None, 'Lever always active', True),
}
NARROW_LEVERS_4050 = {
  '01DN': T(27, LEV4, [644,718,753,811], None, 'Blank escutcheon', True),
  '02DN': T(27, LEV4, [644,718,753,811], None, 'Dummy lever', True),
  '08DN': T(27, LEV4, [766,937,965,995], 'mortise', 'Key locks/unlocks lever', True),
  '09DN': T(27, LEV4, [766,937,965,995], 'mortise', 'Key unlocks lever, locked when key removed', True),
  '14DN': T(27, LEV4, [766,937,965,995], None, 'Lever always active', True),
}
NARROW_LEVERS_60 = {
  '01DNV': T(27, LEV4, [785,791,791,951], None, 'Blank escutcheon', True),
  '02DNV': T(27, LEV4, [785,791,791,951], None, 'Dummy lever', True),
  '08DNV': T(27, LEV4, [916,951,1048,1068], 'mortise', 'Key locks/unlocks lever', True),
  '09DNV': T(27, LEV4, [916,951,1048,1068], 'mortise', 'Key unlocks lever, locked when key removed', True),
  '14DNV': T(27, LEV4, [916,951,1048,1068], None, 'Lever always active', True),
}
# ---- electric unlock lever trims (p.23), Value EU2W (p.49) ----
EU_1020 = {'EU':    T(23, LEV4, [1775,1789,1813,1843], 'mortise', 'Electric lock/unlock lever (specify FSE fail secure std. or FSA fail safe, and handing)', True)}
EU_30 = {'EUxDM':   T(23, LEV4, [1775,1789,1813,1843], 'mortise', 'Electric lock/unlock lever (specify FSE fail secure std. or FSA fail safe, and handing)', True)}
EU_7080 = {'EUV':   T(23, LEV4, [1736,1771,1965,1965], 'mortise', 'Electric lock/unlock lever (specify FSE fail secure std. or FSA fail safe, and handing)', True)}
EU_4050 = {'EU2W':  T(23, LEV4, [1581,1596,1664,1697], 'mortise', 'Electric lock/unlock lever (specify FSE fail secure std. or FSA fail safe, and handing)', True)}
# ---- Value Series trims (p.49-53) ----
V_LEV_VR = {
  '02D2W': T(53, ['626', '693'], [633,689], None, 'Dummy lever, vandal resistant', True),
  '08D2W': T(53, ['626', '693'], [755,811], 'mortise', 'Key locks/unlocks lever, vandal resistant', True),
  '09D2W': T(53, ['626', '693'], [755,811], 'mortise', 'Key unlocks lever, locked when key removed, vandal resistant', True),
  '14D2W': T(53, ['626', '693'], [755,811], None, 'Lever always active, vandal resistant', True),
}
V_EU = {'EU2W': T(49, ['626', '693'], [1581,1596], 'mortise', 'Electric lock/unlock lever (specify FSE fail secure std. or FSA fail safe, and handing)', True)}

# ------------------------------------------------------------------ verify trim rows vs the PDF text
bad = []
for fn, page, toks in ROWS:
    seq = ' '.join(toks)
    if seq not in PAGE[page]:
        bad.append((fn, page, seq))
print('trim rows transcribed:', len(ROWS), '| not found verbatim on their PDF page:', len(bad))
for b in bad:
    print('   NOT FOUND', b)

# ------------------------------------------------------------------ cross-check vs spreadsheet TRIMS rows
wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb['Price List']
flat = {}
STD_FINISH = {}   # trim code -> the finish the price list tags "(std.)"
for r in range(2, ws.max_row + 1):
    if ws.cell(row=r, column=1).value == 'TRIMS':
        raw = str(ws.cell(row=r, column=2).value).strip()
        p = re.sub(r'\s*\(std\.\)\s*$', '', raw).upper()
        flat[p] = (r, ws.cell(row=r, column=5).value)
        m = re.match(r'^(.*)x(\d{3})\s*\(std\.\)$', raw, re.I)
        if m:
            STD_FINISH[m.group(1).upper()] = m.group(2)
groups = {
  'WIDE_PULLS_1020': WIDE_PULLS_1020, 'WIDE_PULLS_30': WIDE_PULLS_30, 'WIDE_PULLS_7080': WIDE_PULLS_7080,
  'NARROW_PULLS_4050': NARROW_PULLS_4050, 'NARROW_PULLS_60': NARROW_PULLS_60,
  'WIDE_LEVERS_1020': WIDE_LEVERS_1020, 'WIDE_LEVERS_10': WIDE_LEVERS_10_ONLY, 'WIDE_LEVERS_30': WIDE_LEVERS_30,
  'WIDE_LEVERS_7080': WIDE_LEVERS_7080, 'NARROW_LEVERS_4050': NARROW_LEVERS_4050, 'NARROW_LEVERS_60': NARROW_LEVERS_60,
  'EU_1020': EU_1020, 'EU_30': EU_30, 'EU_7080': EU_7080, 'EU_4050': EU_4050, 'V_LEV_VR': V_LEV_VR, 'V_EU': V_EU,
}
ok = mism = missing = 0
mism_list, miss_list = [], []
for gname, grp in groups.items():
    for code, t in grp.items():
        for fin, price in t['finishes'].items():
            if price is None:
                continue
            got = flat.get(('%sx%s' % (code, fin)).upper())
            if got is None:
                missing += 1; miss_list.append((gname, code, fin, price))
            elif got[1] == price:
                ok += 1
            else:
                mism += 1; mism_list.append((gname, code, fin, price, got[1], got[0]))
print('vs spreadsheet TRIMS rows: match %d, mismatch %d, no spreadsheet row %d' % (ok, mism, missing))
for m in mism_list: print('   MISMATCH %s %s %s: PDF $%s vs spreadsheet $%s (row %s)' % m)
for m in miss_list[:40]: print('   NO SHEET ROW %s %s %s $%s' % m)

# ------------------------------------------------------------------ series definitions
def opt(price, label, page, note=None):
    d = {'price': price, 'label': label, 'page': page}
    if note: d['note'] = note
    return d

def common(page, *, W=False, HFH=False, T=False, heights=None, strikes=(), F_label='Fire-Rated'):
    o = {}
    if T: o['T'] = opt(90, 'Tornado Rated (max 42" wide and 88" tall)', page)
    o['F'] = opt(225, F_label, page)
    if HFH:
        o['H'] = opt(125, 'Hurricane Rated', page)
        o['FH'] = opt(350, 'Fire-Rated/Hurricane Rated', page)
    if W: o['W'] = opt(225, 'Weatherized (mechanical only)', page)
    o['SN1'] = opt(29, 'Sex Nuts/Throughbolts (per set)', page)
    o['AM'] = opt(96, 'Antimicrobial (pushpad only)', page)
    o['KS'] = opt(11, 'Keystop installed', page)
    o['SLR'] = opt(96, 'Silent pushpad return', page)
    o['CD'] = opt(0, 'Cylinder Dogging (standard)', page)
    o['LD'] = opt(0, 'Less Dogging', page)
    o['EC1'] = opt(0, 'Ramped Endcap - Heavy Duty (standard)', page)
    o['EC2'] = opt(0, 'Flush endcap', page)
    for code, label in strikes:
        o[code] = opt(0, label, page)
    return o

def lever_opts(page, kn=True):
    d = {'LS': {'price': 325, 'label': 'Lever Switch', 'page': page}}
    if kn: d['KN'] = {'price': 107, 'label': 'Knurling', 'page': page}
    return d

def series(label, kind, page, options, pulls, levers, *, heights=None, widths=(36, 48), lever_page, kn=True,
           noW=False, noH=False):
    s = {'label': label, 'kind': kind, 'widths': list(widths), 'pulls': copy.deepcopy(pulls),
         'levers': copy.deepcopy(levers), 'devicePage': page, 'options': options,
         'leverOptions': lever_opts(lever_page, kn)}
    if heights: s['heights'] = heights
    if noW: s['noWeatherized'] = True
    if noH: s['noHurricane'] = True
    return s

H96_120 = {'96': 118, '120': 118}
H120 = {'120': 118}
WL_1020 = {**WIDE_LEVERS_1020, **EU_1020}
NL_4050 = {**NARROW_LEVERS_4050, **EU_4050}
NL_60 = NARROW_LEVERS_60
WL_7080 = {**WIDE_LEVERS_7080, **EU_7080}
WL_30 = {**WIDE_LEVERS_30, **EU_30}

# Phase 1 patches ------------------------------------------------
def patch_phase1():
    s = SERIES_RULES
    # 10 Series: 10D is 10-only; add electric unlock; endcaps
    s['10']['levers'] = copy.deepcopy({**WIDE_LEVERS_1020, **WIDE_LEVERS_10_ONLY, **EU_1020})
    s['10']['pulls'] = copy.deepcopy(WIDE_PULLS_1020)
    s['20']['levers'] = copy.deepcopy(WL_1020)          # 20 Series: no 10D (the old table wrongly included it)
    s['20']['pulls'] = copy.deepcopy(WIDE_PULLS_1020)
    s['40']['pulls'] = copy.deepcopy(NARROW_PULLS_4050)  # adds 02CN (dummy pull), missing from Phase 1
    s['40']['levers'] = copy.deepcopy(NL_4050)
    s['60']['pulls'] = copy.deepcopy(NARROW_PULLS_60)
    s['60']['levers'] = copy.deepcopy(NL_60)
    for k, page in (('10', 27 - 15), ('20', 13), ('40', 12), ('60', 17)):
        pass
    for k in ('10', '20', '40', '60'):
        pg = s[k]['devicePage']
        s[k]['options']['EC1'] = opt(0, 'Ramped Endcap - Heavy Duty (standard)', pg)
        s[k]['options']['EC2'] = opt(0, 'Flush endcap', pg)
        s[k]['leverOptions'] = lever_opts(26 if k in ('10', '20') else 27)
    for k in ('V40', 'V50', 'V51'):
        s[k]['levers'] = copy.deepcopy({**s[k]['levers'], **V_LEV_VR, **V_EU})
        s[k]['leverOptions'] = lever_opts(52, kn=False)
patch_phase1()

NEW = {}
NEW['21'] = series('Advantex 21 Series (SVR Top Rod Only, Wide Stile)', 'svr', 14,
    common(14, W=True, HFH=True, strikes=[('97', 'Surface Strike (standard)')]),
    WIDE_PULLS_1020, WL_1020, heights=H96_120, lever_page=26)
NEW['27'] = series('Advantex 27 Series (High Security SVR, Wide Stile)', 'svr', 15,
    common(15, W=True, T=True),
    WIDE_PULLS_1020, WL_1020, heights=H96_120, lever_page=26, noH=True)
NEW['30'] = series('Advantex 30 Series (Mortise Lock)', 'mortise', 16,
    common(16, strikes=[('90', 'Non-Handed Curved Lip Strike (standard)'), ('91', 'ANSI Flat Lip Strike'),
                        ('92', 'Double Door Short Open Back Strike'), ('93', 'Double Door Long Open Back Strike')]),
    WIDE_PULLS_30, WL_30, lever_page=26, noW=True, noH=True)
NEW['50'] = series('Advantex 50 Series (SVR, Narrow Stile)', 'svr', 13,
    common(13, W=True, HFH=True), NARROW_PULLS_4050, NL_4050, heights=H96_120, lever_page=27)
NEW['51'] = series('Advantex 51 Series (SVR Top Rod Only, Narrow Stile)', 'svr', 14,
    common(14, W=True, HFH=True), NARROW_PULLS_4050, NL_4050, heights=H96_120, lever_page=27)
NEW['61'] = series('Advantex 61 Series (CVR Top Rod Only, Narrow Stile, Aluminum Door)', 'cvr', 18,
    common(18, F_label='Fire-Rated (3 hour, steel door required for 61 Series)', strikes=[('95T', 'Top Strike (standard)')]),
    NARROW_PULLS_60, NL_60, heights=H120, lever_page=27, noW=True, noH=True)
NEW['62'] = series('Advantex 62 Series (CVR, Narrow Stile, Hollow Metal Door)', 'cvr', 17,
    common(17, F_label='Fire-Rated (3 hour)', strikes=[('95T', 'Top Strike (standard)'), ('95B', 'Bottom Strike (standard)')]),
    NARROW_PULLS_60, NL_60, heights=H120, lever_page=27, noW=True, noH=True)
NEW['63'] = series('Advantex 63 Series (CVR Top Rod Only, Narrow Stile, Hollow Metal Door)', 'cvr', 18,
    common(18, F_label='Fire-Rated (3 hour)', strikes=[('95T', 'Top Strike (standard)')]),
    NARROW_PULLS_60, NL_60, heights=H120, lever_page=27, noW=True, noH=True)
for k, label, pg, doors, sk in (
    ('70', 'Advantex 70 Series (Wide CVR, Wood Door)', 19, '70 Series 90 minutes', 2),
    ('80', 'Advantex 80 Series (Wide CVR, Hollow Metal Door)', 19, '80 Series 3 hour', 2),
    ('82', 'Advantex 82 Series (Wide CVR, Aluminum Door)', 19, '70 Series 90 minutes; 80 Series 3 hour', 2),
    ('71', 'Advantex 71 Series (Wide CVR Top Rod Only, Wood Door)', 20, '71 Series 90 minutes', 1),
    ('81', 'Advantex 81 Series (Wide CVR Top Rod Only, Hollow Metal Door)', 20, '81 Series 3 hour', 1),
    ('83', 'Advantex 83 Series (Wide CVR Top Rod Only, Aluminum Door)', 20, '71 Series 90 minutes; 81 Series 3 hour', 1)):
    strikes = [('95T', 'Top Strike (standard)')] + ([('95B', 'Bottom Strike (standard)')] if sk == 2 else [])
    NEW[k] = series(label, 'cvr', pg, common(pg, F_label='Fire-Rated (%s)' % doors, strikes=strikes),
                    WIDE_PULLS_7080, WL_7080, heights=H120, lever_page=26, noW=True, noH=True)
NEW['87'] = series('Advantex 87 Series (High Security CVR)', 'cvr', 21,
    common(21, T=True, strikes=[('95T', 'Top Strike (standard)'), ('95B', 'Bottom Strike (standard)')]),
    WIDE_PULLS_7080, WL_7080, heights=H120, lever_page=26, noW=True, noH=True)

for k, v in NEW.items():
    SERIES_RULES[k] = v
    DEVICE_FINISH_DEFAULT[k] = '630'

# Standard trim finish (used when the string names no finish): the price list's "(std.)" row, if the PDF
# table prices that finish; otherwise the first priced finish in the PDF's own column order.
COLUMN_ORDER = ['626', '630', '689', '628', '693', '695', '606', '612', '605', '611', '625', '629', '711']
n_std = 0
for sk, sr in SERIES_RULES.items():
    for grp in ('pulls', 'levers'):
        for code, t in sr[grp].items():
            std = STD_FINISH.get(code.upper())
            if std and t['finishes'].get(std) is not None:
                t['std'] = std
            else:
                t['std'] = next(f for f in COLUMN_ORDER if t['finishes'].get(f) is not None)
            n_std += 1
print('std finish stamped on', n_std, 'trim entries')

# ------------------------------------------------------------------ write rules.js
def js_json(name, obj):
    return 'const %s = %s;\n\n' % (name, json.dumps(obj, indent=1))

out  = '// SKU Builder rules — transcribed from 8-2026-DETEX-Price-List.pdf, Effective August 1, 2026.\n'
out += '// Phase 1: 10, 20, 40, 60 (Advantex) and V40, V50, V51 (Value). Phase 2 adds Advantex 21, 27, 30, 50, 51,\n'
out += '// 61, 62, 63, 70, 71, 80, 81, 82, 83, 87. GENERATED by tools/gen_rules_phase2.py (Phase 2 layer on top of\n'
out += '// the Phase 1 data) — regenerate rather than hand-editing.\n'
out += js_json('SERIES_RULES', SERIES_RULES) + js_json('CYLINDER_CODES', CYLINDER_CODES)
out += 'const CYLINDER_INSTALLED_PRICE = %d;\nconst CYLINDER_PAGE = %d;\n' % (CYL_PRICE, CYL_PAGE)
out += 'const DEVICE_FINISH_DEFAULT = %s;\n' % json.dumps(DEVICE_FINISH_DEFAULT)
out += 'const ALL_FINISHES = new Set(%s);\n' % json.dumps(ALL_FINISHES)
out += 'const HANDING_CODES = new Set(%s);\n' % json.dumps(HANDING)
out += 'const DOGGING_CODES = new Set(%s);\n' % json.dumps(DOGGING)
open(os.path.join(ROOT, 'rules.js'), 'w').write(out)
print('rules.js written:', len(SERIES_RULES), 'series ->', sorted(SERIES_RULES, key=lambda k: (len(k), k)))
