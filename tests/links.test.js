// Run with: node tests/links.test.js
// Every link in the page and the app code must be https (or a same-page #anchor / tel: / data: icon), and every
// target="_blank" link must carry rel="noopener" so a source page can't reach back into the app.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/content.js');
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const html = read('index.html');
console.log('ScreenTalk link hygiene');

test('index.html: every <a href> is https, #anchor or tel:', () => {
  const hrefs = [...html.matchAll(/<a\b[^>]*?\bhref="([^"]*)"/g)].map(m => m[1]);
  assert.ok(hrefs.length > 15, 'found anchors: ' + hrefs.length);
  const bad = hrefs.filter(h => !(/^https:\/\//.test(h) || /^#/.test(h) || /^tel:/.test(h)));
  assert.deepEqual(bad, []);
});

test('index.html: every target="_blank" anchor has rel with noopener', () => {
  const tags = [...html.matchAll(/<a\b[^>]*>/g)].map(m => m[0]).filter(t => /target="_blank"/.test(t));
  assert.ok(tags.length > 10, 'found external anchors: ' + tags.length);
  const bad = tags.filter(t => !/rel="[^"]*noopener/.test(t));
  assert.deepEqual(bad, []);
});

test('js/*.js: every target: \'_blank\' / target="_blank" is next to a noopener rel', () => {
  for (const f of ['app.js', 'i18n.js', 'rehearse-ui.js']) {
    const src = read('js/' + f);
    const lines = src.split('\n');
    lines.forEach((ln, i) => {
      if (/_blank/.test(ln)) {
        const ctx = lines.slice(Math.max(0, i - 2), i + 3).join('\n');
        assert.match(ctx, /noopener/, f + ':' + (i + 1) + ' opens a new tab without noopener');
      }
    });
  }
});

test('content.js (EN and ES): every URL string is https', () => {
  const src = read('js/content.js');
  const urls = src.match(/['"`]https?:\/\/[^'"`\s)]+/g) || [];
  assert.ok(urls.length > 10, 'urls: ' + urls.length);
  assert.deepEqual(urls.filter(u => /^['"`]http:/.test(u)), []);
});

test('resources(): every href is https or tel, in EN and ES', () => {
  for (const l of ['en', 'es']) {
    for (const r of C.resources(l)) assert.match(r.href, /^(https:\/\/|tel:)/, l + ' ' + r.name);
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
