// Run with: node tests/backup.test.js (also run by tests/rules.test.js)
// Back up / Restore (js/content.js backupText + parseBackup) and the one-time navigator.storage.persist() request. Drafted by Hark.
const assert = require('node:assert/strict');
const R = require('../js/rules.js');
const C = require('../js/content.js');
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}
console.log('ScreenTalk Back up / Restore');
const family = () => C.demoFamily(['Mom', 'Dad', 'Nana', 'Big sis']).map((p, i) => ({ ...C.sanitizePerson(p, R.packYears), id: 'p' + i, progress: i ? 'not-started' : 'booked' }));

test('round trip: back up then restore gives the same people, progress and habits', () => {
  const state = { people: family(), habits: { 0: true, 3: true } };
  const b = C.parseBackup(C.backupText(state, '2026-10-14T12:00:00.000Z'), R.packYears);
  assert.equal(b.ok, true);
  assert.deepEqual(b.people, state.people);
  assert.deepEqual(b.habits, { 0: true, 3: true });
  assert.deepEqual(C.parseBackup(C.backupText(b, 'x'), R.packYears), b);
  const empty = C.parseBackup(C.backupText({ people: [], habits: {} }, 'x'), R.packYears);
  assert.deepEqual(empty, { ok: true, people: [], habits: {} });
});
test('malformed JSON is refused', () => {
  for (const t of ['', '{', 'nope', '{"people": [', "{'people':[]}", undefined, null, 7, {}])
    assert.deepEqual(C.parseBackup(t, R.packYears), { ok: false, error: 'bad_json' }, String(t));
});
test('valid JSON that is not a ScreenTalk backup is refused', () => {
  for (const t of ['null', '1', '"x"', '[]', '{}', '{"people":{}}', '{"people":"Mom"}', '{"people":[1,"a",null,[]]}',
    '{"app":"breatheeasy","people":[]}', '{"plan":{},"entries":[]}'])
    assert.deepEqual(C.parseBackup(t, R.packYears), { ok: false, error: 'not_backup' }, t);
});
test('oversized files are refused before parsing (characters and UTF-8 bytes)', () => {
  assert.deepEqual(C.parseBackup(JSON.stringify({ people: [], pad: 'x'.repeat(C.MAX_BACKUP_BYTES) }), R.packYears), { ok: false, error: 'too_big' });
  const wide = JSON.stringify({ people: [{ label: '\u00e1'.repeat(Math.ceil(C.MAX_BACKUP_BYTES / 2) + 10) }] });
  assert.ok(wide.length < C.MAX_BACKUP_BYTES);
  assert.deepEqual(C.parseBackup(wide, R.packYears), { ok: false, error: 'too_big' });
});
test('hand-edited people are cleaned, capped at 30, ids made unique, junk habits dropped', () => {
  const t = JSON.stringify({ people: [{ id: 'a', label: 'X'.repeat(80), age: 300, smoking: 'lots' }, { id: 'a', label: 'Twin', age: 50 }, 'junk',
    ...Array.from({ length: 40 }, (_, i) => ({ id: 'z' + i, label: 'P' + i, age: 40 }))], habits: { 0: true, 1: 'yes', x: true, __proto__: { polluted: true }, 2: false } });
  const b = C.parseBackup(t, R.packYears);
  assert.equal(b.ok, true); assert.equal(b.people.length, 30);
  assert.equal(b.people[0].label.length, 24); assert.equal(b.people[0].age, 0); assert.equal(b.people[0].smoking, 'never');
  assert.equal(new Set(b.people.map(p => p.id)).size, 30);
  assert.deepEqual(b.habits, { 0: true }); assert.equal({}.polluted, undefined);
});
const fakeStorage = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m }; };
test('storage.persist() is asked once per browser profile', () => {
  let calls = 0; const nav = { storage: { persist: () => { calls++; return Promise.resolve(true); } } }; const ls = fakeStorage();
  assert.equal(C.requestPersist(nav, ls, 'k'), true);
  assert.equal(C.requestPersist(nav, ls, 'k'), false);
  assert.equal(calls, 1); assert.equal(ls.m.k, '1');
});
test('storage.persist(): missing API, rejection or blocked storage never throw', () => {
  const ls = fakeStorage();
  assert.equal(C.requestPersist({}, ls, 'k'), false); assert.equal(C.requestPersist({ storage: {} }, ls, 'k'), false);
  assert.equal(ls.m.k, undefined);
  assert.equal(C.requestPersist({ storage: { persist: () => Promise.reject(new Error('no')) } }, ls, 'k'), true);
  const bad = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.equal(C.requestPersist({ storage: { persist: () => { throw new Error('x'); } } }, bad, 'k'), false);
});
console.log(`\n${passed} passed, ${failed} failed`);
