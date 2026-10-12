# ScreenTalk review log

## Cycle 1 · Sat Oct 10 2026, 8:45-9:15 PM CT
- Strict-judge/real-user review: ACS rules verified against cancer.org (revised Dec 4, 2025), 63 unit tests and 121 browser checks green at start, 0 console errors, no overflow at 390 px, contrast fine.
- Shipped: "Write it in" control (message and printed checkup sheet in English or Spanish regardless of app language). 131 browser checks pass. See docs/quality-log.md Round 7.
- Ideas not done: installable offline PWA (would need to keep the zero-network-requests test valid), native-speaker review of Spanish (needs a human), clinician/health-educator review (needs a human).

## Cycle 2 · Sun Oct 11 2026, 8:49-9:08 AM CT
- Strict-judge review vs CodeTheCure rubric + teen-on-phone (390 px, EN/ES). ACS ages re-verified on cancer.org; USPSTF compared topic by topic.
- Shipped: USPSTF cross-check line with Same/Differs chip on every screening topic; HealthCare.gov no-copay line where it applies; "Start the talk with {name}" card button. 70 unit + 145 browser checks pass. See docs/quality-log.md Round 8.
- Ideas not done: add a "years since quitting" field so the lung status itself can follow the USPSTF rule; put the USPSTF and cost lines on the printed checkup sheet.

## Cycle (Oct 12 2026, 6:40 AM CT; code-level only, no Chromium in the sandbox)
- Source re-check: USPSTF cervical is still the Aug 21, 2018 final ("update in progress"); the Dec 2024 draft was never finalized. New since our last check: HRSA's Women's Preventive Services Guidelines (updated Jan 5, 2026; HHS release Jan 12, 2026) prefer primary HPV testing at 30-65, say self-collected HPV tests should be offered, and take effect for most plans in 2027.
- Shipped: the cervical card's detail (EN/ES, screen only, not on the printed sheet) now names the HRSA guideline and says the USPSTF has not finalized its update. +1 unit test (rules.test.js 44 incl. this). Browser suites not run (no Chromium); change is a text-only string on the screen card.
