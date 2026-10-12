/* ScreenTalk service worker: lets the app open with no connection after one online visit
 * (for example in a clinic waiting room with no signal, to pull up the checkup sheet).
 *
 * Network first for every same-origin file, cached copy only when the network fails, so a new
 * deploy always wins and nothing goes stale. The app itself still talks to no other site: this file
 * only stores ScreenTalk's own HTML, CSS and JS. Old ScreenTalk caches are deleted on activate;
 * caches that belong to other apps on the same domain are never touched.
 * Bump VERSION whenever the SHELL list changes.
 */
var VERSION = 'st-5';
var CACHE = 'screentalk-' + VERSION;
var SHELL = ['./', 'index.html', 'css/styles.css', 'js/i18n.js', 'js/rules.js', 'js/content.js',
  'js/app.js', 'js/rehearse.js', 'js/rehearse-ui.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('screentalk-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  var key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(key, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(key, { ignoreSearch: true }).then(function (r) { return r || caches.match('./'); });
  }));
});
