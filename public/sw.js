const CACHE_NAME = 'maxwell-shell-v1';
const SHELL_ASSETS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

// This is a live conversation app, not an offline-first one — the fetch
// handler's main job is satisfying the installability requirement. Falling
// back to the cached shell on a network failure just avoids a blank page if
// the connection briefly drops; it doesn't cache API/conversation traffic.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
