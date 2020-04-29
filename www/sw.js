var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
    '/',
    '/images/blank.png',
    '/images/head.png',
    '/images/icon.png',
    '/images/pat1.png',
    '/css/style.css',
    '/js/index.js'
];

self.addEventListener('install', function (event) {
    // Perform install steps
    event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
    }));
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});