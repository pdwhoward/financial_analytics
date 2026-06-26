const CACHE_NAME = 'financial-analytics-v20260626-polyfill-fix';
const urlsToCache = [
  './',
  './index.html',
  './tvm.html',
  './npv.html',
  './fcf.html',
  './wacc.html',
  './dcf.html',
  './real.html',
  './assets/style.css',
  './assets/js/modules/video-quiz.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

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
  self.clients.claim();
});
