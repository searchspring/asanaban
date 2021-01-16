// var cacheName = 'v1:static';
// self.addEventListener('install', function(e) {
//     e.waitUntil(
//         caches.open(cacheName).then(function(cache) {
//             return cache.addAll([
//                 '/',
//                 '/app.css',
//                 '/app.js'
//             ]).then(function() {
//                 self.skipWaiting();
//             });
//         })
//     );
// });

// self.addEventListener('fetch', function(event) {
//     event.respondWith(
//         caches.match(event.request).then(function(response) {
//             // if (response) {
//             //     return response;
//             // }
//             return fetch(event.request);
//         })
//     );
// });