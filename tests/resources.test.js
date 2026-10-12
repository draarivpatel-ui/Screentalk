// Run with: node tests/resources.test.js
// The free/low-cost screening resource (NBCCEDP) must keep its ages and its "state rules vary" hedge in EN and ES
// (ACS NBCCEDP page rev. May 27, 2026: ages 40-64 breast, 21-64 cervical), and the resource cards must wrap on a phone.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/content.js');
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}
const css = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf8');
const find = l => C.resources(l).find(r => /NBCCEDP|Programa Nacional de Detecci/.test(r.detail) || /screening/i.test(r.name) || /mama y cuello/.test(r.name));
console.log('ScreenTalk resources claims');

test('NBCCEDP card (EN) keeps both age ranges, the income/insurance condition and the state-rules hedge', () => {
  const r = find('en'); assert.ok(r, 'card exists');
  assert.match(r.detail, /40-64 \(breast\)/); assert.match(r.detail, /21-64 \(cervical\)/);
  assert.match(r.detail, /low-income/); assert.match(r.detail, /little or no insurance/);
  assert.match(r.detail, /state rules vary/); assert.match(r.detail, /1-800-232-4636/);
  assert.match(r.href, /^https:\/\/www\.cancer\.org\//);
});

test('NBCCEDP card (ES) keeps the same ages, conditions and hedge, and points at the CDC Spanish page', () => {
  const r = find('es'); assert.ok(r, 'card exists');
  assert.match(r.detail, /de 40 a 64 años \(mama\)/); assert.match(r.detail, /de 21 a 64 años \(cuello uterino\)/);
  assert.match(r.detail, /bajos ingresos/); assert.match(r.detail, /poco o ningún seguro/);
  assert.match(r.detail, /las reglas varían según el estado/); assert.match(r.detail, /1-800-232-4636/);
  assert.match(r.href, /^https:\/\/www\.cdc\.gov\/breast-cervical-cancer-screening\/es\//);
});

// Age source: CDC 'About the Vaccines for Children (VFC) Program' (cdc.gov/vaccines-for-children/about/): eligible children "ages 18 or younger" = under 19. The linked CDC HPV ES page does not print the age.
test('VFC card keeps "under 19" in EN and "menores de 19" in ES', () => {
  const en = C.resources('en').find(r => /Vaccines for Children/.test(r.detail));
  const es = C.resources('es').find(r => /Vacunas para Niños/.test(r.detail));
  assert.match(en.detail, /under 19/); assert.match(es.detail, /menores de 19 años/);
  assert.match(en.detail, /1-800-232-4636/); assert.match(es.detail, /1-800-232-4636/);
});

test('every resource has a name, detail and https or tel link in both languages; same count EN/ES', () => {
  const en = C.resources('en'), es = C.resources('es');
  assert.equal(en.length, es.length);
  for (const r of [...en, ...es]) { assert.ok(r.name && r.detail); assert.match(r.href, /^(https:\/\/|tel:)/); }
});

test('phone layout: one column at 560px, and long text in a card cannot widen the page', () => {
  assert.match(css, /@media \(max-width: 560px\)\s*\{[^}]*\.resources[^}]*grid-template-columns: 1fr;/);
  // an unbreakable string longer than a 390px card must wrap, and grid items must be allowed to shrink
  assert.match(css, /\.resources a\.card\s*\{[^}]*min-width: 0/);
  assert.match(css, /\.resources (h3, \.resources p|p, \.resources h3)\s*\{[^}]*overflow-wrap: anywhere/);
  const longest = Math.max(...['en', 'es'].flatMap(l => C.resources(l).flatMap(r => (r.name + ' ' + r.detail).split(/\s+/).map(w => w.length))));
  assert.ok(longest <= 30, 'longest word ' + longest + ' chars');
});

// Quit-tobacco card, sources re-read Oct 12, 2026:
//  EN: ACS Empowered to Quit (cancer.org/.../empowered-to-quit.html): free, email-based program; ACS helpline
//      1-800-227-2345 "Available any time of day or night" and lists "Tobacco-related topics".
//  ES: NCI (cancer.gov/espanol/contactenos): "Llame al 1-877-448-7848 (1-877-44U-QUIT)"; "Todos los servicios
//      están disponibles en español e inglés de lunes a viernes, de 9:00 a. m. a 9 p. m., hora del Este".
test('quit-tobacco card (EN) names ACS Empowered to Quit + the 24/7 ACS line, linked to the ACS program page', () => {
  const r = C.resources('en').find(r => /quit tobacco/i.test(r.name)); assert.ok(r, 'card exists');
  assert.match(r.name, /^Free help to quit tobacco$/);
  assert.match(r.detail, /Empowered to Quit/); assert.match(r.detail, /1-800-227-2345/);
  assert.equal(r.href, 'https://www.cancer.org/cancer/risk-prevention/tobacco/empowered-to-quit.html');
});

test('quit-tobacco card (ES) gives the NCI quit line 1-877-448-7848, says Spanish and English, links the NCI Spanish contact page', () => {
  const r = C.resources('es').find(r => /dejar el tabaco/.test(r.name)); assert.ok(r, 'card exists');
  assert.match(r.detail, /1-877-448-7848/); assert.match(r.detail, /NCI/);
  assert.match(r.detail, /en español e inglés/);
  assert.equal(r.href, 'https://www.cancer.gov/espanol/contactenos');
  // the card must not promise hours the source doesn't give (24/7 is the ACS line, not the NCI quit line)
  assert.doesNotMatch(r.detail, /24\/7|cualquier hora/);
});

console.log(`\n${passed} passed, ${failed} failed`);
