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

## Known limits

- US guidelines only (ACS). English only.
- People at higher than average risk are pointed to a provider, not given a plan.
- The content has not yet been reviewed by a clinician or health educator.
