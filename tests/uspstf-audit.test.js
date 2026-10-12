// Primary-source audit (team-b r6, Oct 11 2026): every USPSTF age range and interval the app quotes, re-read on the
// current USPSTF final statements, and the Same/Differs chip checked at each published edge.
//  breast      https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening     (final Apr 30, 2024): biennial 40-74; 75+ insufficient evidence
//  colorectal  .../colorectal-cancer-screening (final 2021): 45-75; 76-85 selectively
//  cervical    .../cervical-cancer-screening   (final Aug 21, 2018, still current Oct 2026, update in progress): 21-29 cytology q3y; 30-65 cytology q3y, hrHPV q5y or cotest q5y
//  lung        .../lung-cancer-screening       (final 2021): yearly LDCT 50-80, >= 20 pack-years, smokes now or quit within 15 years
//  prostate    .../prostate-cancer-screening   (final May 8, 2018, still current Oct 2026, update in progress): 55-69 individual decision; 70+ against
const assert = require('node:assert/strict');
const R = require('../js/rules.js');
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}
const topic = (p, k, l) => R.evaluate(p, l).topics.find(t => t.key === k);
const W = (age, x = {}) => ({ label: 'W', age, breasts: true, cervix: true, uterus: true, smoking: 'never', ...x });
const M = (age, x = {}) => ({ label: 'M', age, prostate: true, smoking: 'never', ...x });
const chip = (p, k) => { const t = topic(p, k); return t && t.uspstf ? (t.uspstf.differs ? 'Differs' : 'Same') : null; };
console.log('ScreenTalk USPSTF primary-source audit');

test('USPSTF text quotes the published ranges and intervals, EN and ES', () => {
  const en = k => topic(k === 'prostate' ? M(60) : k === 'lung' ? M(60, { smoking: 'current', packYears: 30 }) : W(k === 'cervical' ? 35 : 50), k).uspstf.text;
  assert.match(en('breast'), /every 2 years for women 40 to 74/); assert.match(en('breast'), /75 and older.*not enough evidence/);
  assert.match(en('colorectal'), /45 to 75/); assert.match(en('colorectal'), /76 to 85/);
  assert.match(en('cervical'), /every 3 years from 21 to 29/); assert.match(en('cervical'), /30 to 65.*every 3 years.*HPV test every 5 years.*both together every 5 years/);
  assert.match(en('lung'), /50 to 80 with a 20 pack-year/); assert.match(en('lung'), /quit within the past 15 years/);
  assert.match(en('prostate'), /55 to 69/); assert.match(en('prostate'), /against routine PSA screening at 70 and older/);
  const es = topic(W(50), 'breast', 'es').uspstf.text; assert.match(es, /cada 2 años para mujeres de 40 a 74/);
  assert.match(topic(M(60), 'prostate', 'es').uspstf.text, /55 a 69/);
});

test('final-statement dates and links point at the current USPSTF pages', () => {
  const t = topic(W(50), 'breast').uspstf;
  assert.equal(t.final, '2024-04-30'); assert.equal(t.source, 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening');
  assert.equal(topic(W(35), 'cervical').uspstf.final, '2018-08-21');
  assert.equal(topic(M(60), 'prostate').uspstf.final, '2018-05-08');
  assert.match(topic(W(35), 'cervical').uspstf.text, /update is in progress/);
  assert.match(topic(M(60), 'prostate').uspstf.text, /update is in progress/);
});

test('breast chip at every edge: ACS yearly 45-54 vs USPSTF biennial -> Differs; 55-74 Same; 75+ (USPSTF: insufficient) Differs', () => {
  assert.equal(chip(W(46), 'breast'), 'Differs'); assert.equal(chip(W(54), 'breast'), 'Differs');
  assert.equal(chip(W(55), 'breast'), 'Same'); assert.equal(chip(W(74), 'breast'), 'Same');
  assert.equal(chip(W(75), 'breast'), 'Differs');
});

test('cervical chip: 21-29 Differs (ACS: primary HPV from 25; USPSTF: Pap every 3 years), 30-65 Same', () => {
  for (const a of [25, 29]) assert.equal(chip(W(a), 'cervical'), 'Differs', 'age ' + a);
  for (const a of [30, 45, 65]) assert.equal(chip(W(a), 'cervical'), 'Same', 'age ' + a);
});

test('colorectal chip: Same at 45, 60 and 75 (same ages as ACS)', () => {
  for (const a of [45, 60, 75]) assert.equal(chip(W(a), 'colorectal'), 'Same', 'age ' + a);
});

test('prostate chip: Differs before 55 and from 70 (USPSTF D), Same 55-69', () => {
  assert.equal(chip(M(50), 'prostate'), 'Differs'); assert.equal(chip(M(54), 'prostate'), 'Differs');
  assert.equal(chip(M(55), 'prostate'), 'Same'); assert.equal(chip(M(69), 'prostate'), 'Same');
  assert.equal(chip(M(70), 'prostate'), 'Differs');
});

test('lung: smokes now 50-80 with 20 pack-years -> Same; quit 15 years ago Same, 16 Differs (USPSTF 15-year stop rule)', () => {
  assert.equal(chip(M(50, { smoking: 'current', packYears: 20 }), 'lung'), 'Same');
  assert.equal(chip(M(80, { smoking: 'current', packYears: 20 }), 'lung'), 'Same');
  assert.equal(chip(M(60, { smoking: 'former', packYears: 30, quitYears: 15 }), 'lung'), 'Same');
  assert.equal(chip(M(60, { smoking: 'former', packYears: 30, quitYears: 16 }), 'lung'), 'Differs');
  assert.equal(R.packYears(1, 20), 20, '1 pack a day for 20 years = 20 pack-years (USPSTF definition)');
});

console.log(`\n${passed} passed, ${failed} failed`);
