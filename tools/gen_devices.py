#!/usr/bin/env python3
"""Generate devices.js (exit-device base prices by series/finish) from the PDF and audit the spreadsheet
against it (36" base prices and the +$50 48" rule).  Usage: python3 tools/gen_devices.py [PDF] [XLSX]"""
import pdfplumber, re, json, os, sys, openpyxl
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', '8-2026-DETEX-Price-List.pdf')
XLSX = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, '..', 'DETEX 8-2026-Excel-Price-List.xlsx')

def money(s):
    return None if s == 'N/A' else int(s.replace('$', '').replace(',', ''))

# ---- 1. base price tables from the PDF ----------------------------------------------------
ADV_COLS = [['630'], ['628'], ['693', '695'], ['606', '612'], ['605', '611', '629']]
DUMMY_COLS = [['630'], ['628'], ['693', '695'], ['606', '612'], ['605', '611', '629']]
DUMMY01_COLS = [['630'], ['628'], ['693', '695'], ['606', '612'], ['605', '611', '613', '629']]

row_adv = re.compile(r'^(\d{2}) Series((?:\s+(?:\$[\d,]+|N/A)){5})$')
row_val = re.compile(r'^(V\d{2}(?:xNS)?)((?:\s+\$[\d,]+){2})$')
row_dummy = re.compile(r'^(0000|0500xEC2|01|04)\b.*?((?:\s+(?:\$[\d,]+|N/A)){5})$')

base = {}      # series -> {finish: price}
page_of = {}   # series -> page
with pdfplumber.open(PDF) as pdf:
    for pn in list(range(12, 23)) + [46, 47, 48]:
        for raw in (pdf.pages[pn - 1].extract_text() or '').split('\n'):
            line = raw.strip()
            m = row_adv.match(line)
            if m:
                vals = re.findall(r'\$[\d,]+|N/A', m.group(2))
                d = {}
                for cols, v in zip(ADV_COLS, vals):
                    for f in cols:
                        d[f] = money(v)
                base[m.group(1)] = d; page_of[m.group(1)] = pn
                continue
            m = row_val.match(line)
            if m:
                vals = re.findall(r'\$[\d,]+', m.group(2))
                base[m.group(1)] = {'628': money(vals[0]), '711': money(vals[1])}; page_of[m.group(1)] = pn
                continue
            m = row_dummy.match(line)
            if m and pn == 22:
                vals = re.findall(r'\$[\d,]+|N/A', m.group(2))
                cols = DUMMY01_COLS if m.group(1) in ('01', '04') else DUMMY_COLS
                d = {}
                for cs, v in zip(cols, vals):
                    for f in cs:
                        d[f] = money(v)
                base[m.group(1)] = d; page_of[m.group(1)] = pn

print('series parsed from PDF:', sorted(base, key=lambda s: (len(s), s)))

# ---- 2. flat spreadsheet device rows ------------------------------------------------------
wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb['Price List']
flat = {}
for r in range(2, ws.max_row + 1):
    fam = ws.cell(row=r, column=1).value
    part = ws.cell(row=r, column=2).value
    if fam in ('ADVANTEX', 'VALUE SERIES') and part:
        p = re.sub(r'\s*\(std\.\)\s*$', '', str(part).strip())
        flat[p.upper()] = (r, ws.cell(row=r, column=5).value)

# ---- 3. compare 36" rows -------------------------------------------------------------------
print('\n=== 36" base price: PDF vs spreadsheet ===')
n_ok = 0; n_bad = 0; n_missing = 0
issues = []
for series, d in sorted(base.items(), key=lambda kv: (len(kv[0]), kv[0])):
    for fin, price in d.items():
        if price is None:
            continue
        key = f'{series}X{fin}'.upper()
        if series == '0500xEC2':
            key = f'0500XEC2X{fin}'.upper()
        got = flat.get(key)
        if got is None:
            n_missing += 1; issues.append(('MISSING', series, fin, price, None, None)); continue
        if got[1] == price:
            n_ok += 1
        else:
            n_bad += 1; issues.append(('MISMATCH', series, fin, price, got[1], got[0]))
print(f'match {n_ok}, mismatch {n_bad}, no spreadsheet row {n_missing}')
for kind, s, f, pdfp, xp, row in issues:
    if kind == 'MISMATCH':
        print(f'  MISMATCH {s} {f}: PDF ${pdfp} vs spreadsheet ${xp} (row {row})')
print('  rows with no spreadsheet counterpart:', [(s, f) for k, s, f, *_ in issues if k == 'MISSING'])

# ---- 4. width rows: expected = base + adder ----------------------------------------------
print('\n=== 48" rows: expected PDF base + $50 vs spreadsheet ===')
adders = {}   # default $50 for 48" on every Advantex page; V xNS/V50/V51 listed as $50 too
n_ok = 0; bad = []
for series, d in base.items():
    for fin, price in d.items():
        if price is None:
            continue
        key = f'{series}X{fin}X48'.upper()
        got = flat.get(key)
        if got is None:
            continue
        exp = price + 50
        if got[1] == exp:
            n_ok += 1
        else:
            bad.append((series, fin, exp, got[1], got[0]))
print(f'match {n_ok}, mismatch {len(bad)}')
for s, f, exp, got, row in bad:
    print(f'  {s} {f} x48: expected ${exp} (PDF ${exp-50} + $50) vs spreadsheet ${got} (row {row}, off by {got-exp:+d})')

out = {}
for series in sorted(base, key=lambda k: (len(k), k)):
    out[series] = {'page': page_of[series], 'prices': {f: p for f, p in base[series].items() if p is not None}}
js  = '// Exit-device BASE prices (36" door) by series and finish — transcribed from 8-2026-DETEX-Price-List.pdf\n'
js += '// (Effective August 1, 2026): Advantex device pages 12-22, Value Series pages 46-48.\n'
js += '// GENERATED by tools/gen_devices.py — do not hand-edit. Width is added in builder.js from the PDF\'s\n'
js += '// option adders (48" +$50; 10 Series 60" +$353 in 628/693/695), NOT read from the spreadsheet\'s width rows,\n'
js += '// which are wrong for the 20/21 and 60/61/62/63 Series.\n'
js += 'const DEVICE_BASE = ' + json.dumps(out, indent=1) + ';\n'
open(os.path.join(ROOT, 'devices.js'), 'w').write(js)
print('devices.js written:', len(out), 'series')
