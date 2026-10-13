// Run with: node tests/docs.test.js (also run by tests/rules.test.js)
// The README and docs/ must not drift from the repo: every relative link and every file path they name exists,
// the file tree lists every test file, and the unit-test counts they quote match the real suites.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}
console.log('ScreenTalk README/docs consistency');

const readme = read('README.md');
const docs = fs.readdirSync(path.join(ROOT, 'docs')).filter(f => f.endsWith('.md')).map(f => 'docs/' + f);
const mdFiles = ['README.md', ...docs];
function walk(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (['.git', 'node_modules', '__pycache__'].includes(e.name)) return [];
    const rel = dir ? dir + '/' + e.name : e.name;
    return e.isDirectory() ? walk(rel) : [rel];
  });
}
const repoFiles = walk('');
const unitFiles = fs.readdirSync(path.join(__dirname)).filter(f => f.endsWith('.test.js')).sort();
const countTests = f => (fs.readFileSync(path.join(__dirname, f), 'utf8').match(/^\s*(?:await )?test\(/gm) || []).length;
const unitTotal = unitFiles.reduce((n, f) => n + countTests(f), 0);

test('every relative markdown link in README.md and docs/*.md resolves to a file', () => {
  const bad = [];
  for (const f of mdFiles) {
    for (const m of read(f).matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1].split('#')[0];
      if (!target || /^(https?:|mailto:|tel:)/.test(m[1])) continue;
      if (!fs.existsSync(path.join(ROOT, path.dirname(f), target))) bad.push(f + ' -> ' + m[1]);
    }
  }
  assert.deepEqual(bad, []);
});

test('every backticked file path in README.md and docs/*.md exists (bare names may live in js/ or tests/)', () => {
  const bad = []; let seen = 0;
  for (const f of mdFiles) {
    for (const m of read(f).matchAll(/`((?:[\w.-]+\/)*[\w.-]+\.(?:js|py|md|html|css|png|json|yml))`/g)) {
      const p = m[1].replace(/^\.\//, ''); seen++;
      const ok = p.includes('/') ? repoFiles.includes(p) : repoFiles.some(r => r === p || r.endsWith('/' + p));
      if (!ok) bad.push(f + ': ' + p);
    }
  }
  assert.ok(seen > 15, 'paths found: ' + seen);
  assert.deepEqual(bad, []);
});

test('the README file tree lists every test file on disk, and every file it lists exists', () => {
  const tree = readme.split('```').find(b => /^\s*screentalk\/\n/.test(b));
  assert.ok(tree, 'file tree block not found');
  const listed = [...tree.matchAll(/[├└]── (\S+)/g)].map(m => m[1]);
  const missing = listed.filter(p => !repoFiles.includes(p));
  assert.deepEqual(missing, [], 'listed but not on disk');
  const tests = repoFiles.filter(p => /^tests\/[^/]+\.(?:test\.js|py)$/.test(p));
  assert.deepEqual(tests.filter(p => !listed.includes(p)), [], 'test files missing from the tree');
});

test('"Run it" unit count equals the real number of unit tests, and its parts add up', () => {
  const line = readme.split('\n').find(l => l.startsWith('node tests/rules.test.js'));
  assert.ok(line, 'Run it line not found');
  const total = +line.match(/# (\d+) tests:/)[1];
  assert.equal(total, unitTotal, 'README says ' + total + ', suites have ' + unitTotal);
  const parts = [...line.matchAll(/(?:: |\+ )(\d+) /g)].map(m => +m[1]);
  assert.equal(parts.length, unitFiles.length, 'one part per unit-test file');
  assert.equal(parts.reduce((a, b) => a + b, 0), total);
});

test('"Last run" line and per-file counts in "How it was tested" match the suites', () => {
  const last = readme.match(/\*\*(\d+)\/(\d+) unit tests passing/);
  assert.ok(last, 'Last run line not found');
  assert.equal(+last[1], unitTotal); assert.equal(+last[2], unitTotal);
  assert.match(readme, new RegExp('`tests/rules.test.js`: ' + countTests('rules.test.js') + ' zero-dependency'));
  assert.match(readme, new RegExp('`tests/rehearse.test.js`, ' + countTests('rehearse.test.js') + ' tests'));
  assert.match(readme, new RegExp('`tests/i18n.test.js`, ' + countTests('i18n.test.js') + ' tests'));
  assert.match(readme, new RegExp('`tests/sw.test.js`: ' + countTests('sw.test.js') + ' tests'));
});

console.log(`\n${passed} passed, ${failed} failed`);
