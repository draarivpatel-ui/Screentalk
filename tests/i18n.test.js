// Run with: node tests/i18n.test.js (also run by tests/rules.test.js)
// English and Spanish must have the same keys, the same {placeholders}, and the same medical logic.
// Spanish medical terms must match the CDC/NCI Spanish wording in docs/glossary-es.md.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const I = require('../js/i18n.js');
const R = require('../js/rules.js');
const C = require('../js/content.js');
const X = require('../js/rehearse.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}

// Walk two parallel trees and report any key, type, array-length, or placeholder mismatch.
function compareTrees(en, es, where, problems) {
  if (typeof en === 'string') {
    if (typeof es !== 'string') { problems.push(where + ': missing or not a string in Spanish'); return; }
    if (en.trim() && !es.trim()) problems.push(where + ': empty in Spanish');
    const ph = s => (s.match(/\{\w+\}/g) || []).sort().join(',');
    if (ph(en) !== ph(es)) problems.push(where + ': placeholders differ (' + ph(en) + ' vs ' + ph(es) + ')');
    return;
  }
  if (Array.isArray(en)) {
    if (!Array.isArray(es) || es.length !== en.length) { problems.push(where + ': array length differs'); return; }
    en.forEach((v, i) => compareTrees(v, es[i], where + '[' + i + ']', problems));
    return;
  }
  if (en && typeof en === 'object') {
    if (!es || typeof es !== 'object') { problems.push(where + ': missing object in Spanish'); return; }
    Object.keys(en).forEach(k => { if (!(k in es)) problems.push(where + '.' + k + ': missing in Spanish'); else compareTrees(en[k], es[k], where + '.' + k, problems); });
    Object.keys(es).forEach(k => { if (!(k in en)) problems.push(where + '.' + k + ': extra key only in Spanish'); });
  }
}
function sameKeys(table, name) {
  const problems = [];
  compareTrees(table.en, table.es, name, problems);
  assert.deepEqual(problems, []);
}
// Every string leaf, for wording checks.
function leaves(o, out = []) {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach(v => leaves(v, out));
  else if (o && typeof o === 'object') Object.values(o).forEach(v => leaves(v, out));
  return out;
}

const F = (age, extra = {}) => ({ label: 'F', age, breasts: true, cervix: true, uterus: true, ...extra });
const M = (age, extra = {}) => ({ label: 'M', age, prostate: true, ...extra });

console.log('ScreenTalk English/Spanish');

test('UI strings (i18n.js): same keys, placeholders, and array lengths in English and Spanish', () => sameKeys(I.STRINGS, 'i18n'));
test('Rules text (rules.js): same keys and placeholders', () => sameKeys(R.TEXT, 'rules'));
test('Content text (starters, topic phrases, questions, sheet): same keys and placeholders', () => {
  sameKeys(C.STARTER, 'starter'); sameKeys(C.TOPIC_PHRASES, 'topics'); sameKeys(C.QUESTIONS, 'questions'); sameKeys(C.SHEET, 'sheet');
});
test('Rehearsal strings (rehearse.js): same keys and placeholders', () => sameKeys(X.STRINGS, 'rehearse'));

test('every data-i18n key used in index.html exists in both languages', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const keys = new Set();
  for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) keys.add(m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) m[1].split(';').forEach(p => keys.add(p.split(':')[1].trim()));
  assert.ok(keys.size > 60, 'expected many translated elements, got ' + keys.size);
  const missing = [...keys].filter(k => typeof I.STRINGS.en[k] !== 'string' || typeof I.STRINGS.es[k] !== 'string');
  assert.deepEqual(missing, []);
});

test('Spanish strings are actually translated (not copies of the English)', () => {
  const same = [];
  const walk = (en, es, where) => {
    if (typeof en === 'string') { if (en.replace(/\{\w+\}/g, '').replace(/[^A-Za-z]/g, '').length > 6 && en === es) same.push(where); return; }
    if (en && typeof en === 'object') Object.keys(en).forEach(k => walk(en[k], es && es[k], where + '.' + k));
  };
  walk(I.STRINGS.en, I.STRINGS.es, 'i18n'); walk(R.TEXT.en, R.TEXT.es, 'rules');
  walk(C.STARTER.en, C.STARTER.es, 'starter'); walk(C.QUESTIONS.en, C.QUESTIONS.es, 'questions'); walk(C.SHEET.en, C.SHEET.es, 'sheet');
  assert.deepEqual(same, []);
});

test('Spanish plan has the same topics, statuses, and ages as English for every age and profile', () => {
  for (let age = 0; age <= 120; age++) {
    const people = [
      F(age, { menopause: age > 50, familyHistory: true, smoking: 'current', packYears: 30 }),
      M(age, { africanAmerican: age % 2 === 0, prostateFamily: age % 3 === 0 ? 'multiple' : 'none', smoking: 'former', packYears: age % 4 ? 10 : 0 }),
      F(age, { cervix: false, uterus: false })
    ];
    for (const p of people) {
      const en = R.evaluate(p, 'en'), es = R.evaluate(p, 'es');
      assert.deepEqual(es.topics.map(t => [t.key, t.status, t.startsIn, t.source]), en.topics.map(t => [t.key, t.status, t.startsIn, t.source]), 'age ' + age);
      assert.deepEqual(es.timeline, en.timeline);
      assert.equal(es.notes.length, en.notes.length);
      es.topics.forEach(t => {
        assert.ok(t.title && t.summary, 'empty Spanish text at age ' + age);
        assert.notEqual(t.summary, en.topics.find(x => x.key === t.key).summary);
        assert.match(t.sourceEs, /^https:\/\/www\.cdc\.gov\/[a-z-]+\/es\//, t.key + ' Spanish reading link');
      });
    }
  }
  assert.match(R.evaluate({ age: 'x' }, 'es').notes[0], /Escribe una edad/);
});

test('Spanish keeps the numbers that matter: ages, intervals, and pack-years', () => {
  const t = (p, k) => R.evaluate(p, 'es').topics.find(x => x.key === k);
  assert.match(t(F(39), 'breast').summary, /40 años \(dentro de 1 año\)/);
  assert.match(t(F(50), 'breast').summary, /45 a 54 años.*cada año/);
  assert.match(t(F(60), 'breast').summary, /cada 2 años/);
  assert.match(t(M(50), 'colorectal').summary, /45 a los 75/);
  assert.match(t(M(50), 'colorectal').detail, /colonoscopia cada 10 años/);
  assert.match(t(F(30), 'cervical').summary, /prueba del VPH.*cada 5 años/);
  assert.match(t(F(70), 'cervical').detail, /2 pruebas del VPH normales o 3 pruebas de Papanicoláu/);
  assert.match(t(M(60, { smoking: 'former', packYears: 25 }), 'lung').summary, /50 a 80 años.*20 paquetes-año/);
  assert.match(t(M(60, { smoking: 'former', packYears: 5 }), 'lung').summary, /número que escribiste es 5/);
  assert.match(t(M(44, { africanAmerican: true }), 'prostate').summary, /45 años \(dentro de 1 año\)/);
  assert.match(t(M(60), 'prostate').detail, /menos de 10 años/);
  assert.match(t(F(10), 'hpv').summary, /2 dosis/);
});

// CDC/NCI Spanish wording (docs/glossary-es.md). A wrong variant here fails the test.
const ES_TERMS_BANNED = [
  [/Papanicolaou|Papanicolau\b|Papanicolao/i, 'use "Papanicoláu" (CDC)'],
  [/\bmamograma/i, 'use "mamografía" (CDC)'],
  [/colonoscopía/i, 'use "colonoscopia" (CDC)'],
  [/\bcérvix\b|cervical\b/i, 'use "cuello uterino" (CDC)'],
  [/\bHPV\b/, 'use "VPH" in Spanish text'],
  [/paquete-años|paquetes-años|pack-years/i, 'use "paquetes-año" (CDC)'],
  [/\bTAC\b|tomograf[íi]a axial/i, 'use "tomografía computarizada de baja dosis" / "TC de baja dosis" (CDC)'],
  [/c[áa]ncer de seno/i, 'use "cáncer de mama" (CDC) consistently'],
  [/screening|chequeo médico de detección/i, 'use "pruebas de detección" (CDC)']
];
function spanishTexts() {
  const out = [];
  leaves(I.STRINGS.es, out); leaves(R.TEXT.es, out); leaves(C.STARTER.es, out); leaves(C.TOPIC_PHRASES.es, out);
  leaves(C.QUESTIONS.es, out); leaves(C.SHEET.es, out); C.HABITS_ES.forEach(h => out.push(h));
  C.CARDS.forEach(c => out.push(c.es.claim, c.es.why)); C.RESOURCES.forEach(r => out.push(r.es.name, r.es.detail));
  C.PROGRESS.forEach(p => out.push(p.es));
  leaves(X.STRINGS.es, out);
  X.ROUNDS.forEach(r => { ['label', 'open', 'guarded'].forEach(k => out.push(r[k].es)); r.options.forEach(o => ['text', 'reply', 'tip'].forEach(k => out.push(o[k].es))); });
  // Leave out English page titles we quote on purpose, URLs, and the English-only footer links' hrefs.
  return out.map(s => s.replace(/cancer\.org\/\S+/g, '').replace(/<a [^>]*>/g, '').replace(/\u201cTake control of your health\u201d/g, '')).map(s => s.replace(/"https?:[^"]+"/g, ''));
}
test('Spanish medical terms match the CDC/NCI Spanish pages (Papanicoláu, mamografía, VPH, paquetes-año...)', () => {
  const texts = spanishTexts();
  const bad = [];
  texts.forEach(s => ES_TERMS_BANNED.forEach(([re, why]) => { if (re.test(s)) bad.push(why + ': ' + s.slice(0, 90)); }));
  assert.deepEqual(bad, []);
  const all = texts.join(' ');
  ['pruebas de detección', 'mamografía', 'colonoscopia', 'prueba inmunoquímica fecal', 'cuello uterino', 'prueba del VPH', 'Papanicoláu',
    'tomografía computarizada de baja dosis', 'paquetes-año', 'antígeno prostático específico', 'tacto rectal', 'vacuna contra el VPH', 'síndrome de Lynch']
    .forEach(term => assert.ok(all.includes(term), 'expected CDC/NCI term in Spanish text: ' + term));
});

test('Spanish never uses diagnostic or risk-score language', () => {
  const banned = /(tienes cáncer|tiene cáncer\b|te diagnostica|tu riesgo es|puntaje de riesgo|% de probabilidad|necesitas una|estás en riesgo)/i;
  [F(20), F(42), F(50, { menopause: true, familyHistory: true }), F(70), M(30), M(55, { smoking: 'current', packYears: 30 }), M(90)].forEach(p => {
    const r = R.evaluate(p, 'es');
    r.topics.forEach(t => assert.ok(!banned.test(t.summary + ' ' + t.detail + ' ' + (t.extra || '')), t.title));
    r.notes.forEach(n => assert.ok(!banned.test(n), n));
    ['casual', 'heartfelt', 'text'].forEach(tone => assert.ok(!banned.test(C.starter('X', r.topics, tone, 'es'))));
  });
});

test('Spanish conversation starters name the person and the topics for every tone', () => {
  ['casual', 'heartfelt', 'text'].forEach(tone => {
    const s = C.starter('Mamá', R.evaluate(F(47), 'es').topics, tone, 'es');
    assert.match(s, /Mamá/);
    assert.match(s, /mamografías/);
    assert.match(s, /cáncer de colon/);
    assert.match(s, /Sociedad Americana Contra el Cáncer/);
    assert.ok(!/ and |Hey|doctor about/.test(s), 'English left in: ' + s);
  });
  assert.match(C.starter('Hermano', R.evaluate(M(30), 'es').topics, 'text', 'es'), /dentro de 15 años/);
  assert.match(C.starter('Abuela', R.evaluate(F(71, { menopause: true }), 'es').topics, 'heartfelt', 'es'), /cáncer de útero/);
  assert.match(C.starter('', [], 'casual', 'es'), /familia/);
  assert.equal(C.joinList(['a', 'b', 'c'], 'es'), 'a, b y c');
  assert.equal(C.joinList(['a', 'b', 'c'], 'en'), 'a, b, and c');
  assert.ok(!/lung|pulmón/i.test(C.starter('Papá', R.evaluate(M(60, { smoking: 'former', packYears: 5 }), 'es').topics, 'casual', 'es')));
});

test('Spanish checkup sheet rows carry the USPSTF and no-copay lines in Spanish', () => {
  const dad = { label: 'Papá', age: 52, prostate: true, smoking: 'former', ppd: '1', years: '22', packYears: 22 };
  const d = C.checkupSheet(dad, R.evaluate(dad, 'es'), 'es');
  const en = C.checkupSheet(dad, R.evaluate(dad, 'en'), 'en');
  const row = (x, k) => x.rows.find(r => r.key === k);
  ['colorectal', 'lung', 'prostate'].forEach(k => {
    assert.equal(row(d, k).uspstf.differs, row(en, k).uspstf.differs);
    assert.equal(!!row(d, k).cost, !!row(en, k).cost);
    assert.notEqual(row(d, k).uspstf.text, row(en, k).uspstf.text);
  });
  assert.match(row(d, 'colorectal').uspstf.text, /^USPSTF: pruebas de detección para adultos de 45 a 75/);
  assert.ok(row(d, 'lung').cost.length > 0 && !/copay\b|health plans/.test(row(d, 'lung').cost));
  assert.equal(row(d, 'lung').costTag, 'Sin copago*');
  assert.match(d.costNote, /^\* Sin copago: .*sin copago ni deducible.*últimos 15 años\.$/);
});

test('Spanish checkup sheet: title, rows, statuses, tests, pack-years, questions, footer', () => {
  const dad = { label: 'Papá', age: 52, prostate: true, smoking: 'former', ppd: '1', years: '22', packYears: 22 };
  const d = C.checkupSheet(dad, R.evaluate(dad, 'es'), 'es');
  const en = C.checkupSheet(dad, R.evaluate(dad, 'en'), 'en');
  assert.equal(d.title, 'Hoja para el chequeo: Papá, 52 años');
  assert.deepEqual(d.rows.map(r => r.key), en.rows.map(r => r.key));
  assert.equal(d.rows.find(r => r.key === 'prostate').statusLabel, 'Una opción para conversar');
  assert.equal(d.rows.find(r => r.key === 'lung').test, 'TC de baja dosis');
  assert.equal(d.smoking, 'Fumaba antes \u00b7 unos 22 paquetes-año (1 paquete al día durante 22 años)');
  assert.deepEqual(d.questions, C.questions(dad, R.evaluate(dad, 'es').topics, 'es'));
  assert.equal(d.questions.length, en.questions.length);
  assert.match(d.footer, /no es consejo médico/);
  const sis = { label: 'Hermana', age: 19, breasts: true, cervix: true, uterus: true };
  const s2 = C.checkupSheet(sis, R.evaluate(sis, 'es'), 'es');
  assert.ok(s2.later.includes('Detección del cáncer de cuello uterino a los 25'));
  assert.ok(s2.later.includes('Detección del cáncer de mama a los 40'));
  assert.equal(C.checkupSheet({ age: 90 }, R.evaluate({ age: 90 }, 'es'), 'es').title, 'Hoja para el chequeo: Familiar, 90 años');
  assert.match(C.checkupSheet({ age: 60, smoking: 'current' }, R.evaluate({ age: 60, smoking: 'current' }, 'es'), 'es').smoking, /sin escribir/);
});

test('Spanish questions follow the same topics as English, one for one', () => {
  [M(60, { smoking: 'current', packYears: 30 }), F(42), F(70, { menopause: true }), M(20), M(80)].forEach(p => {
    const en = C.questions({ familyHistory: true }, R.evaluate(p, 'en').topics, 'en');
    const es = C.questions({ familyHistory: true }, R.evaluate(p, 'es').topics, 'es');
    assert.equal(es.length, en.length);
    es.forEach(q => assert.match(q, /^(¿|Con )/));
  });
});

test('Myth-or-Fact, habits, resources, and progress all have Spanish; Spanish sources are Spanish pages when one exists', () => {
  C.CARDS.forEach(c => {
    assert.ok(c.es && c.es.claim && c.es.why.length > 30 && c.es.srcName, c.claim);
    const card = C.card(c, 'es');
    assert.equal(card.answer, c.answer);
    if (/cancer\.gov/.test(c.src)) assert.equal(card.src, 'https://www.cancer.gov/espanol/cancer/causas-prevencion/riesgo/mitos');
    else assert.ok(card.src === c.src && /\(en inglés\)/.test(card.srcName), 'English-only page must say "(en inglés)": ' + c.claim);
  });
  assert.equal(C.HABITS_ES.length, C.HABITS.length);
  assert.deepEqual(C.habits('es'), C.HABITS_ES);
  C.RESOURCES.forEach(r => { assert.ok(r.es.name && r.es.detail); assert.match(r.es.href, /^(https:\/\/|tel:)/); });
  assert.equal(C.resources('es').length, C.RESOURCES.length);
  C.PROGRESS.forEach(p => assert.ok(p.es && p.es !== p.label));
});

test('every Spanish link in the app is https and goes to ACS, NCI, CDC, USPSTF, or CuidadoDeSalud.gov', () => {
  const urls = [];
  leaves(I.STRINGS.es).forEach(s => { for (const m of s.matchAll(/href="([^"]+)"/g)) urls.push(m[1]); });
  Object.values(R.SOURCES_ES).forEach(u => urls.push(u));
  C.CARDS.forEach(c => urls.push(c.es.src));
  C.RESOURCES.forEach(r => { if (!r.es.href.startsWith('tel:')) urls.push(r.es.href); });
  assert.ok(urls.length > 20);
  Object.values(R.SOURCES_US).forEach(u => urls.push(u));
  Object.values(R.SOURCES_COST.es).forEach(u => urls.push(u));
  urls.forEach(u => assert.match(u, /^https:\/\/www\.(cancer\.org|cancer\.gov|cdc\.gov|uspreventiveservicestaskforce\.org|cuidadodesalud\.gov)\//, u));
  Object.values(R.SOURCES_COST.es).forEach(u => assert.match(u, /cuidadodesalud\.gov\/es\//, 'Spanish cost link should be the Spanish HealthCare.gov page: ' + u));
});

test('the Spanish UI says a native-speaker review is pending (top of page and footer)', () => {
  assert.match(I.STRINGS.es.reviewNote, /pendiente de revisión por un hablante nativo/);
  assert.match(I.STRINGS.es.footer, /pendiente de revisión por un hablante nativo/);
  assert.match(I.STRINGS.en.footer, /waiting for review by a native speaker/);
});

test('t() falls back to English for unknown languages; fmt fills placeholders', () => {
  assert.equal(I.t('fr', 'navPlan'), 'Family plan');
  assert.equal(I.t('es', 'navPlan'), 'Plan familiar');
  assert.equal(I.fmt(I.t('es', 'gameCard'), { n: 2, t: 12 }), 'Tarjeta 2 de 12');
  assert.equal(R.evaluate(F(50), 'fr').topics[0].title, R.evaluate(F(50)).topics[0].title);
});

test('page has a no-JavaScript fallback in both languages with the ACS helpline and a CSP-safe style', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const ns = html.match(/<noscript>([\s\S]*?)<\/noscript>/);
  assert.ok(ns, 'noscript block exists');
  assert.match(ns[1], /1-800-227-2345/);
  assert.match(ns[1], /lang="es"/);
  assert.doesNotMatch(ns[1], /style=/, 'no inline style (CSP style-src self)');
});

console.log(`\n${passed} passed, ${failed} failed`);
