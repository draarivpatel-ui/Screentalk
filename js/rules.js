/*
 * ScreenTalk rules engine
 * Turns a family member's basic profile into a list of American Cancer Society (ACS)
 * guideline topics to TALK ABOUT with a healthcare provider.
 *
 * This is education, not diagnosis. It never says someone "needs" a test and never
 * estimates anyone's cancer risk. Every topic links to the ACS page it summarizes.
 *
 * Sources (re-checked Oct 10, 2026):
 *  - ACS Guidelines for the Early Detection of Cancer (last revised May 27, 2026)
 *  - ACS breast cancer early detection recommendations (last revised Jul 23, 2026)
 *  - ACS colorectal cancer screening recommendations (last revised May 27, 2026)
 *  - ACS cervical cancer screening guidelines (last revised Dec 4, 2025)
 *  - ACS endometrial cancer early detection (last revised Feb 28, 2025)
 *  - ACS lung cancer early detection (last revised Jan 29, 2024)
 *  - ACS prostate cancer early detection recommendations (last revised Nov 22, 2023)
 *  - ACS HPV Vaccines (last revised Sep 3, 2026)
 *
 * Works in the browser (window.ScreenTalkRules) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  var SRC = {
    guidelines: 'https://www.cancer.org/cancer/screening/american-cancer-society-guidelines-for-the-early-detection-of-cancer.html',
    breast: 'https://www.cancer.org/cancer/types/breast-cancer/screening-tests-and-early-detection/american-cancer-society-recommendations-for-the-early-detection-of-breast-cancer.html',
    colorectal: 'https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/acs-recommendations.html',
    cervical: 'https://www.cancer.org/cancer/types/cervical-cancer/detection-diagnosis-staging/cervical-cancer-screening-guidelines.html',
    endometrial: 'https://www.cancer.org/cancer/types/endometrial-cancer/detection-diagnosis-staging/detection.html',
    lung: 'https://www.cancer.org/cancer/types/lung-cancer/detection-diagnosis-staging/detection.html',
    prostate: 'https://www.cancer.org/cancer/types/prostate-cancer/detection-diagnosis-staging/acs-recommendations.html',
    hpv: 'https://www.cancer.org/cancer/risk-prevention/hpv/acs-recommendations-for-hpv-vaccine-use.html',
    quit: 'https://www.cancer.org/cancer/risk-prevention/tobacco/empowered-to-quit.html'
  };

  // Status values, ordered by how soon a conversation makes sense.
  var STATUS = {
    TALK_NOW: 'talk-now',      // inside an ACS recommended screening window
    OPTION: 'option',          // ACS says it is a choice / shared decision
    UPCOMING: 'upcoming',      // window starts in the future
    INFO: 'info',              // awareness item, or guideline does not apply as entered
    PAST: 'past'               // outside the window on the older side
  };

  var STATUS_ORDER = [STATUS.TALK_NOW, STATUS.OPTION, STATUS.INFO, STATUS.UPCOMING, STATUS.PAST];

  function num(v) {
    if (v === '' || v === null || v === undefined || typeof v === 'boolean') return NaN;
    var n = Number(v);
    return isFinite(n) ? n : NaN;
  }

  /** pack-years = packs per day x years smoked (ACS definition). */
  function packYears(packsPerDay, years) {
    var p = num(packsPerDay), y = num(years);
    if (!(p >= 0) || !(y >= 0)) return 0;
    return Math.round(p * y * 10) / 10;
  }

  function inYears(n) {
    return n === 1 ? 'in 1 year' : 'in ' + n + ' years';
  }

  /** Smoking status: 'never' | 'former' | 'current'. Accepts the old boolean `smokes` field. */
  function smokingStatus(person) {
    var s = person.smoking;
    if (s === 'never' || s === 'former' || s === 'current') return s;
    return person.smokes ? 'current' : 'never';
  }

  /** Father/brother with prostate cancer before 65: 'none' | 'one' | 'multiple'. */
  function prostateFamily(person) {
    var f = person.prostateFamily;
    if (f === 'none' || f === 'one' || f === 'multiple') return f;
    return person.fatherBrotherProstateUnder65 ? 'one' : 'none';
  }

  /** Has a uterus. Older saved plans had one "cervix / uterus" box, so fall back to cervix. */
  function hasUterus(person) {
    return typeof person.uterus === 'boolean' ? person.uterus : !!person.cervix;
  }

  /** ACS age to start the prostate testing conversation. */
  function prostateStartAge(person) {
    var fam = prostateFamily(person);
    if (fam === 'multiple') return 40;
    if (person.africanAmerican || fam === 'one') return 45;
    return 50;
  }

  /**
   * person = {
   *   label: 'Mom', age: 47,
   *   breasts, cervix, uterus, prostate, menopause: bool,
   *   smoking: 'never' | 'former' | 'current', packYears: number,
   *   africanAmerican: bool, prostateFamily: 'none' | 'one' | 'multiple',
   *   familyHistory: bool (family history of cancer / known inherited condition)
   * }
   * returns { topics: [...], notes: [...], timeline: [...] }
   */
  function evaluate(person) {
    person = person || {};
    var age = Math.floor(num(person.age));
    var topics = [];
    var notes = [];
    var timeline = []; // bands for the visual timeline: {key,label,start,end,open}

    if (!(age >= 0 && age <= 120)) {
      return { topics: [], notes: ['Enter an age between 0 and 120.'], timeline: [] };
    }

    // ---- Breast cancer. ACS words this for "women"; we ask about breast tissue so the
    // plan fits everyone, and keep ACS's wording in the guideline text.
    if (person.breasts) {
      timeline.push({ key: 'breast', label: 'Breast', start: 40, end: 90, open: true, segments: [{ start: 40, end: 45, soft: true, ages: '40\u201344' }, { start: 45, end: 90, ages: '45+' }] });
      var b = { key: 'breast', title: 'Breast cancer screening', source: SRC.breast };
      if (age < 40) {
        b.status = STATUS.UPCOMING; b.startsIn = 40 - age;
        b.summary = 'ACS guidance starts at age 40 (' + inYears(40 - age) + ').';
        b.detail = 'Women ages 40 to 44 have the option to start yearly mammograms. Until then, ACS says to know how your breasts normally look and feel and report any changes to a healthcare provider right away.';
      } else if (age <= 44) {
        b.status = STATUS.OPTION;
        b.summary = 'ACS: women 40 to 44 have the option to start yearly mammograms.';
        b.detail = 'A good question for a provider: "Should I start yearly mammograms now or at 45?" ACS says all women should know the benefits, limits, and possible harms of screening.';
      } else if (age <= 54) {
        b.status = STATUS.TALK_NOW;
        b.summary = 'ACS: women 45 to 54 should get mammograms every year.';
        b.detail = 'Ask a provider when the last mammogram was and when the next one should be scheduled.';
      } else {
        b.status = STATUS.TALK_NOW;
        b.summary = 'ACS: women 55 and older can switch to mammograms every 2 years, or keep going every year.';
        b.detail = 'ACS says screening should continue as long as a woman is in good health and expected to live at least 10 more years. A provider can help choose the schedule.';
      }
      topics.push(b);
    }

    // ---- Colorectal cancer (everyone at average risk)
    timeline.push({ key: 'colorectal', label: 'Colorectal', start: 45, end: 85, segments: [{ start: 45, end: 76, ages: '45\u201375' }, { start: 76, end: 85, soft: true, ages: '76\u201385' }] });
    var c = { key: 'colorectal', title: 'Colon and rectal cancer screening', source: SRC.colorectal };
    if (age < 45) {
      c.status = STATUS.UPCOMING; c.startsIn = 45 - age;
      c.summary = 'ACS: people at average risk start regular screening at 45 (' + inYears(45 - age) + ').';
      c.detail = 'Options include a stool-based test, a visual exam like colonoscopy, or (not preferred) a blood-based test.';
    } else if (age <= 75) {
      c.status = STATUS.TALK_NOW;
      c.summary = 'ACS: people at average risk in good health should get regular colorectal screening from 45 through 75.';
      c.detail = 'Options: a stool-based test (yearly FIT or high-sensitivity gFOBT, or a stool DNA or RNA test every 3 years), colonoscopy every 10 years, or CT colonography or sigmoidoscopy every 5 years. Blood-based tests are not preferred and are only for people unwilling to do the others. Any abnormal result on a test other than colonoscopy needs a follow-up colonoscopy. ACS: "No matter which test you choose, the most important thing is to get screened."';
    } else if (age <= 85) {
      c.status = STATUS.OPTION;
      c.summary = 'ACS: for ages 76 through 85, talk with a provider about whether to keep screening.';
      c.detail = 'The choice depends on personal preferences, life expectancy, overall health, and past screening history.';
    } else {
      c.status = STATUS.PAST;
      c.summary = 'ACS: people over 85 should no longer get colorectal cancer screening.';
      c.detail = '';
    }
    topics.push(c);

    // ---- Cervical cancer
    if (person.cervix) {
      timeline.push({ key: 'cervical', label: 'Cervical', start: 25, end: 90, open: true, segments: [{ start: 25, end: 66, ages: '25\u201365' }, { start: 66, end: 90, soft: true, ages: '66+' }] });
      var cv = { key: 'cervical', title: 'Cervical cancer screening', source: SRC.cervical };
      if (age < 25) {
        cv.status = STATUS.UPCOMING; cv.startsIn = 25 - age;
        cv.summary = 'ACS: people with a cervix start screening at 25 (' + inYears(25 - age) + ').';
        cv.detail = 'Screening is still needed even after the HPV vaccine.';
      } else if (age <= 65) {
        cv.status = STATUS.TALK_NOW;
        cv.summary = 'ACS: screen from 25 until at least 65. Preferred: an HPV test collected by a provider every 5 years.';
        cv.detail = 'Other options: a self-collected HPV test every 3 years (FDA-approved kits, only through a provider), an HPV + Pap co-test every 5 years, or a Pap test alone every 3 years if HPV testing is not available. Screening is still needed after the HPV vaccine, in a long-term relationship, or after menopause.';
      } else {
        cv.status = STATUS.OPTION;
        cv.summary = 'ACS: at 65 or older, screening can stop if regular screening has been normal.';
        cv.detail = 'That means the last 2 HPV tests (or co-tests) or the last 3 Pap tests were normal. If no one is sure when the last screening was, ACS says to keep screening until there are 2 normal HPV tests or 3 normal Pap tests in a row. A provider can confirm.';
      }
      topics.push(cv);
    }

    // ---- Endometrial (uterine) cancer awareness at menopause
    if (hasUterus(person) && person.menopause) {
      topics.push({
        key: 'endometrial', title: 'Endometrial (uterine) cancer awareness', source: SRC.endometrial,
        status: STATUS.INFO,
        summary: 'ACS: at menopause, women should be told about the risks and symptoms of endometrial cancer.',
        detail: 'Report any unexpected vaginal bleeding, spotting, or discharge to a doctor. Some women, because of their history (for example, Lynch syndrome), may need to consider a yearly endometrial biopsy; a provider can advise.'
      });
    }

    // ---- Lung cancer (people who smoke or used to smoke)
    var smoking = smokingStatus(person);
    if (smoking !== 'never') {
      var py = num(person.packYears);
      var pyKnown = py > 0;
      if (!(py >= 0)) py = 0;
      var qualifiesPY = py >= 20;
      if (qualifiesPY) timeline.push({ key: 'lung', label: 'Lung', start: 50, end: 80, segments: [{ start: 50, end: 80, ages: '50\u201380' }] });
      var l = { key: 'lung', title: 'Lung cancer screening', source: SRC.lung };
      if (age >= 50 && age <= 80 && qualifiesPY) {
        l.status = STATUS.TALK_NOW;
        l.summary = 'ACS: yearly low-dose CT (LDCT) screening for people 50 to 80 who smoke or used to smoke and have at least a 20 pack-year history.';
        l.detail = 'ACS says to talk with a healthcare professional first about the purpose, benefits, limits, and possible harms of screening. Screening is not advised for people with serious health problems that would likely limit how long they live.';
      } else if (age < 50 && qualifiesPY) {
        l.status = STATUS.UPCOMING; l.startsIn = 50 - age;
        l.summary = 'ACS lung screening guidance starts at 50 for people with a 20+ pack-year history (' + inYears(50 - age) + ').';
        l.detail = smoking === 'current' ? 'The most helpful step right now is quitting. Free help is available.' : 'Quitting was a big step. Keep the smoking history handy for future checkups.';
      } else if (age > 80) {
        l.status = STATUS.PAST;
        l.summary = 'The ACS lung screening guideline covers ages 50 to 80.';
        l.detail = 'A provider can talk about what makes sense.';
      } else {
        l.status = STATUS.INFO;
        l.summary = pyKnown
          ? 'ACS lung screening is for ages 50 to 80 with at least a 20 pack-year history. The number entered is ' + py + ', so it does not apply as entered.'
          : 'ACS lung screening is for ages 50 to 80 with at least a 20 pack-year history. Add packs per day and years smoked to check.';
        l.detail = 'Not sure about the numbers? A provider can help work them out. Pack-years = packs per day x years smoked.';
      }
      if (smoking === 'current') {
        l.extra = 'ACS says people who still smoke should be offered help to quit.';
        l.extraLink = SRC.quit;
      }
      topics.push(l);
    }

    // ---- Prostate cancer (informed decision)
    if (person.prostate) {
      var start = prostateStartAge(person);
      timeline.push({ key: 'prostate', label: 'Prostate', start: start, end: 90, open: true, segments: [{ start: start, end: 90, soft: true, ages: start + '+' }] });
      var p = { key: 'prostate', title: 'Prostate cancer testing decision', source: SRC.prostate };
      var why = start === 40
        ? 'ACS moves this talk to 40 for men with more than one father or brother who had prostate cancer before 65.'
        : start === 45
          ? 'ACS moves this talk to 45 for African American men and men whose father or brother had prostate cancer before 65.'
          : 'ACS recommends men make an informed decision with a provider about whether to be tested.';
      if (age < start) {
        p.status = STATUS.UPCOMING; p.startsIn = start - age;
        p.summary = 'ACS: the talk about prostate testing starts at ' + start + ' (' + inYears(start - age) + ').';
        p.detail = why;
      } else {
        p.status = STATUS.OPTION;
        p.summary = 'ACS: men ' + start + '+ should talk with a provider about the pros and cons of PSA testing and decide together.';
        p.detail = (start === 50 ? '' : why + ' ') + 'If testing is chosen, it is a PSA blood test, sometimes with a rectal exam; how often depends on the PSA level. ACS says men expected to live less than 10 more years should not be offered screening.';
      }
      topics.push(p);
    }

    // ---- HPV vaccine (ages 9 through 26)
    if (age >= 9 && age <= 26) {
      var h = { key: 'hpv', title: 'HPV vaccine (helps prevent 6 types of cancer)', source: SRC.hpv, status: STATUS.TALK_NOW };
      if (age <= 12) {
        h.summary = 'ACS: girls and boys should get 2 doses of the HPV vaccine between ages 9 and 12.';
      } else {
        h.summary = 'ACS: teens and young adults 13 through 26 who are not vaccinated, or missed doses, should get the HPV vaccine as soon as possible.';
      }
      h.detail = 'Check vaccine records or ask a provider whether the series is complete. The Vaccines for Children program gives free vaccines to eligible kids and teens under 19.';
      topics.push(h);
    }

    // ---- Notes (person-specific only; the general average-risk note is shown once on the page)
    if (person.familyHistory) {
      var fh = 'Family history matters: ACS says some people, because of family history or an inherited condition, need a different screening plan (for example, starting earlier, testing more often, or adding tests). Bring the family history to a provider and ask whether the average-risk guidelines fit.';
      if (person.breasts) fh += ' For breast cancer, ACS says some women at high risk get a yearly breast MRI plus a mammogram, typically starting at 30.';
      notes.push(fh);
    }
    topics.sort(function (a, b2) {
      var d = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b2.status);
      if (d !== 0) return d;
      return (a.startsIn || 0) - (b2.startsIn || 0);
    });

    return { topics: topics, notes: notes, timeline: timeline };
  }

  /** Counts across the family: conversations to have now, and the soonest upcoming one. */
  function familySummary(people) {
    var talk = 0, upcoming = 0, soonest = null;
    (people || []).forEach(function (p) {
      evaluate(p).topics.forEach(function (t) {
        if (t.status === STATUS.TALK_NOW || t.status === STATUS.OPTION) talk++;
        if (t.status === STATUS.UPCOMING) {
          upcoming++;
          if (soonest === null || t.startsIn < soonest.years) soonest = { who: p.label, topic: t.title, years: t.startsIn };
        }
      });
    });
    return { talkCount: talk, upcomingCount: upcoming, soonest: soonest };
  }

  var api = {
    evaluate: evaluate, packYears: packYears, familySummary: familySummary,
    smokingStatus: smokingStatus, prostateFamily: prostateFamily, prostateStartAge: prostateStartAge, hasUterus: hasUterus,
    STATUS: STATUS, SOURCES: SRC
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScreenTalkRules = api;
})(typeof window !== 'undefined' ? window : this);
