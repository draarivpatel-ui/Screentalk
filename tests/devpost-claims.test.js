// Devpost-claims check: the CodeTheCure page (https://devpost.com/software/screentalk-btpo84, submitted Oct 11, 2026,
// now frozen) makes specific claims about guidelines, counts and features. Each one is re-checked here against the
// shipped code, so a later change cannot quietly make the page false. Run: node tests/devpost-claims.test.js
const assert = require('node:assert/strict');
const R = require('../js/rules.js'); const C = require('../js/content.js'); const H = require('../js/rehearse.js');
const fs = require('fs'); const path = require('path');
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}
const topic = (p, k) => R.evaluate(p).topics.find(t => t.key === k);
const F = (age, x = {}) => ({ label: 'Mom', age, breasts: true, cervix: true, uterus: true, ...x });
const M = (age, x = {}) => ({ label: 'Dad', age, prostate: true, ...x });
console.log('ScreenTalk Devpost claims');

test('"for Mom at 46, ACS says a mammogram every year and USPSTF says every 2 years from 40 to 74"', () => {
  const b = topic(F(46), 'breast');
  assert.match(b.summary, /every year/); assert.match(b.uspstf.text, /every 2 years for women 40 to 74/); assert.equal(b.uspstf.differs, true);
});
test('no-copay line exactly where the page says: breast 40+, colorectal 45 to 75, cervical 21 to 65, lung 50 to 80 with 20+ pack-years', () => {
  const has = (p, k) => !!(topic(p, k) && topic(p, k).cost);
  assert.ok(has(F(40), 'breast') && !has(F(39), 'breast'));
  assert.ok(has(F(45), 'colorectal') && has(F(75), 'colorectal') && !has(F(44), 'colorectal') && !has(F(76), 'colorectal'));
  assert.ok(has(F(21), 'cervical') && has(F(65), 'cervical') && !has(F(20), 'cervical'));
  const S = (age, py) => M(age, { smoking: 'current', packYears: py });
  assert.ok(has(S(50, 20), 'lung') && has(S(80, 20), 'lung') && !has(S(50, 19), 'lung') && !has(S(49, 30), 'lung'));
});
test('"the USPSTF stops lung screening 15 years after quitting" (years-since-quitting field: 15 still recommended, 16 not, no-copay removed)', () => {
  const L = q => topic(M(60, { smoking: 'former', packYears: 30, quitYears: q }), 'lung');
  assert.equal(L(15).uspstf.differs, false); assert.ok(L(15).cost);
  assert.equal(L(16).uspstf.differs, true); assert.ok(!L(16).cost);
});
test('"the prostate talk starts at 40 for men with more than one close relative diagnosed early"; "PSA talks start at 55 for the USPSTF"', () => {
  assert.equal(topic(M(40, { prostateFamily: 'multiple' }), 'prostate').status, 'option');
  assert.equal(topic(M(40), 'prostate').status, 'upcoming');
  assert.match(topic(M(50), 'prostate').uspstf.text, /55 to 69/);
});
test('topics the page lists exist: breast, colorectal, cervical, lung, prostate, endometrial awareness, HPV vaccine', () => {
  const keys = new Set([...R.evaluate(F(60, { menopause: true })).topics, ...R.evaluate(M(60, { smoking: 'current', packYears: 30 })).topics, ...R.evaluate({ age: 12, cervix: true }).topics].map(t => t.key));
  ['breast', 'colorectal', 'cervical', 'lung', 'prostate', 'endometrial', 'hpv'].forEach(k => assert.ok(keys.has(k), k));
});
test('ACS revision dates in the page\'s Sources list match the app (breast Jul 23 2026, colorectal May 27 2026, cervical Dec 4 2025, lung Jan 29 2024, prostate Nov 22 2023, endometrial Feb 28 2025, HPV Sep 3 2026)', () => {
  const want = { breast: '2026-07-23', colorectal: '2026-05-27', cervical: '2025-12-04', lung: '2024-01-29', prostate: '2023-11-22', endometrial: '2025-02-28', hpv: '2026-09-03' };
  const all = [...R.evaluate(F(60, { menopause: true })).topics, ...R.evaluate(M(60, { smoking: 'current', packYears: 30 })).topics, ...R.evaluate({ age: 12, cervix: true }).topics];
  Object.entries(want).forEach(([k, d]) => assert.equal(all.find(t => t.key === k).revised, d, k));
});
test('"Myth or Fact: 12 cards"; rehearsal: "Mom, Dad, Grandma, or Grandpa", "push back five times", "Pick one of three replies", "a score out of 10"', () => {
  assert.equal(C.CARDS.length, 12);
  assert.deepEqual(H.PARENTS, ['mom', 'dad', 'grandma', 'grandpa']);
  assert.equal(H.ROUNDS.length, 5); H.ROUNDS.forEach(r => assert.equal(r.options.length, 3));
  assert.equal(H.maxScore(), 10);
});
test('"progress tracker (Not talked yet -> We talked -> Checkup booked -> Up to date)"', () => {
  assert.deepEqual(C.PROGRESS.map(p => p.label), ['Not talked yet', 'We talked about it', 'Checkup booked', 'Up to date']);
});
test('"ACS 24/7 helpline (1-800-227-2345), NCI Cancer Information Service (1-800-4-CANCER)"', () => {
  const s = JSON.stringify(C.RESOURCES);
  assert.ok(s.includes('1-800-227-2345') && s.includes('1-800-4-CANCER'));
});
test('"Zero data leaves the device": CSP connect-src \'none\' and no network calls in app code', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /connect-src 'none'/);
  fs.readdirSync(path.join(__dirname, '..', 'js')).forEach(f => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
    assert.ok(!/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/.test(js), f);
  });
});
test('"never says anyone \\"needs\\" a test" or calculates risk (plan, detail and USPSTF text for a range of people; ACS\'s own "an abnormal result needs a follow-up colonoscopy" is about a result, not a person)', () => {
  [F(25), F(46), F(60, { menopause: true }), M(55, { smoking: 'current', packYears: 30 }), M(40, { prostateFamily: 'multiple' })].forEach(p =>
    R.evaluate(p).topics.forEach(t => assert.ok(!/(you need|needs a (mammogram|colonoscopy|screening|test|scan)|you have cancer|your risk is|risk score|% chance)/i.test(t.summary + ' ' + t.detail + ' ' + (t.uspstf ? t.uspstf.text : '')), t.key + ': ' + t.summary)));
});
console.log(`\n${passed} passed, ${failed} failed`);
