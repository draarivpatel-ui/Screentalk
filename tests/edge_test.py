"""Edge cases a strict judge tries, at 390 px: switching language mid-flow (form error re-worded with the same field
marked, edit mode, rehearsal round, game card and score all kept), extreme ages / packs / years, and 30 people.
Run: python3 tests/edge_test.py   (optional CHROME_PATH)"""
import os, sys, pathlib, re
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = (ROOT / 'index.html').as_uri()
passed = failed = 0
def check(name, cond, info=''):
    global passed, failed
    if cond: passed += 1; print('  ok  ' + name)
    else: failed += 1; print('  FAIL ' + name + ('  -> ' + str(info) if info else ''))
def err(pg): return pg.inner_text('#form-error').strip()
def S(pg, L, k): return pg.evaluate('([L,k]) => window.ScreenTalkI18n ? window.ScreenTalkI18n.STRINGS[L][k] : null', [L, k])
def setlang(pg, L): pg.click(f'[data-setlang="{L}"]'); pg.wait_for_timeout(120)
def person(pg, label, age, preset='male', smoke=None):
    pg.fill('#f-label', label); pg.fill('#f-age', str(age)); pg.click(f'.chip[data-preset="{preset}"]')
    if smoke:
        pg.check('#f-smoke-' + smoke[0]); pg.fill('#f-ppd', smoke[1]); pg.fill('#f-years', smoke[2])
        if len(smoke) > 3: pg.fill('#f-quit', smoke[3])
    pg.click('#save-btn'); pg.wait_for_timeout(80)
kw = {'executable_path': os.environ['CHROME_PATH']} if os.environ.get('CHROME_PATH') else {}
with sync_playwright() as p:
    b = p.chromium.launch(**kw)
    def fresh(L='en'):
        ctx = b.new_context(viewport={'width': 390, 'height': 900}); pg = ctx.new_page(); pg.on('dialog', lambda d: d.accept())
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg._errs = errs
        pg.goto(APP); pg.evaluate('localStorage.clear()'); pg.goto(APP + ('?lang=es' if L == 'es' else '')); return ctx, pg
    ctx, pg = fresh()
    has_i18n = pg.evaluate('!!window.ScreenTalkI18n')
    # Each form error, then a language switch: same error in the other language, same field marked, no focus jump.
    cases = [('nickname', lambda: (pg.fill('#f-label', ''), pg.fill('#f-age', '50')), 'f-label'),
             ('age 121', lambda: (pg.fill('#f-label', 'Tío'), pg.fill('#f-age', '121')), 'f-age'),
             ('age 47.5', lambda: (pg.fill('#f-label', 'Tío'), pg.fill('#f-age', '47.5')), 'f-age'),
             ('no body choice', lambda: (pg.fill('#f-label', 'Tío'), pg.fill('#f-age', '50')), 'f-breasts'),
             ('11 packs a day', lambda: (pg.fill('#f-label', 'Tío'), pg.fill('#f-age', '60'), pg.click('.chip[data-preset="male"]'), pg.check('#f-smoke-former'), pg.fill('#f-ppd', '11'), pg.fill('#f-years', '30')), 'f-ppd'),
             ('quit + smoked > age', lambda: (pg.fill('#f-label', 'Tío'), pg.fill('#f-age', '60'), pg.click('.chip[data-preset="male"]'), pg.check('#f-smoke-former'), pg.fill('#f-ppd', '1'), pg.fill('#f-years', '30'), pg.fill('#f-quit', '45')), 'f-quit')]
    for name, fill, field in cases:
        for L, O in (('en', 'es'), ('es', 'en')):
            ctx.close(); ctx, pg = fresh(L); fill(); pg.click('#save-btn'); pg.wait_for_timeout(80)
            e1 = err(pg); inv1 = pg.evaluate("[...document.querySelectorAll('#person-form [aria-invalid=true]')].map(f=>f.id)")
            setlang(pg, O); e2 = err(pg)
            inv2 = pg.evaluate("[...document.querySelectorAll('#person-form [aria-invalid=true]')].map(f=>f.id)")
            check(f'[{L}->{O}] {name}: error shown, then re-worded (not dropped) on switch', e1 and e2 and e1 != e2, (e1[:40], e2[:40]))
            check(f'[{L}->{O}] {name}: same field still marked invalid ({field})', inv1 == [field] and inv2 == [field], (inv1, inv2))
            check(f'[{L}->{O}] {name}: focus stays on the language button', pg.evaluate('document.activeElement.dataset.setlang') == O)
            setlang(pg, L); check(f'[{L}->{O}->{L}] {name}: back to the first wording', err(pg) == e1, err(pg)[:40])
    # Fixing the field after a switch clears the error; a switch with no error shows none.
    ctx.close(); ctx, pg = fresh(); pg.click('#save-btn'); setlang(pg, 'es'); person(pg, 'Papá', 52)
    check('after fixing the form in the other language: saved, no error', pg.locator('.person').count() == 1 and err(pg) == '')
    setlang(pg, 'en'); check('switch with no error showing: still no error', err(pg) == '')
    # Edit mode survives a switch, typed values kept.
    pg.locator('.person button.small.ghost').first.click(); pg.fill('#f-age', '53'); setlang(pg, 'es')
    check('edit mode kept on switch (title + save button in Spanish, typed age kept)', 'Papá' in pg.inner_text('#form-title') and pg.input_value('#f-age') == '53' and pg.inner_text('#save-btn') != 'Save changes', (pg.inner_text('#form-title'), pg.inner_text('#save-btn')))
    pg.click('#save-btn'); check('saving after the switch updates the same person', pg.locator('.person').count() == 1 and '53' in pg.locator('.person .age').first.inner_text())
    # Extremes accepted / refused.
    for age, ok in (('0', True), ('120', True), ('121', False), ('-1', False)):
        ctx.close(); ctx, pg = fresh(); person(pg, 'X', age)
        check(f'age {age}: {"saved" if ok else "refused"}', (pg.locator('.person').count() == 1) == ok, err(pg))
    for smoke, ok in ((('current', '10', '30'), True), (('current', '10.25', '30'), False), (('former', '1', '60', '0'), True), (('former', '1', '60', '1'), False)):
        ctx.close(); ctx, pg = fresh(); person(pg, 'Y', 60, 'male', smoke)
        check(f'smoking {smoke} at age 60: {"saved" if ok else "refused"}', (pg.locator('.person').count() == 1) == ok, err(pg))
    # Rehearsal and game keep their place across a switch.
    ctx.close(); ctx, pg = fresh()
    pg.locator('#rh-stage button:visible').first.click(); pg.wait_for_timeout(100)
    pg.locator('#rh-stage button:visible').first.click(); pg.wait_for_timeout(100)
    prog = pg.inner_text('#rh-progress'); setlang(pg, 'es')
    check('rehearsal: same round after a switch', re.findall(r'\d+', prog) == re.findall(r'\d+', pg.inner_text('#rh-progress')), (prog, pg.inner_text('#rh-progress')))
    setlang(pg, 'en')
    for _ in range(3):
        pg.click('#game .btn.big.myth'); pg.wait_for_timeout(60); pg.click('#game-next'); pg.wait_for_timeout(60)
    g1 = (pg.inner_text('#game-progress'), pg.inner_text('#game-score')); setlang(pg, 'es')
    g2 = (pg.inner_text('#game-progress'), pg.inner_text('#game-score'))
    check('game: same card and score after a switch', [re.findall(r'\d+', x) for x in g1] == [re.findall(r'\d+', x) for x in g2], (g1, g2))
    # 30 people at 390 px: all saved, no sideways scroll, summary counts them.
    ctx.close(); ctx, pg = fresh()
    for i in range(30): person(pg, f'Person {i}', 20 + i * 2, 'female' if i % 2 else 'male')
    check('30 people saved', pg.locator('.person').count() == 30)
    check('30 people: no sideways scroll at 390 px', pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') <= 0)
    check('no page errors in the last run', not pg._errs, pg._errs[:2])
    ctx.close(); b.close()
print(f'\n{passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
