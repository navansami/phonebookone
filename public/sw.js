const SHELL_CACHE = 'phonebook-shell-v1';
const DATA_CACHE = 'phonebook-data-v1';
self.addEventListener('install', event => {
  event.waitUntil(fetch('/offline-assets.json').then(response => response.json()).then(assets => caches.open(SHELL_CACHE).then(cache => cache.addAll(assets))));
  self.skipWaiting();
});
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![SHELL_CACHE, DATA_CACHE].includes(key)).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/admin') || url.pathname.startsWith('/api/auth') || url.pathname.startsWith('/api/access')) return;
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(DATA_CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(request)) || new Response(JSON.stringify({ detail: 'Offline data is unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => { if (response.ok) caches.open(SHELL_CACHE).then(cache => cache.put(request, response.clone())); return response; }).catch(async () => (await caches.match(request)) || (await caches.match('/'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => { if (response.ok) caches.open(SHELL_CACHE).then(cache => cache.put(request, response.clone())); return response; })));
});
