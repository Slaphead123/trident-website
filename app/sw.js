// Keeps the Trident launcher on the phone so it opens instantly, even with a
// weak signal (15/10). The app's data never passes through here: only this
// folder's own files are cached. Each file is served from the cache at once
// and refreshed in the background for next time.
var CACHE = 'trident-app-v1';
var FILES = ['./', 'index.html', 'share.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/app/') === -1) return;
  var key = u.pathname.endsWith('/app/') ? './' : u.pathname.split('/').pop();
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (r) { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
