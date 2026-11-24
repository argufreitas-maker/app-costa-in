// Service Worker para Costa in Beach Bar PWA
const CACHE_NAME = 'costa-in-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './menu.html',
  './mesa.html',
  './admin.html',
  './style.css',
  './app.js',
  './admin.js',
  './manifest.json',
  'https://dyj6gt4964deb.cloudfront.net/images/1d1ddb83-065b-4f1d-8e0c-fffc8f2f9fbe.jpeg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    }).catch(() => caches.match('./index.html'))
  );
});
