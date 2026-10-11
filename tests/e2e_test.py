"""End-to-end browser test for ScreenTalk (headless Chromium via Playwright).

Run:  pip install playwright && playwright install chromium
      python3 tests/e2e_test.py            # optional: CHROME_PATH=/path/to/chrome
Checks real user flows: empty states, form validation, add/edit/remove, progress that
survives a reload, conversation starters, the full Myth-or-Fact game, calendar reminder
download, clearing data, mobile layout, and that the page makes zero network requests.
"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = (ROOT / 'index.html').as_uri()
passed, failed = 0, 0


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

    check('no console errors', not errors, errors)
    check('zero network requests', not external, external)
    browser.close()

print(f'\n{passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
