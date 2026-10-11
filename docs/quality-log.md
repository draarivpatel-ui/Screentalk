# ScreenTalk quality log

How ScreenTalk was reviewed and improved before submission. Each round: review the app as a strict judge and as a real teen and parent, re-check every medical claim against the live ACS and NCI pages, fix the top problems, then run the unit tests, the browser end-to-end tests, and a headless visual and accessibility check on desktop (1280 px) and mobile (360 to 390 px).

All guideline pages were re-read on **October 10, 2026**.

## Round 1: accuracy and broken edges

| # | Problem found | Fix |
|---|---|---|
| 1 | Prostate: ACS starts the testing talk at **40** for men with more than one father or brother diagnosed before 65. The app only knew 45 and 50. | "Father or brother with prostate cancer before 65" is now None / One / More than one, and the rules use 50, 45, or 40. |
| 2 | One checkbox for "cervix / uterus". ACS treats them differently: after a partial hysterectomy the cervix stays (cervical screening continues), and endometrial awareness is about the uterus. | Separate "Has a cervix" and "Has a uterus". Endometrial needs a uterus + menopause. Form hint explains the ACS total-hysterectomy rule. |
| 3 | Conversation starter told people with fewer than 20 pack-years it was "a good time to ask about lung cancer screening", which ACS does not recommend for them. | Starters only name "Talk now" and "Discuss" topics. Test added. |
| 4 | Quit-smoking help was shown to people who had already quit; ACS aims it at people who still smoke. | Smoking is now Never / Used to / Smokes now. Quit help only for current smokers. |
| 5 | Lung said "the number entered is 0" when pack-years were simply left blank. | Asks for packs per day and years instead. |
| 6 | Missing ACS details: colorectal test intervals, cervical "keep screening if you're not sure when your last test was", lung "not for people with serious health problems", prostate "not if life expectancy is under 10 years", breast MRI for high-risk women. | Added, each worded from the ACS page. |
| 7 | Timeline: the age dot covered band labels, long nicknames ran into the bars, and the lung band showed even when the criteria were not met. | Redrew the timeline with a label column, a ▼ age marker, name truncation, and lung only when eligible. |
| 8 | No navigation on phones (the menu was hidden under 900 px). | Scrollable nav bar on mobile. |
| 9 | Empty states: Copy and Share copied placeholder text; Print printed a blank plan. | Disabled until someone is added. |
| 10 | Browser validation bubbles hid the app's own error messages; invalid fields were not focused. | Custom messages, `aria-invalid`, focus moves to the field. Years smoked can't exceed age. |
| 11 | Corrupt or old saved data could break the page. | `sanitizePerson` cleans every saved record; old fields are migrated. |
| 12 | Privacy was only a claim. | Content-Security-Policy blocks all network connections; `no-referrer`; tests confirm zero network requests. |
| 13 | Behavior impact stopped at a message. | Per-person progress tracker (Not talked yet → Up to date), "Questions to bring to the next checkup", and a 2-week calendar reminder (.ics) made on the device. |

## Round 2: accessibility and clarity

| # | Problem found | Fix |
|---|---|---|
| 1 | The timeline implied everything was a firm recommendation. ACS calls breast 40 to 44, colorectal 76 to 85, cervical after 65, and prostate a choice. | Solid bar = ACS recommends; lighter bar = a choice to discuss. Legend and screen-reader text say which. |
| 2 | Timeline had no real text alternative. | Screen-reader list describes every person's bands in words. |
| 3 | Sticky header covered section titles after clicking the nav. | `scroll-margin-top`. |
| 4 | Motion for users who ask for less. | `prefers-reduced-motion` support. |
| 5 | Removing a person while editing them left a stale form. | Form resets. |
| 6 | Status badge colors could drop out when printed. | `print-color-adjust: exact`. Print view checked. |
| 7 | The general "average risk, no symptoms" note repeated on every card. | Shown once above the plan. |

## Round 3: engagement and polish

| # | Problem found | Fix |
|---|---|---|
| 1 | The conversation starter could not be personalized. | It is now an editable message box; Copy and Share use the edited text. |
| 2 | Habits footnote mixed sources. | Cites ACS "Take control of your health" and the ACS HPV page separately. |
| 3 | Timeline intro was long. | Shortened; legend carries the details. |
| 4 | Mobile nav cut off with no hint that it scrolls. | Fade at the edge. |

A fresh review after round 3 found no significant issues. Automated checks at the end: 0 console errors, 0 network requests, 0 contrast failures (WCAG AA), 0 unlabeled controls, no horizontal scroll at 360 px.

## Round 4: live-site check and a checkup sheet

The live site (https://aariv.me/Screentalk/) was loaded in headless Chromium at 1280 px and 375 px: 0 console errors, 0 failed requests, all in-page anchors resolve, all 15 ACS/NCI/Devpost links return 200, no horizontal scroll.

| # | Problem found | Fix |
|---|---|---|
| 1 | Printing with Ctrl+P (not the button) left the date blank in the print header ("plan · · Bring this…"). | The date is filled on `beforeprint`, so every print path gets it. |
| 2 | Each person card refused to split across pages, so page 1 printed nearly empty and the demo family took 9 pages. | Cards can split; single topics, questions, and notes stay whole. Demo family now prints in 7 pages with no blank first page. |
| 3 | The family printout is long and has no room to write. Not something you hand a nurse. | New **Checkup sheet** button on every person: a one-page sheet with the ACS topics to bring up, blanks for last test date, result, and next due, the questions with checkboxes, pack-years, a family-history table, and lines for what the provider said. Fits one Letter page for each demo person; the longest possible profile (5 topics, 7 questions) runs onto a second page with each section kept whole. |
| 4 | README still pointed at the old github.io URL "after GitHub Pages is turned on". | Points at the live site. |

Tests: 28 unit tests (new: checkup-sheet data) and 58 browser tests (new: sheet button, print-only-the-sheet, afterprint reset, Ctrl+P date).

## Round 5: rehearse the talk (October 10, 2026)

Judging for this track rewards behavioural impact and engagement. A message template helps a teen start, but most talks stall at the first "I feel fine." New feature: **Rehearse the talk**.

| # | Decision | Why |
|---|---|---|
| 1 | Five scripted pushbacks (feel fine, no family history, scared of a colonoscopy, too expensive, no time), three replies each (strong, okay, weak). | These are the objections the prompt named; scripted lines keep every medical statement checkable. No AI, no network. |
| 2 | Real branching: an openness meter (starts at 50; strong +20, okay 0, weak -15). Below 50 the next pushback opens guarded ("I don't need this"). The ending depends on openness: agrees to a next step, "let me think," or "drop this." | So choices have consequences beyond a score. |
| 3 | Every tip cites the page it comes from: CDC (symptoms, colorectal screening, breast screening and NBCCEDP), ACS (risk factors, screening tests, insurance coverage, how to get screened), NCI (common myths). Each was re-read live on Oct 10, 2026. A unit test fails if any tip lacks an ACS/NCI/CDC https source. | Factual Accuracy is scored. |
| 4 | Checked wording against sources: "polyps and colorectal cancer don't always cause symptoms" (CDC); "most colorectal cancers are found in people without a family history" (ACS); "only about 5 to 10% of cancers" inherited (NCI); "the most important thing is to get screened, no matter which test" and sedation is usually used for colonoscopy (ACS); ACA requires no co-pays or deductibles for recommended colorectal tests, ask the insurer about follow-up costs (ACS); colorectal tests covered by most insurance without a deductible or co-pay, free or low-cost mammograms via NBCCEDP (CDC); some facilities allow self-referral for mammograms (ACS). | No claim goes further than its source. Lines spoken to a parent avoid "you need" and risk numbers. |
| 5 | English and Spanish, switchable mid-rehearsal without losing progress; the card gets `lang="es"`. Spanish replies avoid gendered words where the parent could be Mom or Dad. Sources are marked "(en inglés)" because the linked pages are in English. | Many teens translate health information for their parents. |
| 6 | Keyboard: Tab/Enter or keys 1 to 3; focus moves to Next after each answer and to the result heading at the end; the verdict, the parent's reaction, and the tip are announced in the live region. Mobile: answer buttons at least 44 px tall, no horizontal scroll at 390 px. | Accessibility is part of the design score. |
| 7 | Feedback at the end: score out of 10 (9 to 10 ready, 6 to 8 almost, 0 to 5 keep practicing), the parent's final line, and for each round either what worked or a better line to try, with its tip and sources. Links to "Start the talk" to write the real message. | Turns practice into the real conversation. |

Tests: 17 new unit tests (`tests/rehearse.test.js`, also run by `tests/rules.test.js`) and 22 new browser checks (80 total). Visual check at 1280 px and 390 px.

Live check after deploy (https://aariv.me/Screentalk/, headless Chromium at 1280 px and 390 px): deployed files match the repo byte for byte; full rehearsal played by keyboard, switched to Spanish mid-run, reached the score screen; 0 console errors, 0 failed requests, no horizontal scroll. All five ACS/NCI rehearsal source links return 200; the three CDC links were read live the same day (CDC blocks scripted link checkers, so they return 403 to curl).

## Round 6: the whole app in Spanish (October 10, 2026)

The rehearsal was bilingual but everything around it was English. Many teens translate health information for their parents, so the rest of the app now follows one language switch.

| # | Decision | Why |
|---|---|---|
| 1 | One page language, set from a switch in the top bar, the rehearsal's own buttons, or `?lang=es`; remembered in `localStorage`. Switching re-renders everything in place: people, progress, habits, and the current Myth-or-Fact card and answer are kept. | Reuses the rehearsal's pattern (`STRINGS[lang][key]`, `{placeholders}`) in a new `js/i18n.js`; `rules.js` and `content.js` take a language argument. |
| 2 | Translated: the screening finder (form, validation, guideline text for every topic and age, statuses, timeline and its text version, summary), "Start the talk" (all tones), the printed checkup sheet (with `lang="es"` and Spanish dates), Myth or Fact, habits, help, and the about/sources footer. | The whole flow a family would use. |
| 3 | Neutral Latin American Spanish; medical terms match the CDC and NCI Spanish pages (pruebas de detección, mamografía, colonoscopia, prueba inmunoquímica fecal, cuello uterino, prueba del VPH, Papanicoláu, TC de baja dosis, paquetes-año, antígeno prostático específico, tacto rectal). Table with sources in `docs/glossary-es.md`. A test fails on off-glossary variants (Papanicolaou, mamograma, colonoscopía, HPV, cáncer de seno, paquete-años). | Factual accuracy has to survive translation. |
| 4 | Guideline text still cites the English ACS pages, marked "(en inglés)"; every topic adds an "En español: CDC" link, and the plan note says CDC follows the USPSTF so some ages differ. NCI myth cards link the NCI Spanish myths page; the lifetime-risk card says "cerca de 4 de cada 10" because the NCI Spanish page says 38% and the English page 39%. Help links go to the NCI, ACS, and CDC Spanish pages (NCI line and chat in Spanish and English; ACS helpline in English and Spanish). | No claim goes further than its source in either language. |
| 5 | A native-speaker review is pending, and the app says so at the top (in both languages) and in the footer. | Honest about what hasn't been checked. |
| 6 | Fixed a WCAG failure: disabled dependent fields (pack-year inputs, menopause, prostate questions) were dimmed with `opacity: .45`, which put the pack-year hint and labels at 1.96:1. Now only the controls are dimmed; text stays at least 4.5:1. A new browser check measures contrast of every visible text element (ancestor opacity included) in English and Spanish, and fails on the old CSS. | Accessibility is scored. |
| 7 | The intro now cites one number: in 2022 only 61% of U.S. adults ages 45 to 75 were up to date with colorectal screening, so about 4 in 10 were behind ([CDC](https://www.cdc.gov/nccdphp/priorities/colorectal-cancer.html), read Oct 10, 2026). | Shows why the conversation matters. |

Tests: 17 new unit tests (`tests/i18n.test.js`: same keys, placeholders, and array lengths in English and Spanish for the UI, rules, content, and rehearsal; every `data-i18n` key in the HTML exists in both; Spanish plan matches English topics, statuses, and ages at every age 0 to 120; Spanish numbers, terms, starters, questions, and checkup sheet), 41 new browser checks (121 total: the Spanish flow end to end, the printed sheet in Spanish in print mode, contrast in both languages, `?lang=es`, Spanish at 390 px). The Spanish checkup sheet prints on one Letter page for each demo family member.

## Known limits

- US guidelines only (ACS). The whole app is in English and Spanish; the Spanish has not yet been reviewed by a native speaker. The ACS guideline pages it summarizes are in English (CDC Spanish pages are linked for reading).
- Rehearsal replies are scripted. Real parents will say other things; the tips are about how to respond, not a script to recite.
- People at higher than average risk are pointed to a provider, not given a plan.
- The content has not yet been reviewed by a clinician or health educator.

## Round 7: message and checkup sheet in the parent's language (October 10, 2026, evening)

Strict-judge review of the live app (desktop and 390 px, English and Spanish, demo family): ACS content re-read against cancer.org "Screening Guidelines by Age" (last revised Dec 4, 2025): breast 40-44 choice / 45-54 yearly / 55+ every 2 years or yearly, colorectal 45-75 and 76-85 discuss, cervical 25-65 with the HPV-first options and the 65+ exit rule, lung 50-80 and 20 pack-years, prostate 40/45/50 tiers and the 10-year life expectancy note all still match. No contrast, overflow, or console problems. The one real gap: the app has a single language, but in many families the teen and the parent read different languages, so the paper that goes to the parent was in the wrong one.

| # | Decision | Why |
|---|---|---|
| 1 | New "Write it in" control in Start the talk: Same as the app / English / Español. It sets the language of the conversation starter and of the printed checkup sheet (title, topics, questions, table headings, dates, `lang` attribute). The rest of the app keeps the app language. Remembered on the device; "Clear my data" resets it. | A teen who uses the app in English can hand a Spanish-reading parent a Spanish sheet, without flipping the whole UI. |
| 2 | Same guideline logic in both languages (the sheet is built from `evaluate(person, lang)`), so wording stays checked by the existing English/Spanish parity tests. | No new medical text; no new claim. |

Tests: 131 browser checks (10 new: default follows the app, English app with Spanish message and sheet, plan stays English, remembered after reload, back to "Same as the app", Spanish app with English message, contrast, reset on clear, 390 px) and all 63 unit tests pass.

## Round 8: USPSTF cross-check, cost, and a shortcut to the talk (October 11, 2026)

Strict-judge review against the CodeTheCure rubric (prelim: pain point 3, prototype 10, feasibility 4, category 3; final: factual accuracy 5, engagement 6, behavioural impact 4, innovation 5, presentation 5), and as a teen on a 390 px phone getting ready to talk with a parent, in English and Spanish, with the demo family.

Medical accuracy: every ACS age in the app was re-read against cancer.org on Oct 11, 2026 (Guidelines for the Early Detection of Cancer, rev. May 27, 2026; breast, rev. Jul 23, 2026) and still matches. Then each topic was compared with the current USPSTF recommendations (uspreventiveservicestaskforce.org): breast every 2 years 40 to 74 (final Apr 30, 2024; insufficient evidence 75+); colorectal 45 to 75, selectively 76 to 85 (2021); cervical Pap every 3 years 21 to 29, then Pap/HPV/co-test 30 to 65 (final Aug 21, 2018, update in progress with a Dec 2024 draft); lung 50 to 80 with 20 pack-years and smoking now or quit within 15 years (2021); prostate individual decision 55 to 69 and against routine PSA at 70+ (final May 8, 2018, update in progress). The real gap: the app showed only ACS, so a parent whose doctor says "every 2 years" or "you quit 20 years ago, so no lung scan" would think the teen had it wrong.

| # | Decision | Why |
|---|---|---|
| 1 | Every screening topic now shows a USPSTF line with a "Same as ACS" / "Differs from ACS" chip and a link to the USPSTF page (EN and ES). Differs: breast under 55 and 75+, cervical 21 to 29, lung for people who used to smoke (adds the 15-years-since-quitting rule), prostate under 55 and 70+. No USPSTF line for endometrial awareness or the HPV vaccine (no USPSTF screening recommendation). | Factual accuracy: the two main U.S. guidelines side by side, honestly flagged where they differ, so the teen walks in prepared for what the doctor may say. |
| 2 | A no-copay line on breast (40+), colorectal (45 to 75), cervical (21 to 65), and lung (50 to 80, 20+ pack-years) topics, citing HealthCare.gov (CuidadoDeSalud.gov in Spanish) and saying $0 is not guaranteed. Prostate PSA is not on the list, so no line. | "Too expensive" is one of the five pushbacks in the rehearsal; now the plan itself answers it, with the official source. |
| 3 | "Start the talk with {name}" button on each person card: picks that person in Start the talk, jumps there instantly, and focuses the message (44 px tall). | On a phone the talk section was about 4,000 to 9,000 px below a card; the next step should be one tap from the plan. |

Tests: 70 unit tests (7 new: USPSTF flags at every boundary, the lung quit rule, no USPSTF for endometrial/HPV, no-copay ranges, English/Spanish parity of flags at ages 0 to 100) and 145 browser checks (14 new: notes, chips, links, contrast, the card button at 360 px, Spanish wording and links) pass.

## Round 9: years since quitting (October 11, 2026, midday)

The lung card only explained the USPSTF rule ("stops once someone has not smoked for 15 years") for people who used to smoke. ACS lung page re-read on cancer.org (last revised Jan 29, 2024): "smoke or used to smoke" and 20+ pack-years, with no years-since-quit cutoff, so the ACS wording stays as is. USPSTF (2021): "currently smoke or have quit within the past 15 years"; HealthCare.gov lists lung screening for people who "have quit in the past 15 years".

| # | Decision | Why |
|---|---|---|
| 1 | Optional "Years since quitting" field, enabled only for "Used to smoke" (EN and ES), with a hint that USPSTF stops at 15 years and ACS has no such limit. Validation: years since quitting plus years smoked can't be more than their age. | The card can now answer the question instead of telling the teen to ask. |
| 2 | Quit 15 years or fewer: USPSTF line says it still recommends screening (chip "Same as ACS") and the no-copay line says it applies. More than 15: chip "Differs from ACS", the USPSTF line says it no longer recommends it and the no-copay rule does not apply, and the no-copay line and sheet tag are removed. Blank: the old explanation stays. ACS summary unchanged in every case. | Honest about both guidelines and about cost. |
| 3 | Printed sheet adds "quit N years ago" to the smoking line and the right no-copay tail; still one Letter page in English and Spanish. Saved-data cleaning keeps the value only for former smokers, as a number from 0 to 120 that fits within their age. | Same answer on paper as on screen; old or bad saved data can't break it. |

Tests: 76 unit tests (4 new: 15 years, 16 years, blank or ignored, sheet and cleaning) and 176 browser checks (20 new) pass.
