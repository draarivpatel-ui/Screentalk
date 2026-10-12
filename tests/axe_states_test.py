"""axe-core sweep of every ScreenTalk state at 390 and 1280 px, EN and ES, plus a mid-flow language switch.
States: empty, form errors, demo family (+tips open), editing a person, conversation starter picked,
rehearsal question, rehearsal feedback, rehearsal result, game feedback, game finished, high-risk custom person.
Run: python3 tests/axe_states_test.py   (optional CHROME_PATH, AXE_JS=/path/axe.min.js)"""
import os, sys, pathlib, urllib.request
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = (ROOT / 'index.html').as_uri()
PATHS = [os.environ.get('AXE_JS', ''), str(ROOT / 'node_modules/axe-core/axe.min.js'),
         '/workspace/work/hackathons/eurekadev_qa/node_modules/axe-core/axe.min.js']
AXE = next((open(p).read() for p in PATHS if p and os.path.exists(p)), None) or \
    urllib.request.urlopen('https://cdn.jsdelivr.net/npm/axe-core@4.14.0/axe.min.js', timeout=30).read().decode()
passed, failed = 0, 0
def check(name, cond, info=''):
    global passed, failed
    if cond: passed += 1; print('  ok  ' + name)
    else: failed += 1; print('  FAIL ' + name + ('  -> ' + str(info) if info else ''))
def axe(pg, tag):
    if not pg.evaluate('!!window.axe'): pg.add_script_tag(content=AXE)
    v = pg.evaluate("""async()=>{const r=await axe.run(document,{resultTypes:['violations']});
      return r.violations.map(v=>v.id+' x'+v.nodes.length+' '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' | '))}""")
    check(f'[{tag}] axe 0 violations', not v, v)
def overflow(pg, tag):
    w = pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
    check(f'[{tag}] no sideways scroll', w <= 0, f'{w}px')
def setlang(pg, L): pg.click(f'[data-setlang="{L}"]'); pg.wait_for_timeout(150)
def demo(pg): pg.click('#demo-btn'); pg.wait_for_timeout(200)
def rh_click(pg, n=0):
    btns = pg.locator('#rh-stage button:visible')
    btns.nth(n).click(); pg.wait_for_timeout(120)

def empty(pg): pass
def form_errors(pg): pg.click('#save-btn')
def demo_family(pg): demo(pg); pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
def editing(pg): demo(pg); pg.locator('.person button.small.ghost').first.click(); pg.wait_for_timeout(150)
def talk(pg):
    demo(pg); opts = pg.evaluate("[...document.querySelectorAll('#talk-who option')].map(o=>o.value).filter(Boolean)")
    pg.select_option('#talk-who', opts[-1]); pg.select_option('#talk-tone', index=1)
def custom_risk(pg):
    pg.fill('#f-label', 'Tía'); pg.fill('#f-age', '45'); pg.click('.chip[data-preset="custom"]')
    for c in ('#f-breasts', '#f-cervix', '#f-uterus'): pg.check(c)
    pg.check('#f-smoke-current'); pg.fill('#f-ppd', '1.5'); pg.fill('#f-years', '25'); pg.check('#f-fh')
    pg.click('#save-btn'); pg.wait_for_timeout(150)
def rh_question(pg): rh_click(pg)
def rh_feedback(pg): rh_click(pg); rh_click(pg)
def rh_result(pg):
    rh_click(pg)
    for _ in range(40):
        if pg.locator('#rh-stage .rh-result, #rh-stage [data-screen="rh-result"]').count(): break
        rh_click(pg)
        if 'again' in (pg.inner_text('#rh-stage').lower()) or 'otra vez' in pg.inner_text('#rh-stage').lower(): break
def game_feedback(pg): pg.click('#game .btn.big.myth'); pg.wait_for_timeout(120)
def game_done(pg):
    for _ in range(60):
        if pg.is_visible('#game-restart'): break
        if pg.is_visible('#game .btn.big.myth') and pg.is_enabled('#game .btn.big.myth'): pg.click('#game .btn.big.myth')
        if pg.is_visible('#game-next'): pg.click('#game-next')
        pg.wait_for_timeout(40)
    check('game reached its end screen', pg.is_visible('#game-restart'))

STATES = [empty, form_errors, demo_family, editing, talk, custom_risk, rh_question, rh_feedback, rh_result, game_feedback, game_done]
with sync_playwright() as p:
    kw = {'executable_path': os.environ['CHROME_PATH']} if os.environ.get('CHROME_PATH') else {}
    b = p.chromium.launch(**kw)
    for vw in (390, 1280):
        for L in ('en', 'es'):
            for fn in STATES:
                tag = f'{vw}-{L} {fn.__name__}'
                ctx = b.new_context(viewport={'width': vw, 'height': 900}, bypass_csp=True); pg = ctx.new_page(); errs = []
                pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: d.accept())
                pg.goto(APP); pg.evaluate('localStorage.clear()'); pg.goto(APP + ('?lang=es' if L == 'es' else ''))
                if L == 'es' and pg.evaluate('document.documentElement.lang') != 'es': setlang(pg, 'es')
                try: fn(pg)
                except Exception as e: check(f'[{tag}] state reached', False, str(e)[:160]); ctx.close(); continue
                axe(pg, tag); overflow(pg, tag)
                other = 'en' if L == 'es' else 'es'
                setlang(pg, other); axe(pg, f'{tag} ->{other}')
                check(f'[{tag}] <html lang> follows switch', pg.evaluate('document.documentElement.lang') == other)
                check(f'[{tag}] no page errors', not errs, errs[:2])
                ctx.close()
    b.close()
print(f'\n{passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
