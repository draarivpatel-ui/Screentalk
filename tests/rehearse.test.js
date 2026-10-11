// Run with: node tests/rehearse.test.js
// Checks the "Rehearse the talk" content and engine: sources, both languages, branching, scoring.
const assert = require('node:assert/strict');
const X = require('../js/rehearse.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}
const strongIdx = r => X.ROUNDS[r].options.findIndex(o => o.quality === 'strong');
const weakIdx = r => X.ROUNDS[r].options.findIndex(o => o.quality === 'weak');
const okIdx = r => X.ROUNDS[r].options.findIndex(o => o.quality === 'ok');
const play = (pickFn, opts = {}) => {
  let s = X.create({ seed: 7, ...opts });
  for (let r = 0; r < X.ROUNDS.length; r++) s = X.choose(s, pickFn(r));
  return s;
};

console.log('ScreenTalk rehearsal');

test('covers the five pushbacks: feel fine, family history, colonoscopy fear, cost, time', () => {
  assert.deepEqual(X.ROUNDS.map(r => r.key), ['fine', 'family', 'scared', 'cost', 'time']);
});

test('each round has exactly one strong, one okay, and one weak reply', () => {
  X.ROUNDS.forEach(r => {
    assert.deepEqual(r.options.map(o => o.quality).sort(), ['ok', 'strong', 'weak']);
  });
});

test('every reply, reaction, tip, and parent line exists in English and Spanish, and they differ', () => {
  X.ROUNDS.forEach(r => {
    ['label', 'open', 'guarded'].forEach(k => X.LANGS.forEach(l => assert.ok(r[k][l] && r[k][l].length > 3, r.key + ' ' + k + ' ' + l)));
    assert.notEqual(r.open.en, r.open.es);
    r.options.forEach(o => ['text', 'reply', 'tip'].forEach(k => {
      X.LANGS.forEach(l => assert.ok(o[k][l] && o[k][l].length > 10, r.key + ' ' + k + ' ' + l));
      assert.notEqual(o[k].en, o[k].es, r.key + ' ' + k + ' not translated');
    }));
  });
});

test('every coaching tip cites at least one ACS, NCI, or CDC page over https', () => {
  X.ROUNDS.forEach(r => r.options.forEach(o => {
    assert.ok(o.src.length >= 1, r.key + ' ' + o.quality + ' has no source');
    o.src.forEach(k => {
      const s = X.SOURCES[k];
      assert.ok(s, 'unknown source ' + k);
      assert.match(s.url, /^https:\/\/www\.(cancer\.org|cancer\.gov|cdc\.gov)\//);
      assert.ok(['ACS', 'NCI', 'CDC'].includes(s.org));
    });
  }));
});

test('all three organizations (ACS, NCI, CDC) are used, and every listed source is cited somewhere', () => {
  const used = new Set();
  X.ROUNDS.forEach(r => r.options.forEach(o => o.src.forEach(k => used.add(k))));
  assert.deepEqual([...new Set([...used].map(k => X.SOURCES[k].org))].sort(), ['ACS', 'CDC', 'NCI']);
  assert.deepEqual([...used].sort(), Object.keys(X.SOURCES).sort());
});

test('the facts behind the strong replies match their sources', () => {
  const tip = k => X.ROUNDS.find(r => r.key === k).options.find(o => o.quality === 'strong').tip.en;
  assert.match(tip('fine'), /don\u2019t always cause symptoms/);
  assert.match(tip('family'), /5 to 10%/);
  assert.match(tip('family'), /without a family history/);
  assert.match(tip('scared'), /no matter which test/);
  assert.match(tip('cost'), /no co-pays or deductibles/);
  assert.match(tip('cost'), /free or low-cost mammograms/);
});

test('no diagnostic or risk-score language in any line', () => {
  const banned = /(you need (a|to get)|you have cancer|your risk is|risk score|guarantee|100% safe|tienes cáncer|tu riesgo es)/i;
  X.ROUNDS.forEach(r => {
    const all = [r.open, r.guarded].concat(...r.options.map(o => [o.text, o.reply, o.tip]));
    all.forEach(t => X.LANGS.forEach(l => assert.doesNotMatch(t[l], banned, t[l])));
  });
});

test('interface strings have the same keys in English and Spanish', () => {
  const keys = o => Object.keys(o).sort();
  assert.deepEqual(keys(X.STRINGS.es), keys(X.STRINGS.en));
  ['parents', 'quality', 'rating', 'ending'].forEach(k => assert.deepEqual(keys(X.STRINGS.es[k]), keys(X.STRINGS.en[k])));
});

test('all strong replies = perfect 10, "ready", parent agrees to a next step', () => {
  const s = play(strongIdx);
  assert.ok(X.isDone(s));
  const res = X.result(s, 'en');
  assert.equal(res.score, 10); assert.equal(res.max, 10);
  assert.equal(res.rating, 'ready');
  assert.equal(res.ending, 'yes');
  assert.match(res.endingText, /^Mom: /);
  assert.equal(res.rounds.length, 5);
  assert.ok(res.rounds.every(r => r.quality === 'strong'));
});

test('all weak replies = 0, "practice", parent shuts it down, and review shows the better line', () => {
  const s = play(weakIdx, { parent: 'dad' });
  const res = X.result(s, 'es');
  assert.equal(res.score, 0);
  assert.equal(res.rating, 'practice');
  assert.equal(res.ending, 'no');
  assert.match(res.endingText, /^Papá: /);
  res.rounds.forEach((r, i) => {
    assert.equal(r.best, X.ROUNDS[i].options[strongIdx(i)].text.es);
    assert.equal(r.tip, X.ROUNDS[i].options[strongIdx(i)].tip.es);
    assert.ok(r.sources.length >= 1);
  });
});

test('all okay replies = 5 points, middle ending', () => {
  const res = X.result(play(okIdx), 'en');
  assert.equal(res.score, 5);
  assert.equal(res.rating, 'practice');
  assert.equal(res.ending, 'maybe'); // okay replies keep the door open but don't win the parent over
});

test('rating thresholds: 9-10 ready, 6-8 almost, 0-5 practice', () => {
  assert.equal(X.ratingKey(10), 'ready'); assert.equal(X.ratingKey(9), 'ready');
  assert.equal(X.ratingKey(8), 'almost'); assert.equal(X.ratingKey(6), 'almost');
  assert.equal(X.ratingKey(5), 'practice'); assert.equal(X.ratingKey(0), 'practice');
  assert.equal(X.endingKey(70), 'yes'); assert.equal(X.endingKey(69), 'maybe');
  assert.equal(X.endingKey(40), 'maybe'); assert.equal(X.endingKey(39), 'no');
});

test('branching: a weak reply makes the parent open the next round guarded; a strong one keeps them open', () => {
  let s = X.create({ seed: 1 });
  s = X.choose(s, weakIdx(0));
  assert.equal(s.mood, 35);
  assert.equal(X.parentLine(s, 'en'), X.ROUNDS[1].guarded.en);
  let t = X.create({ seed: 1 });
  t = X.choose(t, strongIdx(0));
  assert.equal(t.mood, 70);
  assert.equal(X.parentLine(t, 'es'), X.ROUNDS[1].open.es);
  assert.equal(t.picks[0].opened, 'open');
});

test('openness stays between 0 and 100, and choosing after the end changes nothing', () => {
  let s = play(weakIdx);
  assert.equal(s.mood, 0);
  const again = X.choose(s, 0);
  assert.equal(again, s);
  assert.equal(play(strongIdx).mood, 100);
  assert.equal(X.choose(X.create({ seed: 2 }), 99).round, 0); // bad index ignored
});

test('option order is shuffled per round but reproducible with a seed, and always has all 3', () => {
  const a = X.create({ seed: 42 }), b = X.create({ seed: 42 });
  assert.deepEqual(a.order, b.order);
  a.order.forEach(o => assert.deepEqual([...o].sort(), [0, 1, 2]));
  const orders = new Set();
  for (let seed = 1; seed < 40; seed++) orders.add(JSON.stringify(X.create({ seed }).order[0]));
  assert.ok(orders.size > 1, 'never shuffles');
  assert.deepEqual(X.create({ shuffle: false }).order[0], [0, 1, 2]);
  assert.equal(X.options(a, 'en').length, 3);
});

test('feedback returns the reaction, tip, and named sources in the chosen language', () => {
  const f = X.feedback(3, strongIdx(3), 'es');
  assert.equal(f.quality, 'strong');
  assert.equal(f.label, 'Muy buena respuesta');
  assert.match(f.reply, /copago/);
  assert.ok(f.sources.every(s => /en inglés/.test(s.name)));
  assert.equal(X.feedback(0, weakIdx(0), 'xx').label, 'That backfired'); // unknown language falls back to English
});

test('parent names and fmt placeholders', () => {
  assert.equal(X.parentName('es', 'grandma'), 'Abuela');
  assert.equal(X.parentName('en', 'nope'), 'Mom');
  assert.equal(X.fmt('Round {n} of {t}', { n: 2, t: 5 }), 'Round 2 of 5');
  assert.equal(X.fmt('{p}', {}), '{p}');
  assert.equal(X.create({ parent: 'hacker' }).parent, 'mom');
});

console.log(`\n${passed} passed, ${failed} failed`);
