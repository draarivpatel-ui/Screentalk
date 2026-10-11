"""End-to-end browser test for ScreenTalk (headless Chromium via Playwright).

Run:  pip install playwright && playwright install chromium
      python3 tests/e2e_test.py            # optional: CHROME_PATH=/path/to/chrome
Checks real user flows: empty states, form validation, add/edit/remove, progress that
survives a reload, conversation starters, the full Myth-or-Fact game, calendar reminder
download, clearing data, mobile layout, the whole app in Spanish (plan, message, printed sheet,
game, habits, help, footer), and that the page makes zero network requests.
"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = (ROOT / 'index.html').as_uri()
passed, failed = 0, 0


# WCAG contrast of every visible text element (opacity of ancestors included), like axe color-contrast.
CONTRAST_JS = r"""
(sel) => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return [0,0,0,1]; const v = m[1].split(',').map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; };
  const lum = ([r,g,b]) => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b); };
  const bgOf = el => { for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0.5) return c; } return [255,255,255,1]; };
  const out = [];
  document.querySelectorAll(sel).forEach(el => {
    if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!own || el.closest('.sr-only,[aria-hidden="true"]') || el.matches(':disabled') || el.closest('button:disabled,select:disabled,textarea:disabled,input:disabled')) return;
    let op = 1; for (let n = el; n; n = n.parentElement) op *= Number(getComputedStyle(n).opacity);
    const fg = parse(getComputedStyle(el).color), bg = bgOf(el), a = fg[3] * op;
    const mix = [0,1,2].map(i => fg[i]*a + bg[i]*(1-a));
    const L1 = lum(mix), L2 = lum(bg), ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const cs = getComputedStyle(el), px = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
    const need = (px >= 24 || (bold && px >= 18.66)) ? 3 : 4.5;
    if (ratio < need) out.push(el.tagName + '.' + el.className + ' "' + el.textContent.trim().slice(0, 40) + '" ' + ratio.toFixed(2));
  });
  return out;
}
"""


def check(name, cond, info=''):
    global passed, failed
    if cond:
        passed += 1; print('  ok  ' + name)
    else:
        failed += 1; print('  FAIL ' + name + ('  -> ' + str(info) if info else ''))


def add_person(pg, label, age, preset=None, extra=None):
    pg.fill('#f-label', label)
    pg.fill('#f-age', str(age))
    if preset:
        pg.click(f'.chip[data-preset="{preset}"]')
    if extra:
        extra(pg)
    pg.click('#save-btn')


with sync_playwright() as p:
    kw = {'executable_path': os.environ['CHROME_PATH']} if os.environ.get('CHROME_PATH') else {}
    browser = p.chromium.launch(**kw)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, accept_downloads=True)
    pg = ctx.new_page()
    errors, external = [], []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    pg.on('request', lambda r: r.url.split(':')[0] not in ('file', 'data', 'blob') and external.append(r.url))
    pg.on('dialog', lambda d: d.accept())
    pg.goto(APP)

    print('ScreenTalk end-to-end')
    # Empty states
    check('empty state visible', pg.is_visible('#empty'))
    check('timeline hidden when empty', not pg.is_visible('#timeline-section'))
    check('copy/share/print/message disabled when empty', pg.is_disabled('#copy-btn') and pg.is_disabled('#share-btn') and pg.is_disabled('#print-btn') and pg.is_disabled('#talk-text'))

    # Validation
    pg.click('#save-btn')
    check('nickname required', 'nickname' in pg.inner_text('#form-error').lower())
    pg.fill('#f-label', 'Dad'); pg.fill('#f-age', '150'); pg.click('#save-btn')
    check('age range enforced', 'age' in pg.inner_text('#form-error').lower())
    check('invalid field is focused + marked', pg.evaluate("document.activeElement.id") == 'f-age' and pg.get_attribute('#f-age', 'aria-invalid') == 'true')
    pg.fill('#f-age', '52'); pg.click('#save-btn')
    check('body choice required', 'female' in pg.inner_text('#form-error').lower())

    # Dependent fields
    check('menopause disabled until uterus/cervix', pg.is_disabled('#f-menopause'))
    check('pack-year inputs disabled for never-smokers', pg.is_disabled('#f-ppd'))
    low = pg.evaluate(CONTRAST_JS, '.smoke-calc .hint, .smoke-calc small, .smoke-calc label span, .dep span, .dep.select-row span')
    check('disabled pack-year hint and dependent labels keep >= 4.5:1 contrast', not low, low)
    allLow = pg.evaluate(CONTRAST_JS, 'main *, header *, footer *')
    check('no text below WCAG AA contrast on the page (English)', not allLow, allLow[:5])
    pg.click('.chip[data-preset="male"]')
    check('preset sets aria-pressed', pg.get_attribute('.chip[data-preset="male"]', 'aria-pressed') == 'true')
    pg.check('#f-smoke-former')
    pg.fill('#f-ppd', '1'); pg.fill('#f-years', '60')
    pg.click('#save-btn')
    check('years smoked cannot exceed age', 'years smoked' in pg.inner_text('#form-error').lower())
    pg.fill('#f-years', '22')
    check('pack-year helper shows 22', pg.inner_text('#py-value') == '22')
    pg.click('#save-btn')
    check('person added', pg.locator('.person').count() == 1)
    card = pg.locator('.person').first
    text = card.inner_text()
    check('Dad 52 gets colorectal talk-now', 'Colon and rectal cancer screening' in text)
    check('Dad gets lung screening (22 pack-years)', 'Lung cancer screening' in text and 'yearly low-dose CT' in text)
    check('Dad gets prostate discuss', 'Prostate cancer testing decision' in text)
    check('no quit-help link for a former smoker', card.locator('text=Free quit help').count() == 0)
    check('form reset after add', pg.input_value('#f-label') == '' and pg.is_disabled('#f-ppd'))

    # Add a second person (female, 71, menopause)
    def meno(pg):
        pg.check('#f-menopause')
    add_person(pg, 'Nana', 71, 'female', meno)
    check('two people', pg.locator('.person').count() == 2)
    nana = pg.locator('.person').nth(1).inner_text()
    check('Nana: endometrial awareness shown', 'Endometrial' in nana)
    check('Nana: cervical exit rule shown', 'screening can stop' in nana)

    # Edit
    pg.locator('.person').nth(1).locator('button', has_text='Edit').click()
    check('edit fills form', pg.input_value('#f-label') == 'Nana' and pg.is_checked('#f-menopause'))
    pg.uncheck('#f-uterus'); pg.uncheck('#f-cervix')
    check('menopause disabled after uterus+cervix unchecked', pg.is_disabled('#f-menopause'))
    pg.click('#save-btn')
    nana = pg.locator('.person').nth(1).inner_text()
    check('edit saved: no cervical/endometrial after hysterectomy', 'Cervical' not in nana and 'Endometrial' not in nana)
    check('edit did not duplicate', pg.locator('.person').count() == 2)

    # Progress persists
    pg.locator('.person').first.locator('select.progress-select').select_option('booked')
    check('summary counts progress', '1 of 2' in pg.inner_text('#summary'))
    pg.reload()
    check('data survives reload', pg.locator('.person').count() == 2)
    check('progress survives reload', pg.locator('.person').first.locator('select.progress-select').input_value() == 'booked')

    # Timeline
    check('timeline visible with people', pg.is_visible('#timeline svg'))
    check('timeline has text alternative', 'Dad, age 52' in pg.inner_text('#timeline-text'))

    # Talk
    check('copy enabled with people', not pg.is_disabled('#copy-btn'))
    starter = pg.input_value('#talk-text')
    check('starter names Dad and topics', 'Dad' in starter and 'colon cancer screening' in starter and 'lung cancer screening' in starter)
    pg.select_option('#talk-tone', 'text')
    check('text tone changes starter', pg.input_value('#talk-text') != starter)
    pg.fill('#talk-text', 'My own words for Dad')
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'])
    pg.click('#copy-btn')
    pg.wait_for_timeout(200)
    check('copy uses the edited message', pg.evaluate("navigator.clipboard.readText()") == 'My own words for Dad' and 'Copied' in pg.inner_text('#copy-status'))

    # Questions
    q = pg.locator('.person').first.locator('details.questions')
    q.locator('summary').click()
    check('checkup questions listed', 'PSA' in q.inner_text())

    # Calendar reminder
    with pg.expect_download() as dl:
        pg.locator('.person').first.locator('button', has_text='Remind me').click()
    path = dl.value.path()
    ics = open(path, encoding='utf-8').read()
    check('reminder .ics downloaded', ics.startswith('BEGIN:VCALENDAR') and 'Check in with Dad' in ics, dl.value.suggested_filename)

    # One-page checkup sheet
    pg.evaluate("() => { window.__printed = 0; window.print = function () { window.__printed++; }; }")
    pg.locator('.person').first.locator('button.sheet-btn').click()
    sheet = pg.evaluate("document.getElementById('checkup-sheet').textContent")
    check('checkup sheet button prints', pg.evaluate('window.__printed') == 1)
    check('checkup sheet is for Dad with his topics', 'Checkup sheet: Dad, age 52' in sheet and 'Lung cancer screening' in sheet and 'Prostate cancer testing decision' in sheet)
    check('checkup sheet has questions, pack-years, and fill-in table', 'PSA' in sheet and '22 pack-years' in sheet and 'Last test (date)' in sheet and pg.locator('#checkup-sheet td.fill').count() >= 9)
    check('sheet print mode on, sheet hidden on screen', pg.evaluate("document.body.classList.contains('print-sheet')") and not pg.is_visible('#checkup-sheet'))
    pg.emulate_media(media='print')
    check('print shows only the sheet', pg.is_visible('#checkup-sheet') and not pg.is_visible('#plan'))
    pg.emulate_media(media='screen')
    pg.evaluate("window.dispatchEvent(new Event('afterprint'))")
    check('afterprint returns to family-plan printing', not pg.evaluate("document.body.classList.contains('print-sheet')"))
    pg.evaluate("window.dispatchEvent(new Event('beforeprint'))")
    check('Ctrl+P fills the print date', pg.inner_text('#print-date').strip() != '')

    # Game: play all cards by keyboard
    pg.locator('#game').scroll_into_view_if_needed()
    for i in range(12):
        pg.locator('#game-buttons button').first.focus()
        pg.keyboard.press('Enter')
        if not pg.is_visible('#game-reveal'):
            break
        if i == 0:
            check('answer reveals source link', pg.get_attribute('#game-src', 'href').startswith('https://www.cancer.'))
            check('focus moves to Next', pg.evaluate("document.activeElement.id") == 'game-next')
        pg.keyboard.press('Enter')
    check('game finishes with a score', pg.is_visible('#game-done') and 'of 12' in pg.inner_text('#game-final'))
    pg.click('#game-restart')
    check('restart resets', pg.inner_text('#game-progress') == 'Card 1 of 12')

    # Habits
    pg.check('#h0')
    check('habit count updates', '1 of 8' in pg.inner_text('#habit-count'))

    # Rehearse the talk: keyboard play, branching, Spanish, scoring, sources
    pg.locator('#rehearse').scroll_into_view_if_needed()
    check('rehearse section + nav link', pg.is_visible('#rh-start') and pg.locator('.topbar nav a[href="#rehearse"]').count() == 1)
    pg.focus('#rh-start'); pg.keyboard.press('Enter')
    check('rehearse starts by keyboard, focus on the question', pg.evaluate("document.activeElement.id") == 'rh-q' and pg.locator('.rh-choice').count() == 3)
    check('parent opens with "I feel fine"', 'I feel fine' in pg.inner_text('.rh-bubble.current'))
    strong = pg.evaluate("window.ScreenTalkRehearse.ROUNDS.map(r => r.options.findIndex(o => o.quality === 'strong'))")
    weak = pg.evaluate("window.ScreenTalkRehearse.ROUNDS.map(r => r.options.findIndex(o => o.quality === 'weak'))")
    # answer round 1 with a number key: find which key holds the strong reply
    keys = pg.eval_on_selector_all('.rh-choice', 'bs => bs.map(b => b.dataset.index)')
    pg.keyboard.press(str(keys.index(str(strong[0])) + 1))
    check('number key answers; tip shown, focus on Next', pg.evaluate("document.activeElement.id") == 'rh-next' and 'Great reply' in pg.inner_text('#rh-coach'))
    pg.wait_for_timeout(100)
    live = pg.evaluate("document.getElementById('status-live').textContent")
    check('screen readers hear the verdict, reaction, and tip', 'Great reply' in live and 'CDC' in live, live)
    hrefs = pg.eval_on_selector_all('#rh-coach a', 'as => as.map(a => a.href)')
    check('coaching tip cites CDC/ACS/NCI links', len(hrefs) >= 1 and all(h.startswith(('https://www.cdc.gov/', 'https://www.cancer.org/', 'https://www.cancer.gov/')) for h in hrefs), hrefs)
    check('parent select locked mid-rehearsal', pg.is_disabled('#rh-parent'))
    pg.keyboard.press('Enter')
    check('Next by keyboard goes to round 2', pg.inner_text('#rh-progress') == 'Round 2 of 5' and pg.evaluate("document.activeElement.id") == 'rh-q')
    pg.click('#rh-lang button[data-lang="es"]')
    check('Spanish toggle mid-game keeps progress', pg.get_attribute('#rh-card', 'lang') == 'es' and pg.inner_text('#rh-progress') == 'Ronda 2 de 5' and 'familia' in pg.inner_text('.rh-bubble.current').lower())
    check('Spanish transcript keeps round 1', 'Me siento bien' in pg.inner_text('#rh-chat'))
    for r in range(1, 5):
        pg.click(f'.rh-choice[data-index="{strong[r]}"]')
        pg.click('#rh-next')
    check('perfect run: 10 of 10, Spanish feedback', '10 de 10' in pg.inner_text('#rh-final-score') and pg.locator('#rh-review > li').count() == 5)
    check('result heading focused', pg.evaluate("document.activeElement.id") == 'rh-result')
    check('parent agrees at the end', 'rh-ending yes' in pg.get_attribute('#rh-ending', 'class'))
    check('link to write the real message', pg.get_attribute('#rh-to-talk', 'href') == '#talk')
    pg.click('#rh-lang button[data-lang="en"]')
    pg.select_option('#rh-parent', 'dad')
    pg.click('#rh-again')
    check('restart with Dad', pg.inner_text('#rh-progress') == 'Round 1 of 5' and 'dad' in pg.inner_text('.rh-bubble.current .rh-who').lower())
    pg.click(f'.rh-choice[data-index="{weak[0]}"]')
    check('weak reply backfires', 'That backfired' in pg.inner_text('#rh-coach') and pg.locator('.rh-bubble.teen.weak').count() == 1)
    pg.click('#rh-next')
    check('branch: parent turns guarded after a weak reply', "I don\u2019t need this" in pg.inner_text('.rh-bubble.current'))
    for r in range(1, 5):
        pg.click(f'.rh-choice[data-index="{weak[r]}"]')
        pg.click('#rh-next')
    check('weak run: 0 of 10, try-saying tips with sources', '0 of 10' in pg.inner_text('#rh-final-score') and pg.locator('#rh-review a').count() >= 5 and 'Try saying' in pg.inner_text('#rh-review'))
    check('ending is "drop it" after a weak run', 'rh-ending no' in pg.get_attribute('#rh-ending', 'class'))
    pg.reload()
    check('language + parent preference remembered', pg.input_value('#rh-parent') == 'dad' and pg.get_attribute('#rh-lang button[data-lang="en"]', 'aria-pressed') == 'true')
    pg.click('#rh-start')
    pg.set_viewport_size({'width': 390, 'height': 844})
    pg.wait_for_timeout(150)
    check('rehearse fits 390px (no horizontal scroll)', pg.evaluate("document.documentElement.scrollWidth - window.innerWidth") <= 0)
    tap = pg.evaluate("Math.min(...[...document.querySelectorAll('.rh-choice')].map(b => b.getBoundingClientRect().height))")
    check('answer buttons are big enough to tap on mobile (>=44px)', tap >= 44, tap)
    pg.set_viewport_size({'width': 1280, 'height': 900})

    # Remove + clear
    pg.locator('.person').nth(1).locator('button', has_text='Remove').click()
    check('remove works', pg.locator('.person').count() == 1)
    pg.click('#clear-btn')
    check('clear empties plan', pg.locator('.person').count() == 0 and pg.is_visible('#empty'))
    check('clear wipes storage', pg.evaluate("localStorage.getItem('screentalk.v1')") is None and pg.evaluate("localStorage.getItem('screentalk.rehearse.v1')") is None)

    # Broken saved data does not crash the page
    pg.evaluate("localStorage.setItem('screentalk.v1', JSON.stringify({people:[null,{label:'<b>x</b>',age:'abc'},{smokes:true,age:60,packYears:30,label:'Old'}],habits:5}))")
    pg.reload()
    check('broken saved data still renders', pg.locator('.person').count() == 3 and pg.locator('.person b').count() == 0)
    pg.evaluate("localStorage.setItem('screentalk.v1', '{not json')")
    pg.reload()
    check('corrupt JSON falls back to empty', pg.is_visible('#empty'))

    # Demo + mobile layout
    pg.click('#demo-btn')
    check('demo family loads 4 people', pg.locator('.person').count() == 4)
    pg.set_viewport_size({'width': 360, 'height': 780})
    pg.wait_for_timeout(200)
    overflow = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    check('no horizontal scroll at 360px', overflow <= 0, overflow)
    check('nav still available on mobile', pg.is_visible('.topbar nav'))
    # USPSTF cross-check and no-copay note on the cards (phone width)
    mom = pg.locator('.person').first
    mom_breast = mom.locator('.topic', has_text='Breast cancer screening')
    check('Mom 46: USPSTF line says every 2 years, 40 to 74, flagged as differing from ACS',
          'every 2 years for women 40 to 74' in mom_breast.inner_text() and mom_breast.locator('.us-chip.diff').inner_text() == 'Differs from ACS')
    check('USPSTF link goes to the USPSTF recommendation page',
          mom_breast.locator('.us-note a').get_attribute('href') == 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening')
    check('no-copay note links HealthCare.gov', 'no copay' in mom_breast.inner_text() and mom_breast.locator('.cost-note a').get_attribute('href') == 'https://www.healthcare.gov/preventive-care-women/')
    check('colorectal USPSTF line is marked the same as ACS', mom.locator('.topic', has_text='Colon and rectal').locator('.us-chip.same').count() == 1)
    dad = pg.locator('.person').nth(1)
    check('Dad (former smoker): USPSTF lung line explains the 15-years-since-quitting rule', 'quit within the past 15 years' in dad.locator('.topic', has_text='Lung cancer screening').inner_text())
    check('every screening topic in the demo family has a USPSTF line', pg.locator('#people .us-note').count() >= 10, pg.locator('#people .us-note').count())
    usLow = pg.evaluate(CONTRAST_JS, '.us-note *, .cost-note, .us-chip')
    check('USPSTF and cost notes keep WCAG AA contrast', not usLow, usLow[:3])
    # Start the talk from a person's card
    dad.locator('button.talk-with').click()
    try:
        pg.wait_for_function("(() => { const r = document.getElementById('talk-text').getBoundingClientRect(); return r.top >= 0 && r.top < window.innerHeight; })()", timeout=5000)
    except Exception:
        pass
    dad_id = dad.get_attribute('data-person')
    check('card button picks that person in Start the talk', pg.input_value('#talk-who') == dad_id and 'Dad' in pg.input_value('#talk-text'))
    check('card button scrolls to the talk section and focuses the message',
          pg.evaluate("document.activeElement.id") == 'talk-text' and pg.evaluate("(() => { const r = document.getElementById('talk-text').getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; })()"),
          pg.evaluate("document.activeElement.id + ' ' + JSON.stringify(document.getElementById('talk-text').getBoundingClientRect()) + ' ' + scrollY + ' ' + innerHeight"))
    check('card button is tappable on a phone (>=44px tall)', dad.locator('button.talk-with').bounding_box()['height'] >= 44)
    overflow = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    check('still no horizontal scroll at 360px with the new notes', overflow <= 0, overflow)

    # ---------- Spanish across the whole app (fresh browser profile) ----------
    print('Spanish')
    ctx2 = browser.new_context(viewport={'width': 1280, 'height': 900}, accept_downloads=True)
    es = ctx2.new_page()
    es.on('pageerror', lambda e: errors.append(str(e)))
    es.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    es.on('request', lambda r: r.url.split(':')[0] not in ('file', 'data', 'blob') and external.append(r.url))
    es.on('dialog', lambda d: d.accept())
    es.goto(APP)
    check('starts in English for an English browser', es.get_attribute('html', 'lang') == 'en' and es.inner_text('.topbar nav a[href="#plan"]') == 'Family plan')
    check('topbar language switch is reachable', es.locator('.lang-switch button[data-setlang="es"]').count() == 1)
    es.focus('.lang-switch button[data-setlang="es"]'); es.keyboard.press('Enter')
    check('html lang=es, title and nav in Spanish', es.get_attribute('html', 'lang') == 'es' and 'pruebas de detección' in es.title() and es.inner_text('.topbar nav a[href="#plan"]') == 'Plan familiar')
    check('switch shows pressed state', es.get_attribute('.lang-switch button[data-setlang="es"]', 'aria-pressed') == 'true' and es.get_attribute('.lang-switch button[data-setlang="en"]', 'aria-pressed') == 'false')
    check('hero, disclaimer, and form labels in Spanish', 'No puedes pedirles una colonoscopia' in es.inner_text('h1') and 'riesgo promedio' in es.inner_text('.disclaimer') and es.inner_text('#form-title') == 'Agregar a un familiar' and es.get_attribute('#f-label', 'placeholder') == 'Mamá')
    esLow = es.evaluate(CONTRAST_JS, 'main *, header *, footer *')
    check('no text below WCAG AA contrast on the page (Spanish)', not esLow, esLow[:5])
    check('intro cites the CDC screening statistic', '61%' in es.inner_text('.hero-stat') and es.get_attribute('.hero-stat a', 'href') == 'https://www.cdc.gov/nccdphp/priorities/colorectal-cancer.html')
    check('native-speaker review flagged at the top', 'pendiente de revisión por un hablante nativo' in es.inner_text('#review-note'))
    es.click('#save-btn')
    check('validation messages in Spanish', 'apodo' in es.inner_text('#form-error').lower())
    es.click('#demo-btn')
    plan = es.inner_text('#people')
    check('demo family has Spanish nicknames', all(n in plan for n in ['Mamá', 'Papá', 'Abuela', 'Hermana mayor']))
    badges = es.eval_on_selector_all('#people .badge', 'bs => bs.map(b => b.textContent)')
    check('plan topics, statuses, and guideline text in Spanish', 'Detección del cáncer de colon y recto' in plan and 'Hablar ahora' in badges and 'Para decidir' in badges and 'paquetes-año' in plan and 'Colon and rectal' not in plan, badges)
    check('ACS links say "(en inglés)" and each topic links a CDC Spanish page', es.locator('#people a.src-es[hreflang="es"]').count() >= 8 and 'Leer la guía de la ACS (en inglés)' in plan)
    check('summary in Spanish', 'personas en tu plan' in es.inner_text('#summary') and '1 de 4' in es.inner_text('#summary'))
    check('progress options in Spanish', es.locator('.person').nth(1).locator('select.progress-select option:checked').inner_text() == 'Ya lo hablamos')
    check('timeline legend + text alternative in Spanish', 'Edad actual' in es.inner_text('#legend') and 'Papá, 52 años' in es.inner_text('#timeline-text'))
    es.locator('.person').nth(1).locator('details.questions summary').click()
    check('questions list in Spanish', 'prueba del PSA' in es.locator('.person').nth(1).locator('details.questions').inner_text())
    check('USPSTF and cost notes in Spanish', es.locator('#people .us-chip.diff', has_text='Distinto de la ACS').count() >= 1 and 'cada 2 años' in plan and 'sin copago' in plan and 'USPSTF (en inglés)' in plan)
    check('Spanish cost link goes to CuidadoDeSalud.gov', es.locator('#people .cost-note a').first.get_attribute('href').startswith('https://www.cuidadodesalud.gov/es/'))
    check('Start-the-talk card button in Spanish', es.locator('.person').nth(1).locator('button.talk-with').inner_text() == 'Empezar la conversación con Papá')
    # Start the talk in Spanish
    es.select_option('#talk-who', index=1)
    msg = es.input_value('#talk-text')
    check('"Start the talk" message in Spanish', 'Papá' in msg and 'Sociedad Americana Contra el Cáncer' in msg and 'detección del cáncer de pulmón' in msg and es.get_attribute('#talk-text', 'lang') == 'es')
    es.select_option('#talk-tone', 'text')
    check('text-message tone in Spanish', es.input_value('#talk-text').startswith('Hola, Papá'))
    check('copy/share buttons in Spanish', es.inner_text('#copy-btn') == 'Copiar' and es.inner_text('#share-btn').startswith('Compartir'))
    # Printed checkup sheet in Spanish
    es.evaluate("() => { window.__printed = 0; window.print = function () { window.__printed++; }; }")
    es.locator('.person').nth(1).locator('button.sheet-btn').click()
    sheet = es.evaluate("document.getElementById('checkup-sheet').textContent")
    check('sheet button label + print call in Spanish', 'Hoja para el chequeo' in es.locator('.person').nth(1).locator('button.sheet-btn').inner_text() and es.evaluate('window.__printed') == 1)
    check('printed sheet: Spanish title, lang=es, Spanish topics', 'Hoja para el chequeo: Papá, 52 años' in sheet and es.get_attribute('#checkup-sheet', 'lang') == 'es' and 'Detección del cáncer de pulmón' in sheet and 'Decisión sobre la prueba del cáncer de próstata' in sheet)
    check('printed sheet: Spanish table headers, statuses, tests', all(x in sheet for x in ['Última prueba (fecha)', 'Resultado', 'Próxima fecha', 'La ACS lo recomienda ahora', 'Una opción para conversar', 'TC de baja dosis']))
    check('printed sheet: pack-years, questions, family history, footer in Spanish', all(x in sheet for x in ['unos 22 paquetes-año (1 paquete al día durante 22 años)', 'Preguntas para hacer', 'Antecedentes familiares para mencionar', 'Lo que dijo el proveedor', 'no es consejo médico']))
    check('printed sheet has no English left', not any(x in sheet for x in ['Checkup sheet', 'Last test', 'Screenings to bring up', 'Questions to ask', 'pack-years', 'Printed ']), sheet[:200])
    check('printed date uses Spanish month names', any(m in sheet for m in ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']))
    es.emulate_media(media='print')
    check('Spanish print shows only the sheet', es.is_visible('#checkup-sheet') and not es.is_visible('#plan'))
    es.emulate_media(media='screen')
    es.evaluate("window.dispatchEvent(new Event('afterprint'))")
    es.evaluate("window.dispatchEvent(new Event('beforeprint'))")
    check('family-plan print header in Spanish', 'Plan familiar de detección' in es.evaluate("document.querySelector('.print-head').textContent"))
    # Myth or Fact in Spanish, with a language switch mid-card
    check('game in Spanish', es.inner_text('#game-progress') == 'Tarjeta 1 de 12' and es.inner_text('#game-buttons .myth') .strip().endswith('Mito'))
    es.click('#game-buttons .fact')
    src = es.get_attribute('#game-src', 'href')
    check('reveal in Spanish with a Spanish NCI page or an ACS page marked "(en inglés)"', es.inner_text('#game-verdict').startswith(('¡Correcto!', 'No exactamente.')) and (src.startswith('https://www.cancer.gov/espanol/') or '(en inglés)' in es.inner_text('#game-src')), src)
    claim_es = es.inner_text('#game-claim')
    es.click('.lang-switch button[data-setlang="en"]')
    check('switching language keeps the same card and answer', es.is_visible('#game-reveal') and es.inner_text('#game-progress') == 'Card 1 of 12' and es.inner_text('#game-claim') != claim_es and es.inner_text('#game-verdict').startswith(('Correct!', 'Not quite.')))
    check('switching back to English restores English everywhere', es.get_attribute('html', 'lang') == 'en' and 'Colon and rectal cancer screening' in es.inner_text('#people') and es.inner_text('#form-title') == 'Add a family member')
    es.click('.lang-switch button[data-setlang="es"]')
    # Habits, help, footer, rehearsal
    check('habits in Spanish', 'Aléjate de todas las formas de tabaco.' in es.inner_text('#habit-list'))
    check('help resources in Spanish, linking Spanish pages', 'Servicio de Información de Cáncer' in es.inner_text('#resources') and es.locator('#resources a[hreflang="es"]').count() >= 3)
    check('footer (about/sources) in Spanish, citing CDC and NCI Spanish pages', 'pendiente de revisión por un hablante nativo' in es.inner_text('.footer') and es.locator('.footer a[href*="/es/"]').count() >= 5 and es.locator('.footer a[href*="/espanol/"]').count() >= 1)
    check('rehearsal follows the page language', es.get_attribute('#rh-card', 'lang') == 'es' and es.inner_text('#rh-start') == 'Empezar a practicar' and es.get_attribute('#rh-lang button[data-lang="es"]', 'aria-pressed') == 'true')
    es.click('#rh-lang button[data-lang="en"]')
    check('rehearsal language buttons switch the whole page', es.get_attribute('html', 'lang') == 'en' and es.inner_text('.topbar nav a[href="#plan"]') == 'Family plan')
    es.click('#rh-lang button[data-lang="es"]')
    es.reload()
    check('Spanish is remembered after reload', es.get_attribute('html', 'lang') == 'es' and es.inner_text('#form-title') == 'Agregar a un familiar' and 'Mamá' in es.inner_text('#people'))
    es.set_viewport_size({'width': 390, 'height': 844})
    es.wait_for_timeout(200)
    check('Spanish fits 390px (no horizontal scroll)', es.evaluate("document.documentElement.scrollWidth - window.innerWidth") <= 0, es.evaluate("document.documentElement.scrollWidth"))
    ctx2.close()
    ctx3 = browser.new_context(viewport={'width': 1280, 'height': 900})
    es3 = ctx3.new_page()
    es3.on('pageerror', lambda e: errors.append(str(e)))
    es3.goto(APP + '?lang=es')
    check('?lang=es link opens the app in Spanish', es3.get_attribute('html', 'lang') == 'es' and es3.inner_text('#game-progress') == 'Tarjeta 1 de 12')
    ctx3.close()

    # Message and checkup sheet in a different language than the app
    ctx4 = browser.new_context(viewport={'width': 1280, 'height': 900})
    dl = ctx4.new_page()
    dl.on('pageerror', lambda e: errors.append(str(e)))
    dl.on('dialog', lambda d: d.accept())
    dl.goto(APP + '?lang=en')
    dl.click('#demo-btn')
    dl.select_option('#talk-who', index=1)
    en_msg = dl.input_value('#talk-text')
    check('document language defaults to the app language', dl.input_value('#doc-lang') == 'auto' and 'American Cancer Society' in en_msg and dl.get_attribute('#talk-text', 'lang') == 'en')
    dl.select_option('#doc-lang', 'es')
    es_msg = dl.input_value('#talk-text')
    check('English app, Spanish message (lang=es, Spanish terms, still English UI)', 'Sociedad Americana Contra el Cáncer' in es_msg and dl.get_attribute('#talk-text', 'lang') == 'es' and dl.get_attribute('html', 'lang') == 'en' and dl.inner_text('#copy-btn') == 'Copy')
    dl.evaluate("() => { window.print = function () {}; }")
    dl.locator('.person').nth(1).locator('button.sheet-btn').click()
    sheet = dl.evaluate("document.getElementById('checkup-sheet').textContent")
    check('English app, Spanish printed sheet (lang=es, no English left)', dl.get_attribute('#checkup-sheet', 'lang') == 'es' and 'Hoja para el chequeo' in sheet and not any(x in sheet for x in ['Checkup sheet', 'Last test', 'Questions to ask', 'Printed ']), sheet[:160])
    check('plan on screen stays in English', 'Colon and rectal cancer screening' in dl.inner_text('#people'))
    dl.reload()
    dl.select_option('#talk-who', index=1)
    check('document language is remembered after reload', dl.input_value('#doc-lang') == 'es' and 'Sociedad Americana Contra el Cáncer' in dl.input_value('#talk-text'))
    dl.select_option('#doc-lang', 'auto')
    check('"Same as the app" returns the message to English', 'American Cancer Society' in dl.input_value('#talk-text') and dl.get_attribute('#talk-text', 'lang') == 'en')
    dl.select_option('#doc-lang', 'en')
    dl.click('[data-setlang="es"]')
    check('Spanish app, English message (document language wins)', dl.get_attribute('html', 'lang') == 'es' and 'American Cancer Society' in dl.input_value('#talk-text') and dl.get_attribute('#talk-text', 'lang') == 'en')
    low = dl.evaluate(CONTRAST_JS, 'main *, header *, footer *')
    check('no text below WCAG AA contrast with the document-language control (Spanish app)', not low, low[:5])
    dl.click('#clear-btn')
    check('clearing data resets the document language', dl.input_value('#doc-lang') == 'auto')
    dl.set_viewport_size({'width': 390, 'height': 844}); dl.wait_for_timeout(200)
    check('document-language control fits 390px', dl.evaluate("document.documentElement.scrollWidth - window.innerWidth") <= 0)
    ctx4.close()

    check('no console errors', not errors, errors)
    check('zero network requests', not external, external)
    browser.close()

print(f'\n{passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
