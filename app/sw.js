// Keeps the Trident launcher on the phone so it opens instantly, even with a
// weak signal (15/10). The app's data never passes through here: only this
// folder's own files are cached. Each file is served from the cache at once
// and refreshed in the background for next time.
var CACHE = 'trident-app-v2';
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

// 16/10 (Dave: tapping an ntfy alert opened Safari): Trident's own alerts.
// The server sends {title, body, url}; tapping opens (or brings forward) the
// home-screen app at that url (/app/?lead=...).
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Trident', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || './' }, tag: d.url || 'trident'
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf('/app/') !== -1 && 'focus' in list[i]) {
        return list[i].focus().then(function (c) { return c && 'navigate' in c ? c.navigate(url) : c; });
      }
    }
    return self.clients.openWindow(url);
  }));
});
