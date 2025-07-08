const CACHE_NAME = 'financial-analytics-v' + Date.now();
const urlsToCache = [
  '/',
  '/index.html',
  '/tvm.html',
  '/npv.html',
  '/fcf.html',
  '/wacc.html',
  '/dcf.html',
  '/real.html',
  '/assets/style.css',
  '/assets/js/modules/video-quiz.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
