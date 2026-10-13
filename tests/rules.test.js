// Run with: node tests/rules.test.js
// Checks the rules engine and content helpers against the ACS guideline boundaries they summarize.
const assert = require('node:assert/strict');
const R = require('../js/rules.js');
const C = require('../js/content.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}
const topic = (p, key) => R.evaluate(p).topics.find(t => t.key === key);
const F = (age, extra = {}) => ({ label: 'F', age, breasts: true, cervix: true, uterus: true, ...extra });
const M = (age, extra = {}) => ({ label: 'M', age, prostate: true, ...extra });
const smoker = (status, py) => ({ smoking: status, packYears: py });

console.log('ScreenTalk rules');

test('USPSTF cross-check: breast every 2 yrs 40-74; differs from ACS under 55 and at 75+', () => {
  [39, 40, 44, 45, 54, 75, 90].forEach(a => assert.equal(topic(F(a), 'breast').uspstf.differs, true, 'age ' + a));
  [55, 60, 74].forEach(a => assert.equal(topic(F(a), 'breast').uspstf.differs, false, 'age ' + a));
  assert.match(topic(F(46), 'breast').uspstf.text, /every 2 years for women 40 to 74/);
  assert.equal(topic(F(46), 'breast').uspstf.source, 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening');
});

test('USPSTF cross-check: colorectal same ages as ACS; cervical differs only 21-29', () => {
  [30, 45, 75, 80, 90].forEach(a => assert.equal(topic(F(a), 'colorectal').uspstf.differs, false));
  assert.match(topic(F(50), 'colorectal').uspstf.text, /45 to 75/);
  [20, 30, 50, 65, 70].forEach(a => assert.equal(topic(F(a), 'cervical').uspstf.differs, false, 'age ' + a));
  [21, 25, 29].forEach(a => assert.equal(topic(F(a), 'cervical').uspstf.differs, true, 'age ' + a));
  assert.match(topic(F(25), 'cervical').uspstf.text, /Pap test every 3 years from 21 to 29/);
});

test('USPSTF cross-check: lung adds the 15-years-since-quitting rule for former smokers only', () => {
  const f = topic(M(60, smoker('former', 30)), 'lung').uspstf;
  assert.equal(f.differs, true); assert.match(f.text, /quit within the past 15 years/); assert.match(f.text, /year they quit matters/);
  const c = topic(M(60, smoker('current', 30)), 'lung').uspstf;
  assert.equal(c.differs, false); assert.ok(!/year they quit matters/.test(c.text));
});

test('USPSTF cross-check: prostate is an individual choice 55-69; differs before 55 and from 70', () => {
  [50, 54, 70, 80].forEach(a => assert.equal(topic(M(a), 'prostate').uspstf.differs, true, 'age ' + a));
  [55, 62, 69].forEach(a => assert.equal(topic(M(a), 'prostate').uspstf.differs, false, 'age ' + a));
  assert.match(topic(M(60), 'prostate').uspstf.text, /55 to 69.*70 and older/);
});

test('no USPSTF note for endometrial awareness or the HPV vaccine (no USPSTF screening rec)', () => {
  assert.equal(topic(F(55, { menopause: true }), 'endometrial').uspstf, undefined);
  assert.equal(topic(F(15), 'hpv').uspstf, undefined);
});

test('no-copay note only inside the HealthCare.gov ranges (breast 40+, colorectal 45-75, cervical 21-65, lung 50-80 with 20+ pack-years)', () => {
  assert.equal(topic(F(39), 'breast').cost, undefined); assert.ok(topic(F(40), 'breast').cost);
  assert.equal(topic(F(44), 'colorectal').cost, undefined); assert.ok(topic(F(45), 'colorectal').cost); assert.ok(topic(F(75), 'colorectal').cost); assert.equal(topic(F(76), 'colorectal').cost, undefined);
  assert.equal(topic(F(20), 'cervical').cost, undefined); assert.ok(topic(F(21), 'cervical').cost); assert.ok(topic(F(65), 'cervical').cost); assert.equal(topic(F(66), 'cervical').cost, undefined);
  assert.ok(topic(M(55, smoker('current', 20)), 'lung').cost); assert.equal(topic(M(55, smoker('current', 19)), 'lung').cost, undefined);
  assert.equal(topic(M(81, smoker('current', 40)), 'lung').cost, undefined);
  assert.match(topic(M(55, smoker('former', 25)), 'lung').cost.text, /quit in the past 15 years/);
  assert.equal(topic(M(60), 'prostate').cost, undefined);
  assert.match(topic(F(50), 'colorectal').cost.text, /no copay or deductible.*in-network.*not guaranteed/);
  assert.match(topic(F(50), 'colorectal').cost.source, /^https:\/\/www\.healthcare\.gov\/preventive-care-adults\/$/);
  assert.match(topic(F(50), 'breast').cost.source, /^https:\/\/www\.healthcare\.gov\/preventive-care-women\/$/);
});

test('USPSTF and cost notes: Spanish has the same flags at every age, with Spanish wording', () => {
  for (let a = 0; a <= 100; a++) {
    [F(a), M(a, smoker('former', 25))].forEach(p => {
      const en = R.evaluate(p, 'en').topics, es = R.evaluate(p, 'es').topics;
      en.forEach((t, i) => {
        assert.equal(!!t.uspstf, !!es[i].uspstf); assert.equal(!!t.cost, !!es[i].cost);
        if (t.uspstf) assert.equal(t.uspstf.differs, es[i].uspstf.differs);
      });
    });
  }
  assert.match(topic(F(50), 'breast').uspstf.text, /^USPSTF/);
  assert.match(R.evaluate(F(50), 'es').topics.find(t => t.key === 'breast').uspstf.text, /cada 2 años/);
  assert.match(R.evaluate(F(50), 'es').topics.find(t => t.key === 'colorectal').cost.text, /sin copago/);
});

test('pack-years = packs/day x years (ACS examples: 1x20 and 2x10 = 20)', () => {
  assert.equal(R.packYears(1, 20), 20);
  assert.equal(R.packYears(2, 10), 20);
  assert.equal(R.packYears(0.5, 15), 7.5);
  assert.equal(R.packYears('', ''), 0);
  assert.equal(R.packYears(-1, 5), 0);
  assert.equal(R.packYears('abc', 5), 0);
});

test('breast: 39 upcoming, 40-44 option, 45-54 yearly, 55+ every 2 yrs or yearly', () => {
  assert.equal(topic(F(39), 'breast').status, 'upcoming');
  assert.equal(topic(F(39), 'breast').startsIn, 1);
  assert.equal(topic(F(40), 'breast').status, 'option');
  assert.equal(topic(F(44), 'breast').status, 'option');
  assert.equal(topic(F(45), 'breast').status, 'talk-now');
  assert.match(topic(F(54), 'breast').summary, /every year/);
  assert.match(topic(F(55), 'breast').summary, /every 2 years/);
  assert.match(topic(F(80), 'breast').detail, /10 more years/);
});

test('colorectal: starts 45, through 75, discuss 76-85, stop after 85', () => {
  assert.equal(topic(M(44), 'colorectal').status, 'upcoming');
  assert.equal(topic(M(45), 'colorectal').status, 'talk-now');
  assert.equal(topic(M(75), 'colorectal').status, 'talk-now');
  assert.equal(topic(M(76), 'colorectal').status, 'option');
  assert.equal(topic(M(85), 'colorectal').status, 'option');
  assert.equal(topic(M(86), 'colorectal').status, 'past');
  assert.match(topic(M(50), 'colorectal').detail, /colonoscopy every 10 years/);
  assert.match(topic(M(50), 'colorectal').detail, /not preferred/);
});

test('cervical: only with a cervix, starts 25, through 65, exit rules after', () => {
  assert.equal(topic(M(30), 'cervical'), undefined);
  assert.equal(topic(F(24), 'cervical').status, 'upcoming');
  assert.equal(topic(F(25), 'cervical').status, 'talk-now');
  assert.match(topic(F(30), 'cervical').summary, /every 5 years/);
  assert.equal(topic(F(65), 'cervical').status, 'talk-now');
  assert.equal(topic(F(66), 'cervical').status, 'option');
  assert.match(topic(F(70), 'cervical').detail, /2 normal HPV tests or 3 normal Pap tests/);
});

test('cervix and uterus are separate: endometrial needs a uterus + menopause', () => {
  assert.equal(topic(F(50), 'endometrial'), undefined);
  assert.equal(topic(F(52, { menopause: true }), 'endometrial').status, 'info');
  // partial hysterectomy: cervix kept, uterus removed
  assert.equal(topic(F(52, { uterus: false, menopause: true }), 'endometrial'), undefined);
  assert.equal(topic(F(52, { uterus: false }), 'cervical').status, 'talk-now');
  // older saved data had only "cervix / uterus"
  assert.equal(topic({ label: 'x', age: 60, cervix: true, menopause: true }, 'endometrial').status, 'info');
});

test('lung: 50-80 AND smokes/smoked AND >= 20 pack-years', () => {
  assert.equal(topic(M(60), 'lung'), undefined);
  assert.equal(topic(M(60, smoker('never', 40)), 'lung'), undefined);
  assert.equal(topic(M(60, smoker('former', 20)), 'lung').status, 'talk-now');
  assert.equal(topic(M(60, smoker('current', 20)), 'lung').status, 'talk-now');
  assert.equal(topic(M(50, smoker('former', 20)), 'lung').status, 'talk-now');
  assert.equal(topic(M(60, smoker('former', 19.9)), 'lung').status, 'info');
  assert.equal(topic(M(49, smoker('current', 25)), 'lung').status, 'upcoming');
  assert.equal(topic(M(80, smoker('former', 30)), 'lung').status, 'talk-now');
  assert.equal(topic(M(81, smoker('former', 30)), 'lung').status, 'past');
});

test('lung: unknown pack-years asks for numbers instead of saying "0"', () => {
  assert.match(topic(M(60, { smoking: 'former' }), 'lung').summary, /Add packs per day/);
  assert.match(topic(M(60, smoker('former', 5)), 'lung').summary, /number entered is 5/);
});

test('lung: quit help only for people who smoke now', () => {
  assert.ok(topic(M(60, smoker('current', 30)), 'lung').extra);
  assert.equal(topic(M(60, smoker('former', 30)), 'lung').extra, undefined);
});

test('lung band appears on the timeline only when the 20 pack-year criterion is met', () => {
  assert.ok(R.evaluate(M(40, smoker('former', 25))).timeline.some(b => b.key === 'lung'));
  assert.ok(!R.evaluate(M(60, smoker('former', 10))).timeline.some(b => b.key === 'lung'));
});

test('old saved data: smokes:true is treated as smoking now', () => {
  assert.equal(R.smokingStatus({ smokes: true }), 'current');
  assert.equal(R.smokingStatus({}), 'never');
  assert.equal(topic(M(60, { smokes: true, packYears: 25 }), 'lung').status, 'talk-now');
});

test('prostate: talk at 50; 45 if African American or one father/brother < 65; 40 if more than one', () => {
  assert.equal(topic(M(49), 'prostate').status, 'upcoming');
  assert.equal(topic(M(50), 'prostate').status, 'option');
  assert.equal(topic(M(45, { africanAmerican: true }), 'prostate').status, 'option');
  assert.equal(topic(M(45, { prostateFamily: 'one' }), 'prostate').status, 'option');
  assert.equal(topic(M(44, { africanAmerican: true }), 'prostate').startsIn, 1);
  assert.equal(topic(M(40, { prostateFamily: 'multiple' }), 'prostate').status, 'option');
  assert.equal(topic(M(39, { prostateFamily: 'multiple' }), 'prostate').startsIn, 1);
  assert.equal(R.prostateStartAge({ fatherBrotherProstateUnder65: true }), 45); // old saved field
  assert.match(topic(M(60), 'prostate').detail, /less than 10 more years/);
});

test('HPV vaccine: shown for ages 9-26 only', () => {
  assert.equal(topic(F(8), 'hpv'), undefined);
  assert.match(topic(F(10), 'hpv').summary, /2 doses/);
  assert.match(topic(M(20), 'hpv').summary, /as soon as possible/);
  assert.equal(topic(F(26), 'hpv').status, 'talk-now');
  assert.equal(topic(F(27), 'hpv'), undefined);
});

test('family history adds the ACS different-plan note (and MRI note with breast tissue)', () => {
  const withFH = R.evaluate(F(30, { familyHistory: true })).notes.join(' ');
  assert.match(withFH, /different screening plan/);
  assert.match(withFH, /breast MRI/);
  assert.ok(!/breast MRI/.test(R.evaluate(M(30, { familyHistory: true })).notes.join(' ')));
  assert.ok(!R.evaluate(F(30)).notes.some(n => /different screening plan/.test(n)));
});

test('never uses diagnostic or risk-score language', () => {
  const people = [F(20), F(42), F(50, { menopause: true, familyHistory: true }), F(70), M(30), M(55, smoker('current', 30)), M(90), M(60, smoker('former', 3))];
  const banned = /(you have cancer|diagnos(e|is) you|your risk is|risk score|% chance|you need a|you are at risk)/i;
  people.forEach(p => {
    const r = R.evaluate(p);
    r.topics.forEach(t => assert.ok(!banned.test(t.summary + ' ' + t.detail + ' ' + (t.extra || '')), t.title));
    r.notes.forEach(n => assert.ok(!banned.test(n), n));
    ['casual', 'heartfelt', 'text'].forEach(tone => assert.ok(!banned.test(C.starter('X', r.topics, tone))));
  });
});

test('every topic cites an ACS source', () => {
  [F(30), F(60, { menopause: true, ...smoker('current', 25) }), M(55), M(15)].forEach(p => {
    R.evaluate(p).topics.forEach(t => assert.match(t.source, /^https:\/\/www\.cancer\.org\//));
  });
});

test('every age 0-120 x body type evaluates without throwing, with sorted statuses', () => {
  const order = ['talk-now', 'option', 'info', 'upcoming', 'past'];
  for (let age = 0; age <= 120; age++) {
    for (const p of [F(age, { menopause: age > 50, familyHistory: true, ...smoker('current', 30) }), M(age, { africanAmerican: true, ...smoker('former', 10) })]) {
      const r = R.evaluate(p);
      const idx = r.topics.map(t => order.indexOf(t.status));
      assert.ok(idx.every(i => i >= 0), 'unknown status at age ' + age);
      assert.deepEqual(idx, [...idx].sort((a, b) => a - b), 'not sorted at age ' + age);
      r.topics.forEach(t => assert.ok(t.summary && t.title));
    }
  }
});

test('timeline segments match ACS: soft = choice to discuss', () => {
  const tl = R.evaluate(F(50)).timeline;
  const seg = k => tl.find(b => b.key === k).segments;
  const desc = k => seg(k).map(s => s.ages + (s.soft ? ' soft' : '')).join(', ');
  assert.equal(desc('breast'), '40\u201344 soft, 45+');
  assert.equal(desc('colorectal'), '45\u201375, 76\u201385 soft');
  assert.equal(desc('cervical'), '25\u201365, 66+ soft');
  assert.ok(R.evaluate(M(50)).timeline.find(b => b.key === 'prostate').segments[0].soft);
});

test('invalid age returns a helpful note, no topics', () => {
  for (const age of ['abc', '', null, undefined, -1, 121, true]) {
    const r = R.evaluate({ label: 'x', age });
    assert.equal(r.topics.length, 0, 'age ' + age);
    assert.match(r.notes[0], /Enter an age/);
  }
  assert.equal(R.evaluate(undefined).topics.length, 0);
});

test('family summary counts and finds soonest upcoming', () => {
  const s = R.familySummary([F(46), M(52), F(19)]);
  assert.ok(s.talkCount >= 3);
  assert.equal(s.soonest.years, 6); // F(19) cervical starts at 25
  assert.deepEqual(R.familySummary([]), { talkCount: 0, upcomingCount: 0, soonest: null });
});

console.log('\nScreenTalk content');

test('conversation starters name topics and work for every tone', () => {
  ['casual', 'heartfelt', 'text'].forEach(tone => {
    const s = C.starter('Mom', R.evaluate(F(47)).topics, tone);
    assert.match(s, /Mom/);
    assert.match(s, /mammograms/);
    assert.match(s, /colon cancer screening/);
  });
  const kid = C.starter('Bro', R.evaluate(M(30)).topics, 'text');
  assert.match(kid, /in 15 years/); // colorectal at 45
});

test('starters never suggest lung screening when the guideline does not apply as entered', () => {
  const s = C.starter('Dad', R.evaluate(M(60, smoker('former', 5))).topics, 'casual');
  assert.ok(!/lung/i.test(s), s);
  const yes = C.starter('Dad', R.evaluate(M(60, smoker('former', 25))).topics, 'casual');
  assert.match(yes, /lung cancer screening/);
});

test('starters handle awareness-only, nothing-due, and blank names', () => {
  // 90-year-old with uterus, menopause, past every window except breast/cervical; check awareness line exists
  const endo = C.starter('Nana', R.evaluate(F(71, { menopause: true })).topics, 'heartfelt');
  assert.match(endo, /uterine cancer/);
  const none = C.starter('', [], 'casual');
  assert.match(none, /there/);
  assert.match(C.starter('Bro', R.evaluate({ label: 'b', age: 90 }).topics, 'casual'), /regular checkup/);
});

test('checkup questions follow the topics, with no duplicates', () => {
  const qs = C.questions({ familyHistory: true }, R.evaluate(M(60, smoker('current', 30))).topics);
  assert.ok(qs.some(q => /low-dose CT/.test(q)));
  assert.ok(qs.some(q => /quit smoking/.test(q)));
  assert.ok(qs.some(q => /PSA/.test(q)));
  assert.ok(qs.some(q => /family history/.test(q)));
  assert.equal(new Set(qs).size, qs.length);
  assert.deepEqual(C.questions({}, R.evaluate(M(20)).topics), ['Is my HPV vaccine series complete?']);
});

test('checkup sheet: rows for now/discuss/info, later list, pack-years, questions', () => {
  const dad = { label: 'Dad', age: 52, prostate: true, smoking: 'former', ppd: '1', years: '22', packYears: 22 };
  const d = C.checkupSheet(dad, R.evaluate(dad));
  assert.equal(d.title, 'Checkup sheet: Dad, age 52');
  assert.deepEqual(d.rows.map(r => r.key).sort(), ['colorectal', 'lung', 'prostate']);
  assert.ok(d.rows.every(r => r.source.startsWith('https://www.cancer.org/') && r.statusLabel && r.test));
  assert.equal(d.rows.find(r => r.key === 'prostate').statusLabel, 'A choice to discuss');
  assert.match(d.smoking, /Used to smoke/);
  assert.match(d.smoking, /22 pack-years \(1 pack a day for 22 years\)/);
  assert.deepEqual(d.questions, C.questions(dad, R.evaluate(dad).topics));
  assert.match(d.footer, /not medical advice/);
  // upcoming topics go to "later" with the ACS start age, never into the fill-in table
  const sis = { label: 'Sis', age: 19, breasts: true, cervix: true, uterus: true };
  const s2 = C.checkupSheet(sis, R.evaluate(sis));
  assert.deepEqual(s2.rows.map(r => r.key), ['hpv']);
  assert.ok(s2.later.includes('Cervical cancer screening at 25'));
  assert.ok(s2.later.includes('Breast cancer screening at 40'));
  assert.ok(s2.later.includes('Colon and rectal cancer screening at 45'));
  assert.equal(s2.smoking, '');
  // past-range topics are left off; blank or missing input never throws
  const old = { label: '', age: 90, prostate: true };
  const s3 = C.checkupSheet(old, R.evaluate(old));
  assert.ok(!s3.rows.some(r => r.key === 'colorectal'));
  assert.equal(s3.title, 'Checkup sheet: Family member, age 90');
  assert.doesNotThrow(() => C.checkupSheet());
  assert.match(C.checkupSheet({ age: 60, smoking: 'current' }, R.evaluate({ age: 60, smoking: 'current' })).smoking, /not entered/);
});

test('checkup sheet rows carry the USPSTF cross-check and the no-copay line', () => {
  const dad = { label: 'Dad', age: 52, prostate: true, smoking: 'former', ppd: '1', years: '22', packYears: 22 };
  const res = R.evaluate(dad);
  const d = C.checkupSheet(dad, res);
  const row = k => d.rows.find(r => r.key === k);
  d.rows.forEach(r => {
    const t = res.topics.find(x => x.key === r.key);
    assert.deepEqual(r.uspstf, t.uspstf ? { text: t.uspstf.text, differs: t.uspstf.differs } : null);
    assert.equal(r.cost, t.cost ? t.cost.text : '');
  });
  assert.equal(row('colorectal').uspstf.differs, false);
  assert.match(row('colorectal').uspstf.text, /^USPSTF: screening for adults 45 to 75/);
  assert.match(row('colorectal').cost, /no copay/);
  assert.equal(row('lung').uspstf.differs, true);
  assert.match(row('lung').cost, /no copay/);
  assert.equal(row('prostate').uspstf.differs, true);
  assert.equal(row('prostate').cost, '');
  assert.equal(row('lung').costTag, 'No copay*');
  assert.equal(row('prostate').costTag, '');
  // one cost note under the table, with the quit-within-15-years tail for a former smoker's lung row
  assert.match(d.costNote, /^\* No copay: most health plans must cover these screenings with no copay or deductible/);
  assert.match(d.costNote, /quit in the past 15 years\.$/);
  const never = { label: 'Mom', age: 50, breasts: true, cervix: true, uterus: true };
  assert.ok(!/15 years/.test(C.checkupSheet(never, R.evaluate(never)).costNote));
  // HPV vaccine has no USPSTF screening note and no cost line
  const sis = { label: 'Sis', age: 19, breasts: true, cervix: true, uterus: true };
  const h = C.checkupSheet(sis, R.evaluate(sis)).rows.find(r => r.key === 'hpv');
  assert.equal(h.uspstf, null);
  assert.equal(h.cost, '');
  assert.equal(C.checkupSheet(sis, R.evaluate(sis)).costNote, '');
});

test('sanitizePerson cleans bad or old saved data', () => {
  const p = C.sanitizePerson({ label: '  <img src=x onerror=alert(1)> very long nickname here!!', age: '47', smokes: true, ppd: '1', years: '25', progress: 'hacked', fatherBrotherProstateUnder65: true }, R.packYears);
  assert.equal(p.label.length <= 24, true);
  assert.equal(p.age, 47);
  assert.equal(p.smoking, 'current');
  assert.equal(p.packYears, 25);
  assert.equal(p.progress, 'not-started');
  assert.equal(p.prostateFamily, 'one');
  const junk = C.sanitizePerson(null, R.packYears);
  assert.equal(junk.label, 'Family member');
  assert.equal(junk.age, 0);
  assert.equal(C.sanitizePerson({ age: 999, ppd: '50', years: '-3' }, R.packYears).age, 0);
  assert.equal(C.sanitizePerson({ age: 40, ppd: '50' }, R.packYears).ppd, '');
  assert.equal(C.sanitizePerson({ age: 40, menopause: true }, R.packYears).menopause, false);
});

test('buildICS makes a valid all-day calendar reminder with escaped text', () => {
  const ics = C.buildICS({ title: 'Check in with Mom, about screening; soon', description: 'Line 1\nLine 2', date: new Date(2026, 9, 24), now: new Date(Date.UTC(2026, 9, 10, 12, 0, 0)), uid: 'abc' });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261024\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20261025\r\n/);
  assert.match(ics, /DTSTAMP:20261010T120000Z/);
  assert.match(ics, /SUMMARY:Check in with Mom\\, about screening\\; soon/);
  assert.match(ics, /DESCRIPTION:Line 1\\nLine 2/);
  assert.ok(ics.split('\r\n').every(l => l.length <= 75), 'lines folded');
  // month rollover
  assert.match(C.buildICS({ title: 't', date: new Date(2026, 11, 31), now: new Date() }), /DTEND;VALUE=DATE:20270101/);
});

test('every Myth-or-Fact card has an answer, an explanation, and an NCI/ACS source', () => {
  assert.equal(C.CARDS.length, 12);
  C.CARDS.forEach(c => {
    assert.ok(c.answer === 'myth' || c.answer === 'fact');
    assert.ok(c.why.length > 30);
    assert.match(c.src, /^https:\/\/www\.(cancer\.gov|cancer\.org)\//);
  });
});

test('resources use https or tel links only', () => {
  C.RESOURCES.forEach(r => assert.match(r.href, /^(https:\/\/|tel:)/));
});

test('years since quitting: 15 years -> USPSTF 15-year rule met, no-copay line applies, ACS card unchanged', () => {
  const p = M(60, { smoking: 'former', packYears: 30, quitYears: 15 });
  const t = topic(p, 'lung');
  assert.equal(t.status, 'talk-now');
  assert.equal(t.summary, R.TEXT.en.lungNowS); // ACS wording does not use years since quitting
  assert.equal(t.quitRule, 'within');
  assert.equal(t.uspstf.differs, false);
  assert.match(t.uspstf.text, /They quit 15 years ago \(15 or fewer\), so the USPSTF still recommends it\.$/);
  assert.ok(!/year they quit matters/.test(t.uspstf.text));
  assert.match(t.cost.text, /They quit 15 years ago, within 15 years, so this applies\.$/);
  const es = R.evaluate(p, 'es').topics.find(x => x.key === 'lung');
  assert.equal(es.summary, R.TEXT.es.lungNowS);
  assert.match(es.uspstf.text, /Dejó de fumar hace 15 años \(15 o menos\), así que el USPSTF todavía la recomienda\.$/);
  assert.match(es.cost.text, /Dejó de fumar hace 15 años, dentro de los últimos 15 años, así que aplica\.$/);
  assert.equal(R.quitRule('former', 0), 'within');
  assert.match(topic(M(60, { smoking: 'former', packYears: 30, quitYears: 1 }), 'lung').uspstf.text, /quit 1 year ago/);
  assert.match(topic(M(60, { smoking: 'former', packYears: 30, quitYears: 0 }), 'lung').uspstf.text, /quit less than a year ago/);
});

test('years since quitting: 16 years -> USPSTF stops, no no-copay line, ACS still recommends', () => {
  const p = M(60, { smoking: 'former', packYears: 30, quitYears: 16 });
  const t = topic(p, 'lung');
  assert.equal(t.status, 'talk-now');
  assert.equal(t.summary, R.TEXT.en.lungNowS);
  assert.equal(t.quitRule, 'over');
  assert.equal(t.uspstf.differs, true);
  assert.match(t.uspstf.text, /They quit 16 years ago \(more than 15\), so the USPSTF no longer recommends it, and the no-copay rule \(quit in the past 15 years\) does not apply\. ACS has no years-since-quitting limit\.$/);
  assert.equal(t.cost, undefined);
  const es = R.evaluate(p, 'es').topics.find(x => x.key === 'lung');
  assert.match(es.uspstf.text, /Dejó de fumar hace 16 años \(más de 15\), así que el USPSTF ya no la recomienda y la regla de cero copago .* no aplica\. La ACS no tiene límite/);
  assert.equal(es.cost, undefined);
  // other topics keep their no-copay line
  assert.ok(topic(p, 'colorectal').cost);
  // below 20 pack-years: say where the 15-year rule stands without claiming USPSTF recommends or stopped recommending it
  assert.match(topic(M(60, { smoking: 'former', packYears: 10, quitYears: 16 }), 'lung').uspstf.text, /past the USPSTF 15-year limit\. ACS has no years-since-quitting limit\.$/);
  assert.match(topic(M(60, { smoking: 'former', packYears: 10, quitYears: 5 }), 'lung').uspstf.text, /inside the 15-year limit\.$/);
});

test('years since quitting: blank field keeps the explain-the-rule wording; ignored for people who smoke now', () => {
  ['', undefined, null, 'abc'].forEach(q => {
    const t = topic(M(60, { smoking: 'former', packYears: 30, quitYears: q }), 'lung');
    assert.equal(t.quitRule, null, String(q));
    assert.equal(t.uspstf.differs, true);
    assert.match(t.uspstf.text, /year they quit matters/);
    assert.match(t.cost.text, /quit in the past 15 years\.$/);
  });
  const c = topic(M(60, { smoking: 'current', packYears: 30, quitYears: 20 }), 'lung');
  assert.equal(c.quitRule, null); assert.equal(c.uspstf.differs, false); assert.ok(c.cost);
});

test('demo family: Dad used to smoke and quit 18 years ago, so USPSTF differs and the lung no-copay line is gone (EN and ES)', () => {
  const fam = C.demoFamily(['Mom', 'Dad', 'Nana', 'Big sis']).map(p => C.sanitizePerson(p, R.packYears));
  assert.equal(fam.length, 4);
  assert.deepEqual(fam.map(p => p.label), ['Mom', 'Dad', 'Nana', 'Big sis']);
  const dad = fam[1];
  assert.equal(dad.age, 52); assert.equal(dad.smoking, 'former'); assert.equal(dad.packYears, 22); assert.equal(dad.quitYears, '18');
  assert.ok(fam.every((p, i) => i === 1 || p.quitYears === ''));
  const lung = topic(dad, 'lung');
  assert.equal(lung.status, 'talk-now');
  assert.equal(lung.uspstf.differs, true);
  assert.match(lung.uspstf.text, /They quit 18 years ago \(more than 15\), so the USPSTF no longer recommends it/);
  assert.ok(!/year they quit matters/.test(lung.uspstf.text));
  assert.ok(!lung.cost);
  assert.equal(topic(dad, 'colorectal').uspstf.differs, false); assert.ok(topic(dad, 'colorectal').cost);
  assert.equal(topic(dad, 'prostate').uspstf.differs, true);
  const s = C.checkupSheet(dad, R.evaluate(dad));
  assert.equal(s.title, 'Checkup sheet: Dad, age 52');
  assert.deepEqual(s.rows.map(r => r.key).sort(), ['colorectal', 'lung', 'prostate']);
  assert.match(s.smoking, /22 pack-years \(1 pack a day for 22 years\) · quit 18 years ago$/);
  assert.equal(s.rows.find(r => r.key === 'lung').costTag, '');
  assert.equal(s.rows.find(r => r.key === 'colorectal').costTag, 'No copay*');
  assert.equal(s.rows.filter(r => r.costTag).length, 1);
  assert.equal(s.rows.filter(r => r.uspstf && r.uspstf.differs).length, 2);
  assert.ok(!/15 years/.test(s.costNote));
  const e = C.checkupSheet(dad, R.evaluate(dad, 'es'), 'es');
  assert.match(e.smoking, /dejó de fumar hace 18 años$/);
  assert.equal(e.rows.find(r => r.key === 'lung').costTag, '');
  assert.equal(e.rows.filter(r => r.costTag).length, 1);
  assert.ok(!/15 años/.test(e.costNote));
  // demoFamily returns fresh copies, never the shared template
  const a = C.demoFamily([]); a[1].age = 99;
  assert.equal(C.DEMO_FAMILY[1].age, 52);
});

test('years since quitting on the checkup sheet (EN and ES) and in saved-data cleaning', () => {
  const mk = q => C.sanitizePerson({ label: 'Dad', age: 60, prostate: true, smoking: 'former', ppd: '1', years: '30', quitYears: q }, R.packYears);
  const d15 = mk('15'), s15 = C.checkupSheet(d15, R.evaluate(d15));
  assert.equal(d15.quitYears, '15');
  assert.match(s15.smoking, /30 pack-years \(1 pack a day for 30 years\) · quit 15 years ago$/);
  assert.match(s15.costNote, /For lung screening, they quit 15 years ago, within 15 years, so this applies\.$/);
  assert.equal(s15.rows.find(r => r.key === 'lung').costTag, 'No copay*');
  assert.equal(s15.rows.find(r => r.key === 'lung').uspstf.differs, false);
  const d16 = mk(16), s16 = C.checkupSheet(d16, R.evaluate(d16));
  assert.match(s16.smoking, /quit 16 years ago$/);
  assert.equal(s16.rows.find(r => r.key === 'lung').costTag, '');
  assert.match(s16.rows.find(r => r.key === 'lung').uspstf.text, /no longer recommends it/);
  assert.ok(!/15 years/.test(s16.costNote));
  const e16 = C.checkupSheet(d16, R.evaluate(d16, 'es'), 'es');
  assert.match(e16.smoking, /dejó de fumar hace 16 años$/);
  const e15 = C.checkupSheet(d15, R.evaluate(d15, 'es'), 'es');
  assert.match(e15.costNote, /dejó de fumar hace 15 años, dentro de los últimos 15 años, así que aplica\.$/);
  const blank = mk(''), sb = C.checkupSheet(blank, R.evaluate(blank));
  assert.equal(blank.quitYears, '');
  assert.ok(!/quit .* ago/.test(sb.smoking));
  assert.match(sb.costNote, /quit in the past 15 years\.$/);
  // cleaning: kept only for former smokers, numbers 0-120 that fit inside their age
  assert.equal(C.sanitizePerson({ age: 60, smoking: 'current', quitYears: 5 }).quitYears, '');
  assert.equal(C.sanitizePerson({ age: 60, smoking: 'never', quitYears: 5 }).quitYears, '');
  assert.equal(C.sanitizePerson({ age: 60, smokes: true, quitYears: 5 }).quitYears, '');
  assert.equal(C.sanitizePerson({ age: 40, smoking: 'former', quitYears: 50 }).quitYears, '');
  assert.equal(C.sanitizePerson({ age: 40, smoking: 'former', quitYears: -2 }).quitYears, '');
  assert.equal(C.sanitizePerson({ age: 40, smoking: 'former', quitYears: 'abc' }).quitYears, '');
  assert.equal(C.sanitizePerson({ age: 40, smoking: 'former', quitYears: '<b>1</b>' }).quitYears, '');
  assert.equal(C.sanitizePerson({ age: 40, smoking: 'former' }).quitYears, '');
  assert.equal(C.sanitizePerson({ age: 40, smoking: 'former', quitYears: 0 }).quitYears, '0');
});

test('every topic has a source URL and a revision or check date (ACS, USPSTF, no-copay), EN and ES', () => {
  const isUrl = u => typeof u === 'string' && /^https:\/\/[a-z0-9.-]+\.(org|gov)\//.test(u);
  const isDate = d => typeof d === 'string' && /^\d{4}(-\d{2}-\d{2})?$/.test(d) && (d.length === 4 || !isNaN(Date.parse(d + 'T12:00:00Z')));
  // Only dates recorded in the source list: ACS pages checked Oct 10, 2026; USPSTF and HealthCare.gov Oct 11, 2026.
  assert.deepEqual(R.CHECKED, { acs: '2026-10-10', uspstf: '2026-10-11', cost: '2026-10-11' });
  const seen = new Set();
  const profiles = [
    a => F(a, smoker('current', 30)), a => M(a, smoker('former', 25)), a => F(a, { ...smoker('former', 25), quitYears: 5, menopause: true }),
    a => M(a, { africanAmerican: true, prostateFamily: 'multiple' }), a => ({ label: 'X', age: a, breasts: true })
  ];
  for (const l of ['en', 'es']) for (let a = 0; a <= 120; a++) for (const mk of profiles) {
    R.evaluate(mk(a), l).topics.forEach(t => {
      seen.add(t.key);
      const where = `${t.key} at ${a} (${l})`;
      assert.ok(isUrl(t.source), 'ACS source URL: ' + where);
      assert.ok(isDate(t.revised) && t.revised <= t.checked, 'ACS revision date: ' + where);
      assert.equal(t.checked, R.CHECKED.acs, 'ACS check date: ' + where);
      assert.ok(t.revisedLabel && t.revisedLabel.includes(R.shortDate(t.revised, l)), 'revision label: ' + where);
      if (t.sourceEs) assert.ok(isUrl(t.sourceEs), 'CDC Spanish URL: ' + where);
      if (t.uspstf) {
        assert.ok(isUrl(t.uspstf.source) && t.uspstf.source.includes('uspreventiveservicestaskforce.org'), 'USPSTF URL: ' + where);
        assert.ok(isDate(t.uspstf.final) && t.uspstf.checked === R.CHECKED.uspstf, 'USPSTF dates: ' + where);
      }
      if (t.cost) {
        assert.ok(isUrl(t.cost.source) && /healthcare\.gov|cuidadodesalud\.gov/.test(t.cost.source), 'cost URL: ' + where);
        assert.equal(t.cost.checked, R.CHECKED.cost, 'cost check date: ' + where);
      }
    });
  }
  // every topic the engine can show was reached, and every ACS, USPSTF and cost source has a date
  assert.deepEqual([...seen].sort(), ['breast', 'cervical', 'colorectal', 'endometrial', 'hpv', 'lung', 'prostate']);
  Object.keys(R.SOURCES).filter(k => k !== 'quit').forEach(k => assert.ok(isUrl(R.SOURCES[k]) && isDate(R.REVISED[k]), 'ACS ' + k));
  Object.keys(R.SOURCES_US).forEach(k => assert.ok(isUrl(R.SOURCES_US[k]) && isDate(R.US_FINAL[k]), 'USPSTF ' + k));
  ['en', 'es'].forEach(l => Object.values(R.SOURCES_COST[l]).forEach(u => assert.ok(isUrl(u), 'cost ' + l)));
  // the printed sheet carries each row's ACS revision date in both languages
  const s = C.checkupSheet(F(50), R.evaluate(F(50)));
  assert.ok(s.rows.length && s.rows.every(r => /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/.test(r.revised)), 'EN sheet rows');
  assert.ok(s.checked.startsWith('Guidelines last checked: October 2026 (ACS: Oct 10, 2026; each ACS page last revised: ') && s.checked.endsWith('; USPSTF and HealthCare.gov: Oct 11, 2026).'), s.checked);
  s.rows.forEach(r => assert.ok(s.checked.includes(r.revised), 'EN sheet line has ' + r.key));
  const e = C.checkupSheet(F(50), R.evaluate(F(50), 'es'), 'es');
  assert.ok(e.rows.every(r => /^\d{1,2} [a-z]{3,4} \d{4}$/.test(r.revised)), 'ES sheet rows');
  assert.ok(e.checked.startsWith('Guías verificadas por última vez: octubre de 2026 (ACS: 10 oct 2026; ') && e.checked.endsWith('USPSTF y CuidadoDeSalud.gov: 11 oct 2026).'), e.checked);
  assert.equal(R.shortDate('2026-07-23', 'en'), 'Jul 23, 2026');
  assert.equal(R.shortDate('2025-12-04', 'es'), '4 dic 2025');
});

test('cervical detail names the Jan 2026 HRSA guideline and that USPSTF is not finalized (EN/ES)', () => {
  const en = topic(F(35), 'cervical').detail;
  assert.match(en, /HRSA/); assert.match(en, /Jan 2026/); assert.match(en, /starting in 2027/); assert.match(en, /has not finalized/);
  const es = R.evaluate(F(35), 'es').topics.find(t => t.key === 'cervical').detail;
  assert.match(es, /HRSA/); assert.match(es, /enero de 2026/); assert.match(es, /desde 2027/); assert.match(es, /no ha finalizado/);
});

console.log(`\n${passed} passed, ${failed} failed`);

// Also run the "Rehearse the talk", English/Spanish and offline service-worker tests so one command covers all unit tests.
require('./rehearse.test.js');
require('./i18n.test.js');
require('./sw.test.js');
require('./devpost-claims.test.js');
require('./uspstf-audit.test.js');
require('./resources.test.js');
require('./links.test.js');
require('./docs.test.js');
