# 💬 ScreenTalk

**Help your family get cancer screening on time, one conversation at a time.**

ScreenTalk is a free, private web app that helps teens turn the American Cancer Society (ACS) cancer screening guidelines into a simple plan for the adults they love, and then helps them start the conversation and follow through.

Built by Aariv Patel for the [2026 International CodeTheCure Hackathon](https://codethecure-hackathon-26.devpost.com/) · Track: **Prevention & Education**

**Live demo:** https://aariv.me/Screentalk/

> ⚠️ ScreenTalk is an educational tool. It shares general ACS guidelines for people at average risk with no symptoms. It does **not** diagnose, estimate anyone's cancer risk, or replace a healthcare provider.

---

## The problem

Screening tests can find some cancers early, before symptoms, when they are easier to treat. ACS publishes clear guidelines on who should talk with a provider about which test and when. But the adults those guidelines are written for often put off checkups. Teens learn about health at school and often look things up for their families, yet have no easy way to turn that knowledge into action at home.

## What ScreenTalk does

| Feature | What it does |
|---|---|
| **Family screening plan** | Add family members by nickname and age (no names, no accounts). For each person, ScreenTalk shows which ACS guideline topics apply, labeled **Talk now**, **Discuss** (a shared decision), **Coming up** (with years until it starts), or **Good to know**. Covers breast, colorectal, cervical, endometrial awareness, lung, prostate, and the HPV vaccine. |
| **Pack-year helper** | Packs per day × years smoked, the measure ACS uses for lung screening (ages 50 to 80, 20+ pack-years, smokes now or used to). |
| **Questions for the checkup** | Each person gets a short list of questions to ask a provider, based on their topics. |
| **Progress tracker** | Mark each person *Not talked yet → We talked → Checkup booked → Up to date*. The summary shows how many have moved forward. |
| **Calendar reminder** | One tap downloads a 2-week "check in with Mom" reminder (.ics), made on the device. |
| **Family timeline** | An SVG chart of each person's screening windows. Solid = ACS recommends it; lighter = a choice to discuss. ▼ marks their age today. Includes a text version for screen readers. |
| **Conversation starters** | A casual, heartfelt, or text-message opener naming the exact topics. Edit it so it sounds like you, then copy or share. Tips for awkward talks. |
| **Myth or Fact** | A 12-card game using claims from NCI's Common Cancer Myths page and ACS guidance, with an explanation and source for every answer. |
| **Habits** | The ACS "Take control of your health" steps as a checklist teens can commit to. |
| **Get help** | ACS 24/7 helpline, NCI Cancer Information Service, how to get screened without a doctor, NBCCEDP, Vaccines for Children, free quit-tobacco help. |
| **One-page checkup sheet** | Print a single sheet per person to take to the appointment: the ACS topics to bring up, blanks for last test date, result, and next due, the questions to ask with checkboxes, pack-years for lung screening, a family-history table, and lines for what the provider said. |
| **Print / save as PDF** | A clean printout of the whole family plan. |

## Responsible design

- **Education, not diagnosis.** The app never says someone "needs" a test and never calculates risk. Every item is framed as a topic to discuss with a healthcare provider. A unit test scans all generated text for diagnostic or risk-score language.
- **Every fact is sourced.** Each plan item links to the ACS page it summarizes. Every Myth-or-Fact card links to NCI or ACS. All content was re-checked against the live pages on October 10, 2026 (see table below).
- **Private by design.** No accounts, no server, no analytics, no cookies, no fonts or scripts from other sites. A Content-Security-Policy blocks network connections entirely, and the end-to-end test confirms the page makes zero network requests. Data stays in the browser's `localStorage`; "Clear all data" wipes it.
- **Inclusive.** Screenings are chosen by body (breast tissue, cervix, uterus, prostate) as well as Female/Male presets, while keeping ACS's own wording.
- **Accessible.** Keyboard-friendly, visible focus, labeled controls, live announcements, screen-reader text for the chart, WCAG AA color contrast, reduced-motion support, works at 360 px wide.

## How each guideline is applied

| Topic | Rule in ScreenTalk | ACS page (last revised) |
|---|---|---|
| Breast | 40–44 choice to start yearly mammograms; 45–54 yearly; 55+ every 2 years or yearly, while in good health with 10+ years' life expectancy | [Breast cancer early detection](https://www.cancer.org/cancer/types/breast-cancer/screening-tests-and-early-detection/american-cancer-society-recommendations-for-the-early-detection-of-breast-cancer.html) (Jul 23, 2026) |
| Colorectal | Average risk: start at 45, through 75; 76–85 discuss; over 85 stop. Stool, visual, and (not preferred) blood-based options with intervals | [Colorectal screening recommendations](https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/acs-recommendations.html) (May 27, 2026) |
| Cervical | Cervix: 25 to at least 65; primary HPV test every 5 years preferred; exit rules after 65 | [Cervical screening guidelines](https://www.cancer.org/cancer/types/cervical-cancer/detection-diagnosis-staging/cervical-cancer-screening-guidelines.html) (Dec 4, 2025) |
| Endometrial | Uterus + menopause: know the risks and symptoms; report unexpected bleeding | [Endometrial cancer early detection](https://www.cancer.org/cancer/types/endometrial-cancer/detection-diagnosis-staging/detection.html) (Feb 28, 2025) |
| Lung | 50–80, smokes now or used to, 20+ pack-years: yearly low-dose CT after a talk about benefits and harms; quit help for current smokers | [Lung cancer early detection](https://www.cancer.org/cancer/types/lung-cancer/detection-diagnosis-staging/detection.html) (Jan 29, 2024) |
| Prostate | Informed-decision talk at 50; 45 if African American or one father/brother diagnosed before 65; 40 if more than one | [Prostate early detection recommendations](https://www.cancer.org/cancer/types/prostate-cancer/detection-diagnosis-staging/acs-recommendations.html) (Nov 22, 2023) |
| HPV vaccine | 2 doses at 9–12; 13 through 26 not fully vaccinated: as soon as possible | [HPV vaccines](https://www.cancer.org/cancer/risk-prevention/hpv/acs-recommendations-for-hpv-vaccine-use.html) (Sep 3, 2026) |

Summary page: [ACS Guidelines for the Early Detection of Cancer](https://www.cancer.org/cancer/screening/american-cancer-society-guidelines-for-the-early-detection-of-cancer.html) (May 27, 2026). Myth or Fact: [NCI Common Cancer Myths and Misconceptions](https://www.cancer.gov/about-cancer/causes-prevention/risk/myths).

ScreenTalk is not affiliated with or endorsed by ACS or NCI. Guidelines are for the United States.

## Tech

- Plain HTML, CSS, and JavaScript. No framework, no build step, no paid APIs, no dependencies.
- `js/rules.js`: a pure, testable rules engine that maps a profile to ACS guideline topics and timeline segments (runs in the browser and in Node).
- `js/content.js`: conversation starters, checkup questions, Myth-or-Fact cards, habits, resources, saved-data cleaning, the .ics builder, and the checkup-sheet data.
- `js/app.js`: UI, `localStorage`, SVG timeline, game, progress tracker, checkup sheet.
- `tests/rules.test.js`: 28 zero-dependency Node tests covering every guideline boundary (for example colorectal 44/45/75/76/85/86, lung 19.9 vs 20 pack-years, prostate 40/45/50), every age 0–120, banned diagnostic language, saved-data cleaning, calendar files, and checkup-sheet data.
- `tests/e2e_test.py`: 58 browser checks with Playwright: validation, add/edit/remove, progress after reload, starters, copy, the whole game by keyboard, reminder download, the printable checkup sheet, clearing data, broken saved data, mobile layout, zero console errors, zero network requests.
- `docs/quality-log.md`: what each review round found and fixed.

```
screentalk/
├── index.html
├── css/styles.css
├── js/rules.js      # guideline engine
├── js/content.js    # starters, questions, myths, resources, helpers
├── js/app.js        # UI
├── tests/rules.test.js
├── tests/e2e_test.py
└── docs/quality-log.md
```

## Run it

Open `index.html` in any modern browser. That's it.

Unit tests (Node 18+):

```bash
node tests/rules.test.js
```

Browser tests (optional):

```bash
pip install playwright && playwright install chromium
python3 tests/e2e_test.py
```

### Deploy on GitHub Pages

Repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**. The site is served at `https://aariv.me/Screentalk/` (custom domain for `draarivpatel-ui.github.io`).

## Limits

- Covers the ACS average-risk guidelines in the US. People at higher risk are pointed to a provider rather than given a plan.
- English only.
- Not yet reviewed by a clinician or health educator.

## What's next

- Spanish and other languages, reviewed by native speakers (ACS publishes materials in many languages).
- Review of the content by a health educator or clinician.
- Running "ScreenTalk nights" with school health classes, libraries, and youth groups, and measuring how many families report a conversation or a booked checkup.

## License

MIT. See [LICENSE](LICENSE).
