/*
 * ScreenTalk content: conversation-starter templates, Myth-or-Fact cards, habits, resources.
 * Every fact card cites the page it came from (accessed Oct 10, 2026).
 */
(function (root) {
  'use strict';

  var NCI_MYTHS = 'https://www.cancer.gov/about-cancer/causes-prevention/risk/myths';
  var ACS_GUIDE = 'https://www.cancer.org/cancer/screening/american-cancer-society-guidelines-for-the-early-detection-of-cancer.html';
  var ACS_HPV = 'https://www.cancer.org/cancer/risk-prevention/hpv/acs-recommendations-for-hpv-vaccine-use.html';
  var ACS_HOW = 'https://www.cancer.org/cancer/screening/how-to-get-screened-for-cancer-if-you-dont-have-a-doctor.html';

  // ---------- Myth or Fact ----------
  var CARDS = [
    { claim: 'Cancer is contagious. You can catch it from someone who has it.', answer: 'myth',
      why: 'In general, no. Cancer does not spread person to person. Some viruses (like HPV) can spread and can sometimes lead to cancer, but the cancer itself is not contagious.', src: NCI_MYTHS, srcName: 'National Cancer Institute' },
    { claim: 'If nobody in my family has had cancer, I am risk-free.', answer: 'myth',
      why: 'About 39% of people will be diagnosed with cancer at some point in their lives. Most cancers come from genetic changes that happen during life, from aging and exposures like tobacco smoke.', src: NCI_MYTHS, srcName: 'National Cancer Institute' },
    { claim: 'Only about 5 to 10% of cancers are caused by harmful gene changes inherited from parents.', answer: 'fact',
      why: 'Right. The other 90 to 95% come from changes that happen during a person\u2019s lifetime. Family history still matters and is worth telling a doctor about.', src: NCI_MYTHS, srcName: 'National Cancer Institute' },
    { claim: 'Cell phones cause cancer.', answer: 'myth',
      why: 'Not according to the best studies so far. Cell phones give off low-frequency energy that does not damage genes.', src: NCI_MYTHS, srcName: 'National Cancer Institute' },
    { claim: 'Antiperspirants and deodorants cause breast cancer.', answer: 'myth',
      why: 'The best studies so far found no evidence linking the chemicals in antiperspirants and deodorants to changes in breast tissue.', src: NCI_MYTHS, srcName: 'National Cancer Institute' },
    { claim: 'Herbal products can cure cancer.', answer: 'myth',
      why: 'No herbal product has been shown to treat cancer, and some can interfere with chemotherapy or radiation. Patients should tell their doctor about any supplements.', src: NCI_MYTHS, srcName: 'National Cancer Institute' },
    { claim: 'A cancer diagnosis is a death sentence.', answer: 'myth',
      why: 'The chance of dying from cancer in the US has dropped steadily since the 1990s. Five-year survival for some cancers, like breast, prostate, and thyroid, is 90% or better.', src: NCI_MYTHS, srcName: 'National Cancer Institute' },
    { claim: 'Screening tests look for cancer before a person has any symptoms.', answer: 'fact',
      why: 'That is the point of screening: finding pre-cancers and cancers early, before they have a chance to spread.', src: ACS_GUIDE, srcName: 'American Cancer Society' },
    { claim: 'Colorectal cancer screening for people at average risk starts at age 50.', answer: 'myth',
      why: 'The American Cancer Society recommends starting at 45 for people at average risk.', src: ACS_GUIDE, srcName: 'American Cancer Society' },
    { claim: 'If you got the HPV vaccine, you never need cervical cancer screening.', answer: 'myth',
      why: 'People with a cervix still need regular screening after the vaccine, because it does not cover every HPV type that can cause cervical cancer.', src: ACS_HPV, srcName: 'American Cancer Society' },
    { claim: 'The HPV vaccine works best when given between ages 9 and 12.', answer: 'fact',
      why: 'ACS recommends 2 doses between 9 and 12, before most people are exposed to HPV. Teens and young adults through 26 who missed it should get it as soon as possible.', src: ACS_HPV, srcName: 'American Cancer Society' },
    { claim: 'Eating sugar makes cancer grow faster.', answer: 'myth',
      why: 'No studies show eating sugar makes cancer worse. But a high-sugar diet can lead to weight gain, and obesity is linked to a higher risk of several cancers.', src: NCI_MYTHS, srcName: 'National Cancer Institute' }
  ];

  // ---------- Habits (ACS "Take control of your health") ----------
  var HABITS = [
    'Stay away from all forms of tobacco.',
    'Get to and stay at a healthy weight.',
    'Get moving with regular physical activity.',
    'Eat healthy with plenty of fruits and vegetables.',
    'It\u2019s best not to drink alcohol.',
    'Protect your skin.',
    'Know yourself, your family history, and your risks.',
    'Get regular checkups and cancer screening tests.'
  ];

  // ---------- Resources ----------
  var RESOURCES = [
    { name: 'American Cancer Society 24/7 helpline', detail: '1-800-227-2345, any time of day or night', href: 'tel:18002272345' },
    { name: 'National Cancer Institute Cancer Information Service', detail: '1-800-4-CANCER (1-800-422-6237), plus live chat. Free and confidential.', href: 'https://www.cancer.gov/contact' },
    { name: 'How to get screened (even without a doctor)', detail: 'ACS guide to clinics, community health centers, and screening events', href: ACS_HOW },
    { name: 'Free or low-cost breast and cervical screening', detail: 'National Breast and Cervical Cancer Early Detection Program. CDC: 1-800-232-4636', href: 'https://www.cancer.org/cancer/financial-insurance-matters/understanding-health-insurance/nbccedp.html' },
    { name: 'Free vaccines for eligible kids and teens', detail: 'Vaccines for Children program (under 19), including the HPV vaccine. 1-800-232-4636', href: ACS_HPV },
    { name: 'Free help to quit tobacco', detail: 'ACS Empowered to Quit program, or call 1-800-227-2345', href: 'https://www.cancer.org/cancer/risk-prevention/tobacco/empowered-to-quit.html' }
  ];

  // ---------- Conversation starters ----------
  // Short, plain-language lines a teen can say or text. Picked by topic + tone.
  var TOPIC_PHRASES = {
    breast: 'breast cancer screening (mammograms)',
    colorectal: 'colon cancer screening',
    cervical: 'cervical cancer screening',
    lung: 'lung cancer screening',
    prostate: 'whether prostate cancer testing makes sense',
    hpv: 'the HPV vaccine'
  };

  function joinList(items) {
    if (items.length <= 1) return items.join('');
    if (items.length === 2) return items[0] + ' and ' + items[1];
    return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
  }

  function phrase(t) { return TOPIC_PHRASES[t.key] || t.title.toLowerCase(); }

  /**
   * Build a conversation starter for one person.
   * Only "Talk now" and "Discuss" topics are named as things to ask about. Awareness items
   * (endometrial) get their own gentle line; topics that do not apply as entered are left out.
   * tone: 'casual' | 'heartfelt' | 'text'
   */
  function starter(label, topics, tone) {
    topics = topics || [];
    var who = String(label || '').trim() || 'there';
    var ask = topics.filter(function (t) { return t.status === 'talk-now' || t.status === 'option'; });
    var endo = topics.some(function (t) { return t.key === 'endometrial'; });
    var endoLine = 'ACS also says it\u2019s good to know the signs of uterine cancer after menopause, like unexpected bleeding or spotting, and to tell a doctor about them.';

    if (!ask.length) {
      if (endo) {
        if (tone === 'text') return 'Hey ' + who + ' \u2764\ufe0f I\u2019ve been learning about cancer prevention. ' + endoLine + ' Just wanted you to know!';
        return who + ', I\u2019ve been learning about cancer prevention. ' + endoLine + ' Can we keep that in mind together?';
      }
      var next = topics.filter(function (t) { return t.status === 'upcoming'; })[0];
      if (!next) return 'Nothing in these ACS guidelines lines up for ' + who + ' right now. A regular checkup is still a great habit.';
      var when = next.startsIn === 1 ? 'next year' : 'in ' + next.startsIn + ' years';
      if (tone === 'text') return 'Hey ' + who + '! Fun fact from my cancer-prevention project: the American Cancer Society says ' + phrase(next) + ' comes up for you ' + when + '. Just putting it on your radar \u2764\ufe0f';
      return 'No screening conversation is due for ' + who + ' yet, but ' + phrase(next) + ' comes up ' + when + '. Worth a mention at the next checkup.';
    }
    var list = joinList(ask.map(phrase));
    var extra = endo ? ' ' + endoLine : '';
    if (tone === 'text') {
      return 'Hey ' + who + ', random question \ud83d\ude42 I\u2019ve been learning about cancer prevention, and the American Cancer Society says it\u2019s a good time for you to ask your doctor about ' + list + '.' + extra + ' Have you talked to them about it? I can help find an appointment if you want!';
    }
    if (tone === 'heartfelt') {
      return who + ', I\u2019ve been reading about how finding cancer early can make a real difference, and it made me think about you. The American Cancer Society guidelines say it\u2019s a good time for you to talk with your doctor about ' + list + '.' + extra + ' Would you be willing to bring it up at your next appointment? I\u2019d really like you around for a long time.';
    }
    return 'Hey ' + who + ', I learned something in a project: the American Cancer Society says it\u2019s a good time for you to ask your doctor about ' + list + '.' + extra + ' When\u2019s your next checkup? I can help you write down questions.';
  }

  // ---------- Questions to bring to a checkup ----------
  function questions(person, topics) {
    var out = [];
    (topics || []).forEach(function (t) {
      var s = t.status;
      if (t.key === 'breast' && s === 'option') out.push('Should I start yearly mammograms now, or wait until 45?');
      if (t.key === 'breast' && s === 'talk-now') out.push('When was my last mammogram, and when should the next one be?');
      if (t.key === 'colorectal' && s === 'talk-now') out.push('Which colorectal screening test fits me: a stool test I can do at home, or a colonoscopy?');
      if (t.key === 'colorectal' && s === 'option') out.push('At my age and health, should I keep getting colorectal screening?');
      if (t.key === 'cervical' && s === 'talk-now') out.push('Am I up to date on cervical screening, and is an HPV test right for me?');
      if (t.key === 'cervical' && s === 'option') out.push('Have my past cervical tests been normal enough to stop screening?');
      if (t.key === 'endometrial') out.push('What signs of uterine cancer should I watch for after menopause?');
      if (t.key === 'lung' && s === 'talk-now') out.push('Does a yearly low-dose CT scan for lung cancer make sense for me? What are the benefits and harms?');
      if (t.key === 'lung' && s === 'info') out.push('Can you help me work out my pack-years for lung screening?');
      if (t.key === 'lung' && t.extra) out.push('What help is available to quit smoking?');
      if (t.key === 'prostate' && s === 'option') out.push('What are the pros and cons of a PSA test for me?');
      if (t.key === 'hpv') out.push('Is my HPV vaccine series complete?');
    });
    if (person && person.familyHistory) out.push('With our family history, should my screening plan be different from the average-risk guidelines?');
    return out;
  }

  // ---------- Progress tracker ----------
  var PROGRESS = [
    { value: 'not-started', label: 'Not talked yet' },
    { value: 'talked', label: 'We talked about it' },
    { value: 'booked', label: 'Checkup booked' },
    { value: 'done', label: 'Up to date' }
  ];

  // ---------- Saved-data hygiene ----------
  function str(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, '').trim().slice(0, max); }
  function numStr(v, lo, hi) {
    if (v === '' || v == null) return '';
    var n = Number(v);
    return isFinite(n) && n >= lo && n <= hi ? String(n) : '';
  }
  /** Clean one saved person so bad or old localStorage data can never break the page. */
  function sanitizePerson(raw, packYearsFn) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var age = parseInt(raw.age, 10);
    var smoking = raw.smoking === 'never' || raw.smoking === 'former' || raw.smoking === 'current' ? raw.smoking : (raw.smokes ? 'current' : 'never');
    var fam = raw.prostateFamily === 'none' || raw.prostateFamily === 'one' || raw.prostateFamily === 'multiple' ? raw.prostateFamily : (raw.fatherBrotherProstateUnder65 ? 'one' : 'none');
    var p = {
      id: str(raw.id, 40) || 'p' + Math.random().toString(36).slice(2, 10),
      label: str(raw.label, 24) || 'Family member',
      age: age >= 0 && age <= 120 ? age : 0,
      breasts: !!raw.breasts, cervix: !!raw.cervix,
      uterus: typeof raw.uterus === 'boolean' ? raw.uterus : !!raw.cervix,
      prostate: !!raw.prostate, menopause: !!raw.menopause,
      smoking: smoking,
      ppd: numStr(raw.ppd, 0, 10), years: numStr(raw.years, 0, 120),
      africanAmerican: !!raw.africanAmerican, prostateFamily: fam,
      familyHistory: !!raw.familyHistory,
      progress: PROGRESS.some(function (x) { return x.value === raw.progress; }) ? raw.progress : 'not-started'
    };
    if (!p.uterus && !p.cervix) p.menopause = false;
    var py = packYearsFn ? packYearsFn(p.ppd, p.years) : 0;
    p.packYears = smoking === 'never' ? 0 : (py || (Number(raw.packYears) >= 0 && Number(raw.packYears) <= 400 ? Number(raw.packYears) : 0));
    return p;
  }

  // ---------- Calendar reminder (.ics), built on the device ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function icsDate(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }
  function icsStamp(d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z'; }
  function icsEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) {
    var out = [];
    while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); }
    out.push(line);
    return out.join('\r\n');
  }
  /** opts = { title, description, date (Date, all-day), now (Date), uid } */
  function buildICS(opts) {
    var day = opts.date, next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ScreenTalk//Family screening reminder//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + (opts.uid || 'screentalk') + '@screentalk.local',
      'DTSTAMP:' + icsStamp(opts.now || new Date()),
      'DTSTART;VALUE=DATE:' + icsDate(day),
      'DTEND;VALUE=DATE:' + icsDate(next),
      'SUMMARY:' + icsEscape(opts.title),
      'DESCRIPTION:' + icsEscape(opts.description || ''),
      'END:VEVENT', 'END:VCALENDAR'
    ];
    return lines.map(fold).join('\r\n') + '\r\n';
  }


  // ---------- One-page checkup sheet (printable) ----------
  var SHEET_STATUS = {
    'talk-now': 'ACS recommends now',
    'option': 'A choice to discuss',
    'info': 'Good to know',
    'upcoming': 'Coming up',
    'past': 'Past the ACS age range'
  };
  var SHEET_TESTS = {
    breast: 'Mammogram',
    colorectal: 'Stool test (FIT) or colonoscopy',
    cervical: 'HPV test or Pap test',
    lung: 'Low-dose CT scan',
    prostate: 'PSA blood test (if chosen)',
    hpv: 'HPV vaccine doses',
    endometrial: 'Any unexpected bleeding?'
  };
  /**
   * Data for a one-page sheet to bring to a checkup. Pure data, so it can be tested in Node.
   * rows   = topics to bring up now (talk-now, option, info), each with a fill-in "last test" row
   * later  = topics whose ACS window starts later, as "Breast cancer screening at 40"
   * smoking = a plain line with pack-years, since providers ask for it for lung screening
   */
  function checkupSheet(person, result) {
    person = person || {};
    result = result || { topics: [], notes: [] };
    var age = Number(person.age) || 0;
    var rows = [], later = [];
    (result.topics || []).forEach(function (t) {
      if (t.status === 'upcoming') {
        later.push(t.title + ' at ' + (age + (t.startsIn || 0)));
      } else if (t.status !== 'past') {
        rows.push({ key: t.key, title: t.title, status: t.status, statusLabel: SHEET_STATUS[t.status] || '', test: SHEET_TESTS[t.key] || '', summary: t.summary, source: t.source });
      }
    });
    var smoking = '';
    if (person.smoking === 'former' || person.smoking === 'current') {
      var py = Number(person.packYears) || 0;
      smoking = (person.smoking === 'current' ? 'Smokes now' : 'Used to smoke') +
        (py > 0 ? ' \u00b7 about ' + py + ' pack-years' + (person.ppd && person.years ? ' (' + person.ppd + ' pack' + (Number(person.ppd) === 1 ? '' : 's') + ' a day for ' + person.years + ' years)' : '') : ' \u00b7 pack-years not entered');
    }
    return {
      title: 'Checkup sheet: ' + (String(person.label || '').trim() || 'Family member') + ', age ' + age,
      rows: rows,
      later: later,
      questions: questions(person, result.topics),
      smoking: smoking,
      familyHistory: !!person.familyHistory,
      notes: (result.notes || []).slice(),
      footer: 'Made with ScreenTalk. General American Cancer Society guidelines for people at average risk with no symptoms. Education only, not medical advice. Anyone with symptoms should see a provider.'
    };
  }

  var api = { CARDS: CARDS, HABITS: HABITS, RESOURCES: RESOURCES, PROGRESS: PROGRESS, starter: starter, joinList: joinList, questions: questions, sanitizePerson: sanitizePerson, buildICS: buildICS, checkupSheet: checkupSheet, SHEET_STATUS: SHEET_STATUS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScreenTalkContent = api;
})(typeof window !== 'undefined' ? window : this);
