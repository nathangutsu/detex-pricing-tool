#!/usr/bin/env python3
"""Generate ecl.js (exit control lock models, options, trims, accessories) from the PDF.

Every price is verified against its PDF page text; every part that also exists in the price-list
spreadsheet is compared against it.  Usage: python3 tools/gen_ecl.py [PDF] [XLSX]
Sources: 8-2026-DETEX-Price-List.pdf (Effective August 1, 2026), pages 85-94.
"""
import json, os, re, sys
import pdfplumber, openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', '8-2026-DETEX-Price-List.pdf')
XLSX = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, '..', 'DETEX 8-2026-Excel-Price-List.xlsx')

with pdfplumber.open(PDF) as pdf:
    PAGE = {n: re.sub(r'\s+', ' ', pdf.pages[n - 1].extract_text() or '') for n in range(85, 95)}

problems = []
def money(n): return '$' + format(n, ',')

def verify(page, code, price, window=220, pattern=None):
    """price must appear within `window` non-$ characters after the code on that page."""
    if price == 0:
        return
    pat = pattern or (r'(?<![A-Za-z0-9-])' + re.escape(code) + r'(?![A-Za-z0-9])[^$]{0,%d}\$%s' % (window, format(price, ',')))
    if not re.search(pat, PAGE[page]):
        problems.append('NOT FOUND on p.%d: %s %s' % (page, code, money(price)))

# ------------------------------------------------------------------ models (base prices from the spreadsheet at runtime)
MODELS = {
  'ECL-230D':       dict(family='D',    page=85, pdfPrice=594,  label='Exit Control Lock, UL-Listed Panic Hardware'),
  'ECL-230D-PH':    dict(family='D',    page=85, pdfPrice=680,  label='Exit Control Lock w/ Long Bar, UL-Listed Panic Hardware'),
  'ECL-600':        dict(family='F600', page=85, pdfPrice=1123, label='Fire Exit Hardware w/ Long Bar (Warnock Hersey, 3-hour)'),
  'ECL-230X':       dict(family='SP',   page=89, pdfPrice=1242, label='Single-Point Deadbolt Exit Control Lock'),
  'ECL-230X-W':     dict(family='SP',   page=89, pdfPrice=1585, label='Single-Point Deadbolt Exit Control Lock, Weatherized'),
  'ECL-230X-TD':    dict(family='TD',   page=90, pdfPrice=1940, label='2-Point Top Bolt and Deadbolt Exit Control Lock'),
  'ECL-230X-TB':    dict(family='TB',   page=90, pdfPrice=2095, label='2-Point Top and Bottom Bolt Exit Control Lock (cover lock standard)'),
  'ECL-230X-W-TD':  dict(family='TD',   page=90, pdfPrice=2283, label='2-Point Top Bolt and Deadbolt Exit Control Lock, Weatherized'),
  'ECL-230X-W-TB':  dict(family='TB',   page=90, pdfPrice=2438, label='2-Point Top and Bottom Bolt Exit Control Lock, Weatherized (cover lock standard)'),
  'ECL-230X-TDB':   dict(family='TDB',  page=91, pdfPrice=2330, label='3-Point Top Bolt, Deadbolt and Bottom Bolt Exit Control Lock'),
  'ECL-230X-W-TDB': dict(family='TDB',  page=91, pdfPrice=2673, label='3-Point Top Bolt, Deadbolt and Bottom Bolt Exit Control Lock, Weatherized'),
}
for m, d in MODELS.items():
    verify(d['page'], m, d['pdfPrice'], window=160)

# ------------------------------------------------------------------ 230X families: options (pp.89-92)
def O(page, price, label, **kw):
    d = {'price': price, 'label': label, 'page': page}
    d.update(kw)
    return d

def x_options(page, fam):
    o = {}
    if fam in ('SP', 'TDB'):
        o['H'] = O(page, 325, 'Hurricane Rated (includes the SN1 sex nut kits)')
    for k, gray, black in (('DX1', 79, 201), ('DX2', 142, 320), ('DX3', 197, 440)):
        n = k[-1]
        o[k] = O(page, gray, 'Adds %s hinge-side locking point%s with mounting hardware' % ({'1': 'one', '2': 'two', '3': 'three'}[n], '' if n == '1' else 's'),
                 black=black)
    o['30'] = O(page, 118, 'Fits 30" wide door')
    if fam in ('TD', 'TB', 'TDB'):
        o['84'] = O(page, 0, 'Fits 6\'8" to 7\' door')
        o['96'] = O(page, 118, 'Fits 7\' to 8\' door')
        o['120'] = O(page, 118, 'Fits 8\' to 10\' door')
        o['RC'] = O(page, 288, 'Rod Covers')
        o['BG'] = O(page, 173, 'Bottom Bolt Guard')
        o['RC-BG'] = O(page, 461, 'Rod Covers & Bottom Bolt Guard')
    o['IP'] = O(page, 66, 'Inside Pull')
    o['DDSK'] = O(page, 125, 'Double Door Strike Kit')
    if fam in ('TB', 'TDB', 'TD'):
        o['96B'] = O(page, 70, 'Dustproof Strike', **({'onlyModels': ['ECL-230X-TB', 'ECL-230X-W-TB']} if fam in ('TB', 'TD') else {}))
        o['96B-DDSK'] = O(page, 195, 'Dustproof Strike & Double Door Strike')
    o['CL'] = O(page, 20, 'Cover Lock & 2 Keys (installed)', **({'standardNoCharge': True} if fam == 'TB' else {}))
    o['SS'] = O(page, 35, 'Security Screws')
    o['CL-SS'] = O(page, 55, 'Cover Lock & Security Screws')
    o['RK'] = O(page, 59, 'ECL-230D Retrofit Kit (endcap plate and lock-body plate)')
    return o

FAMILIES = {'SP': x_options(89, 'SP'), 'TD': x_options(90, 'TD'), 'TB': x_options(90, 'TB'), 'TDB': x_options(91, 'TDB')}
SN1_KITS = {'SP': 4, 'TD': 5, 'TB': 6, 'TDB': 6}
for fam, kits in SN1_KITS.items():
    page = {'SP': 89, 'TD': 90, 'TB': 90, 'TDB': 91}[fam]
    FAMILIES[fam]['SN1'] = O(page, 29, 'Sex Nut Kit (%d kits required)' % kits, kits=kits, perKit=True)
    verify(page, 'SN1', 29, window=200)

for fam, opts in FAMILIES.items():
    for code, o in opts.items():
        if code in ('SN1',):
            continue
        p = o['page']
        if code in ('30',):
            verify(p, code, o['price'], pattern=r'30[”"] Fits 30[”"] wide Door Add \$118')
        elif code in ('84', '96', '120'):
            if o['price']:
                verify(p, code, o['price'], pattern=r'%s[”"] Fits [^$]{0,20} Door Add \$118' % code)
        elif code == 'CL':
            verify(p, code, 20, pattern=r'CL Cover Lock & 2 Keys \(Installed\)[^$]{0,60}\$20')
        else:
            verify(p, code, o['price'], window=230)
        if 'black' in o:
            # p.92 table row reads "DX1 $79 $201" (gray then black)
            verify(92, code, o['black'], pattern=re.escape('%s %s %s' % (code, money(o['price']), money(o['black']))))

X_TRIMS = {
  '03T':  O(92, 269, 'Trim Plate with Outside Key Control (OKC)'),
  '01T':  O(92, 269, 'Trim Plate without OKC'),
  '03PP': O(92, 269, 'Pull Plate with OKC'),
  '01PP': O(92, 269, 'Pull Plate without OKC'),
}
for c, t in X_TRIMS.items():
    verify(92, c, 269, window=80)

# ------------------------------------------------------------------ 230D / 230D-PH / 600 accessories (pp.85-88)
D, DPH, F6 = 'ECL-230D', 'ECL-230D-PH', 'ECL-600'
ACC = {}
def A(code, page, price, label, models, **kw):
    ACC[code] = O(page, price, label, models=models, **kw)
A('PP-5572',    86, 19,  'Replacement Cover Lock & 2 Keys', [D, DPH, F6])
A('ECL-405-KIT', 86, 29, 'Set of all Cover Lock Keys (key numbers 11 through 20)', [D, DPH, F6])
for n in range(11, 21):
    A('ECL-405-%d' % n, 86, 8, 'Cover Lock Key, key number %d' % n, [D, DPH, F6], verifyAs='ECL-405-X')
A('ECL-2105K',  86, 127, 'Field Conversion Kit, 36"-48" door width, metal photoluminescent plate', [D, DPH, F6])
A('ECL-436K',   86, 41,  'Bar Guard Kit (for standard ECL-230D)', [D])
A('ECL-2100K',  86, 104, 'Bar Guard Kit (for ECL-230D-PH & ECL-600)', [DPH, F6])
A('ECL-475K',   86, 105, 'Decorative Back Plate Kit', [D, DPH, F6])
A('ECL-498K',   86, 245, 'Outside Pull and Warning Sign', [D, DPH], note='Not for use on fire rated doors.')
A('ECL-2111K',  86, 152, '6V-to-9V Conversion Kit (ECL-230D and ECL-230C only)', [D])
A('DDH-2250',   86, 230, 'Double Door Holder (ECL-230 Series and V40 Series)', [D, DPH, 'ECL-230X', 'ECL-230X-W', 'ECL-230X-TD', 'ECL-230X-TB', 'ECL-230X-W-TD', 'ECL-230X-W-TB', 'ECL-230X-TDB', 'ECL-230X-W-TDB'])
for c, lab in (('ECL-8220', 'English (Red)'), ('ECL-8220-1', 'English (Green)'), ('ECL-8220-6', 'Chinese (Red)'),
               ('ECL-8220-7', 'French Canadian (Red)'), ('ECL-8220-8', 'Spanish (Red)'), ('ECL-8220-9', 'Chinese (Green)')):
    A(c, 87, 32, 'Metal Exit Bar Plate, %s (for ECL-230D)' % lab, [D])
for c, price, lab in (('ECL-2109', 43, 'English (Red)'), ('ECL-2109-1', 95, 'English (Green)'), ('106687-1', 95, 'French Canadian (Red)'),
                      ('106687-2', 95, 'Chinese (Red)'), ('106687-3', 95, 'Chinese (Green)')):
    A(c, 87, price, 'Metal Exit Bar Plate, %s (for ECL-230D-PH and ECL-600)' % lab, [DPH, F6])
A('ECL-439K',   87, 85, 'Mortise Strike Plate Kit', [D, DPH])
A('ECL-435K',   87, 35, 'Adjustable Surface Keeper, "L" & "Z" bracket for double door applications', [D, DPH])
A('ECL-437K',   87, 85, 'Adjustable Surface Keeper (standard)', [D, DPH])
A('ECL-620',    85, 504, 'Outside Lever Trim for ECL-600 (lever retracts latch bolt only, rim cylinder operates deadbolt; black only, field reversible)', [F6])

for c, a in ACC.items():
    va = a.pop('verifyAs', c)
    verify(a['page'], va, a['price'], window=200)

# Vertical rod assemblies, ECL-230D only (p.88): [type] -> price by door height tier
VRA = {
  'B': {'84': 791, '96': 959, '120': 1043},
  'C': {'84': 834, '96': 1027},
  'D': {'84': 2033, '96': 1892},
}
for t, tiers in VRA.items():
    for tier, price in tiers.items():
        if not re.search(r'\$%s' % format(price, ','), PAGE[88]):
            problems.append('VRA %s %s $%s not on p.88' % (t, tier, price))

CYL = {'price': 126, 'page': 94, 'codes': {'RC65': 'Rim Cylinder, Schlage "C" keyway', 'C65': 'Rim Cylinder, Schlage "C" keyway',
                                             'IC7R': 'SFIC Interchangeable Core Rim Cylinder Housing (core not included)'}}
verify(94, 'RC65', 63, window=300)

# ------------------------------------------------------------------ cross-check vs the spreadsheet
wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb['Price List']
flat = {}
for r in range(2, ws.max_row + 1):
    p = ws.cell(row=r, column=2).value
    if p is not None:
        flat.setdefault(re.sub(r'[\s*]+$', '', str(p).strip()).upper(), (r, ws.cell(row=r, column=5).value, ws.cell(row=r, column=1).value))
ok = 0
notes = []
for m, d in MODELS.items():
    got = flat.get(m)
    if got is None:
        problems.append('model %s has no spreadsheet row' % m)
    elif got[1] == d['pdfPrice']:
        ok += 1
    else:
        notes.append('%s: PDF $%s vs spreadsheet $%s (row %s) — the tool uses the spreadsheet price (your decision)' % (m, d['pdfPrice'], got[1], got[0]))
for code, a in ACC.items():
    got = flat.get(code.upper())
    if got is None:
        continue
    if got[1] == a['price']:
        ok += 1
    elif code == 'ECL-2109':
        notes.append('ECL-2109: spreadsheet row %s ($%s) is the known bad duplicate; data.js already carries the PDF price $%s' % (got[0], got[1], a['price']))
    else:
        problems.append('accessory %s: PDF $%s vs spreadsheet $%s (row %s)' % (code, a['price'], got[1], got[0]))
for code, o in X_TRIMS.items():
    got = flat.get(code)
    if got is not None:
        (ok if got[1] == o['price'] else None) or problems.append('trim %s: PDF $%s vs spreadsheet $%s' % (code, o['price'], got[1]))
for t, tiers in VRA.items():
    for tier, price in tiers.items():
        got = flat.get('VRA-143%s-%s' % (t, tier))
        if got is None:
            problems.append('VRA-143%s-%s missing in spreadsheet' % (t, tier))
        elif got[1] != price:
            problems.append('VRA-143%s-%s: PDF $%s vs spreadsheet $%s' % (t, tier, price, got[1]))
        else:
            ok += 1
print('verified against the spreadsheet:', ok)
for n in notes: print('  NOTE', n)
print('PROBLEMS:', len(problems))
for p in problems: print('  ', p)

data = {'models': MODELS, 'families': FAMILIES, 'sn1Kits': SN1_KITS, 'xTrims': X_TRIMS, 'accessories': ACC, 'vra': VRA, 'cylinder': CYL}
js  = '// Exit control lock (ECL) models, options, trims and accessories — transcribed from 8-2026-DETEX-Price-List.pdf\n'
js += '// (Effective August 1, 2026), pages 85-94. GENERATED by tools/gen_ecl.py — do not hand-edit.\n'
js += '// Base prices are read from the spreadsheet at runtime (DETEX_DATA); pdfPrice is kept for audit only.\n'
js += 'const ECL_RULES = ' + json.dumps(data, indent=1) + ';\n'
if not problems:
    open(os.path.join(ROOT, 'ecl.js'), 'w').write(js)
    print('ecl.js written')
else:
    print('ecl.js NOT written — fix the problems above')
