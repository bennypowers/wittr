var staticCacheName = 'wittr-static-v2';

const pathsToCache = [
  '/',
  'js/main.js',
  'css/main.css',
  'imgs/icon.png',
  'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
  'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
];

self.addEventListener('install', async function(event) {
  event.waitUntil((async function() {
    const cache = await caches.open(staticCacheName);
    return cache.addAll(pathsToCache);
  }()));
});

self.addEventListener('activate', function(event) {
  event.waitUntil((async function() {
    const cacheNames = await caches.keys();
    return Promise.all(cacheNames
      .filter(cacheName => cacheName.startsWith('wittr-') && cacheName != staticCacheName)
      .map(cacheName => caches.delete(cacheName))
    );
  }()));
});

self.addEventListener('fetch', function(event) {
  event.respondWith((async function() {
    const response = await caches.match(event.request);
    return response || fetch(event.request);
  })());
});

self.addEventListener('message', (event) => event.data.answer === 'refresh' && self.skipWaiting());
