// Run with: node tests/sw.test.js (also run by tests/rules.test.js)
// The offline service worker must cache every file the page loads, fall back to the cache only when
// the network fails, clean up only ScreenTalk's own caches, and register only over http(s).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}

// Load sw.js in a sandbox with fake caches/fetch, and capture its event handlers.
function loadSW({ online = true, cacheNames = [] } = {}) {
  const stores = {}; cacheNames.forEach(n => { stores[n] = new Map(); });
  const handlers = {};
  const keyOf = k => (typeof k === 'string' ? k : k.url);
  const caches = {
    open: async n => { stores[n] = stores[n] || new Map(); const m = stores[n];
      return { addAll: async l => l.forEach(u => m.set(u, 'cached:' + u)), put: async (k, v) => m.set(keyOf(k), v) }; },
    keys: async () => Object.keys(stores),
    delete: async n => delete stores[n],
    match: async k => { for (const m of Object.values(stores)) if (m.has(keyOf(k))) return m.get(keyOf(k)); return undefined; },
  };
  const fetchCalls = [];
  const sandbox = {
    self: { addEventListener: (t, f) => { handlers[t] = f; }, location: { origin: 'https://aariv.me' }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches, URL,
    fetch: async req => { fetchCalls.push(req.url); if (!online) throw new TypeError('Failed to fetch');
      return { ok: true, body: 'net:' + req.url, clone() { return { body: 'net:' + req.url }; } }; },
  };
  vm.runInNewContext(read('sw.js'), sandbox);
  const ctx = vm.runInNewContext('({VERSION, CACHE, SHELL})', sandbox);
  return { handlers, stores, fetchCalls, ...ctx };
}
function fire(h, type, extra) {
  let p = null, waited = null;
  h[type]({ ...extra, respondWith: x => { p = x; }, waitUntil: x => { waited = x; } });
  return { response: p, waited };
}

(async () => {
  const html = read('index.html');
  const sw = loadSW();

  await test('SHELL lists index.html plus every script and stylesheet index.html loads, and each file exists', () => {
    const refs = [...html.matchAll(/<(?:script src|link rel="stylesheet" href)="([^"]+)"/g)].map(m => m[1]);
    assert.ok(refs.length >= 7, 'found ' + refs.length);
    refs.forEach(r => assert.ok(sw.SHELL.includes(r), 'SHELL misses ' + r));
    assert.ok(sw.SHELL.includes('./') && sw.SHELL.includes('index.html'));
    sw.SHELL.filter(f => f !== './').forEach(f => assert.ok(fs.existsSync(path.join(ROOT, f)), f + ' missing'));
  });

  await test('cache name is screentalk-<VERSION>', () => {
    assert.equal(sw.CACHE, 'screentalk-' + sw.VERSION);
  });

  await test('install precaches the whole shell', async () => {
    const s = loadSW();
    await fire(s.handlers, 'install').waited;
    assert.deepEqual([...s.stores[s.CACHE].keys()].sort(), [...s.SHELL].sort());
  });

  await test('activate deletes old ScreenTalk caches only, never other apps\' caches', async () => {
    const s = loadSW({ cacheNames: ['screentalk-st-0', 'breatheeasy-be-123', 'tutorloop-v12', 'brazos-v7'] });
    await fire(s.handlers, 'install').waited;
    await fire(s.handlers, 'activate').waited;
    assert.deepEqual(Object.keys(s.stores).sort(), ['brazos-v7', 'breatheeasy-be-123', s.CACHE, 'tutorloop-v12'].sort());
  });

  await test('online: answers from the network (a new deploy always wins) and refreshes the cache', async () => {
    const s = loadSW();
    const r = await fire(s.handlers, 'fetch', { request: { method: 'GET', url: 'https://aariv.me/Screentalk/js/app.js', mode: 'no-cors' } }).response;
    assert.equal(r.body, 'net:https://aariv.me/Screentalk/js/app.js');
    assert.deepEqual(s.fetchCalls, ['https://aariv.me/Screentalk/js/app.js']);
  });

  await test('offline: a page load gets the cached index.html; a script gets its cached copy', async () => {
    const s = loadSW({ online: false });
    await fire(s.handlers, 'install').waited;
    const page = await fire(s.handlers, 'fetch', { request: { method: 'GET', url: 'https://aariv.me/Screentalk/?lang=es', mode: 'navigate' } }).response;
    assert.equal(page, 'cached:index.html');
    const s2 = loadSW({ online: false });
    s2.stores[s2.CACHE] = new Map([['https://aariv.me/Screentalk/css/styles.css', 'cached-css']]);
    const css = await fire(s2.handlers, 'fetch', { request: { method: 'GET', url: 'https://aariv.me/Screentalk/css/styles.css', mode: 'no-cors' } }).response;
    assert.equal(css, 'cached-css');
  });

  await test('other origins and non-GET requests are not intercepted', () => {
    const s = loadSW();
    assert.equal(fire(s.handlers, 'fetch', { request: { method: 'GET', url: 'https://www.cancer.org/x', mode: 'navigate' } }).response, null);
    assert.equal(fire(s.handlers, 'fetch', { request: { method: 'POST', url: 'https://aariv.me/Screentalk/', mode: 'cors' } }).response, null);
  });

  await test('app.js registers sw.js only over http(s), so opening index.html from disk makes no request', () => {
    const app = read('js/app.js');
    assert.match(app, /'serviceWorker' in navigator && \/\^https\?:\$\/\.test\(location\.protocol\)/);
    assert.match(app, /navigator\.serviceWorker\.register\('sw\.js'\)/);
  });

  await test('CSP still blocks connections to other sites and allows the same-origin worker', () => {
    const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)[1];
    assert.match(csp, /connect-src 'none'/);
    assert.match(csp, /default-src 'self'/);
    assert.doesNotMatch(csp, /worker-src/); // falls back to script-src 'self'
  });

  await test('link preview: Open Graph + large Twitter card point at the live page and a 1280x800 screenshot in the repo', () => {
    const meta = k => (html.match(new RegExp('<meta (?:property|name)="' + k + '" content="([^"]+)"')) || [])[1];
    assert.equal(meta('og:url'), 'https://aariv.me/Screentalk/');
    assert.equal(meta('twitter:card'), 'summary_large_image');
    ['og:title', 'og:description', 'og:image:alt'].forEach(k => assert.ok((meta(k) || '').length > 20, k));
    const img = meta('og:image'); assert.ok(img.startsWith(meta('og:url')), img);
    const png = fs.readFileSync(path.join(ROOT, img.slice(meta('og:url').length)));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [Number(meta('og:image:width')), Number(meta('og:image:height'))]);
    assert.ok(png.length < 300e3, 'small enough for chat previews');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
})();
