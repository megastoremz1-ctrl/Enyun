var CACHE_NAME = 'gift-display-v2';

var STATIC_ASSETS = [
    '/', '/index.html', '/css/style.css', '/js/app.js',
    '/overlay.html', '/css/overlay.css', '/js/overlay.js',
    '/manifest.json', '/admin.html', '/config.js'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(STATIC_ASSETS); })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (name) { return name !== CACHE_NAME; })
                .map(function (name) { return caches.delete(name); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    var url = new URL(event.request.url);
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request).catch(function () {
                return new Response(JSON.stringify({ error: 'offline' }), { headers: { 'Content-Type': 'application/json' } });
            })
        );
        return;
    }
    event.respondWith(
        caches.match(event.request).then(function (cachedResponse) {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then(function (response) {
                if (response.status === 200) {
                    var responseClone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, responseClone); });
                }
                return response;
            });
        })
    );
});
