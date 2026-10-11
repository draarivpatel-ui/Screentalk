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

console.log(`\n${passed} passed, ${failed} failed`);

// Also run the "Rehearse the talk" and English/Spanish tests so one command covers all unit tests.
require('./rehearse.test.js');
require('./i18n.test.js');
