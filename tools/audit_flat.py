#!/usr/bin/env python3
"""Audit spreadsheet part numbers/prices against the PDF price book.

For every spreadsheet row, find the part number in the PDF text and check that its price appears on the same
line or the next line. Reports verified / mismatch / not-found per category. Mismatches are candidates to
review by hand (a wrapped table can hide a price), not proof of an error.
Usage: python3 tools/audit_flat.py [PDF] [XLSX]
"""
import os, re, sys
import pdfplumber, openpyxl
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', '8-2026-DETEX-Price-List.pdf')
XLSX = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, '..', 'DETEX 8-2026-Excel-Price-List.xlsx')

lines = []   # (page, text)
with pdfplumber.open(PDF) as pdf:
    for i, p in enumerate(pdf.pages, 1):
        for ln in (p.extract_text() or '').split('\n'):
            lines.append((i, ln))
price_re = re.compile(r'\$\s?([\d,]+(?:\.\d\d)?)')

def prices_in(*texts):
    out = set()
    for t in texts:
        for m in price_re.finditer(t):
            out.add(float(m.group(1).replace(',', '')))
    return out

wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb['Price List']
rows = []
for r in range(2, ws.max_row + 1):
    fam, part, price = ws.cell(row=r, column=1).value, ws.cell(row=r, column=2).value, ws.cell(row=r, column=5).value
    if part is None or not isinstance(price, (int, float)):
        continue
    rows.append((r, str(fam).strip(), re.sub(r'\s*\(std\.\)\s*$', '', str(part).strip()), price))

res = defaultdict(lambda: {'ok': 0, 'bad': [], 'nf': 0})
for r, fam, part, price in rows:
    key = re.sub(r'[\s*]+$', '', part)
    if len(key) < 4 or re.search(r'x\d{3}(x\d+)?$', key):      # finish-suffixed device/trim rows are audited elsewhere
        res[fam]['nf'] += 0
        continue
    pat = re.compile(r'(?<![A-Za-z0-9-])' + re.escape(key) + r'\**(?![A-Za-z0-9])')
    seen = False; ok = False; ctx = []
    for idx, (pg, ln) in enumerate(lines):
        if pat.search(ln):
            seen = True
            nxt = lines[idx + 1][1] if idx + 1 < len(lines) else ''
            prv = lines[idx - 1][1] if idx > 0 else ''
            if float(price) in prices_in(ln, nxt, prv):
                ok = True; break
            ctx.append((pg, ln[:110]))
    if ok: res[fam]['ok'] += 1
    elif seen: res[fam]['bad'].append((r, key, price, ctx[:2]))
    else: res[fam]['nf'] += 1

print('%-42s %7s %9s %9s' % ('category', 'verified', 'mismatch?', 'not in PDF'))
for fam, d in sorted(res.items()):
    print('%-42s %7d %9d %9d' % (fam, d['ok'], len(d['bad']), d['nf']))
print()
for fam, d in sorted(res.items()):
    for r, key, price, ctx in d['bad']:
        print('%s | row %d | %s $%s | PDF: %s' % (fam, r, key, price, ' || '.join('p%d: %s' % c for c in ctx)))
