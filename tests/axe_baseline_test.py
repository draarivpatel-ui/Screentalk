"""axe-core baseline guard for ScreenTalk (added Oct 12, 2026 after an accessibility audit; tests only, no app change).
Runs axe-core 4.14.0 with the WCAG 2.0/2.1/2.2 A+AA and best-practice tags on the main views at 360 and 1280 px.
The 2.2 tag also switches on `target-size` (WCAG 2.5.8), which axe leaves off by default and the other axe suites
here do not run. It fails only on a NEW serious or critical violation: a (rule, element) pair not listed in BASELINE.
Moderate/minor results are printed, not failed (tests/axe_states_test.py already requires 0 violations of every impact
for the WCAG 2.1 rule set).
Run: python3 tests/axe_baseline_test.py   (optional CHROME_PATH, AXE_JS=/path/axe.min.js)"""
import os, re, sys, pathlib, urllib.request
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = (ROOT / 'index.html').as_uri()
# Serious/critical violations accepted at the Oct 12, 2026 audit: (rule id, regex on the axe target, why). The audit found none.
BASELINE = []

# ---- shared core (same in all four repos) ----
TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
AXE_VERSION = '4.14.0'
PATHS = [os.environ.get('AXE_JS', ''), str(ROOT / 'node_modules/axe-core/axe.min.js')]
AXE = next((open(p).read() for p in PATHS if p and os.path.exists(p)), None) or \
    urllib.request.urlopen(f'https://cdn.jsdelivr.net/npm/axe-core@{AXE_VERSION}/axe.min.js', timeout=30).read().decode()
passed = failed = 0
def check(name, cond, info=''):
    global passed, failed
    if cond: passed += 1; print('  ok   ' + name)
    else: failed += 1; print('  FAIL ' + name + ('  -> ' + str(info) if info else ''))
def known(rule, target):
    return any(rule == r and re.search(pat, target) for r, pat, _why in BASELINE)
def axe_new_serious(pg, tag):
    if not pg.evaluate('!!window.axe'): pg.add_script_tag(content=AXE)
    res = pg.evaluate("""async(tags)=>{const r=await axe.run(document,{runOnly:{type:'tag',values:tags},resultTypes:['violations']});
      return {v:axe.version,list:r.violations.flatMap(x=>x.nodes.map(n=>({id:x.id,impact:n.impact||x.impact,t:n.target.join(' ')})))}}""", TAGS)
    new = [x for x in res['list'] if x['impact'] in ('serious', 'critical') and not known(x['id'], x['t'])]
    other = sorted({f"{x['id']}({x['impact']})" for x in res['list'] if x not in new})
    if other: print(f'  info [{tag}] baseline/lower-impact, not failed: {other}')
    check(f'[{tag}] axe {res["v"]} WCAG 2.2 AA + best-practice: no new serious/critical violation', not new,
          [f"{x['id']}({x['impact']}) {x['t']}" for x in new][:6])
def w(pg, ms=200): pg.wait_for_timeout(ms)
def demo(pg): pg.click('#demo-btn'); w(pg)
VIEWS = [
    ('landing', lambda pg: None),
    ('form errors', lambda pg: (pg.click('#save-btn'), w(pg))),
    ('demo family, tips open', lambda pg: (demo(pg), pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"))),
    ('conversation starter', lambda pg: (demo(pg), pg.select_option('#talk-who', pg.evaluate("[...document.querySelectorAll('#talk-who option')].map(o=>o.value).filter(Boolean).pop()")), w(pg))),
    ('rehearsal question', lambda pg: (pg.locator('#rh-stage button:visible').first.click(), w(pg))),
    ('myth game feedback', lambda pg: (pg.click('#game .btn.big.myth'), w(pg))),
]
with sync_playwright() as p:
    kw = {'executable_path': os.environ['CHROME_PATH']} if os.environ.get('CHROME_PATH') else {}
    b = p.chromium.launch(**kw)
    for vw in (360, 1280):
        for name, fn in VIEWS:
            tag = f'{vw} {name}'
            ctx = b.new_context(viewport={'width': vw, 'height': 800}, bypass_csp=True); pg = ctx.new_page()
            pg.on('dialog', lambda d: d.accept())
            pg.goto(APP); pg.evaluate('localStorage.clear()'); pg.goto(APP); w(pg, 300)
            try: fn(pg)
            except Exception as e: check(f'[{tag}] view reached', False, str(e)[:160]); ctx.close(); continue
            axe_new_serious(pg, tag); ctx.close()
    b.close()
print(f'\n{passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
