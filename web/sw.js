// Sorstar Service Worker - PWA Support
const CACHE_NAME = 'sorstar-v1';
const urlsToCache = [
  '/sorstar-web.html',
  '/web/css/styles.css',
  '/web/js/api.js',
  '/web/js/ui.js',
  '/web/js/game.js',
  '/web/js/trading.js',
  '/web/js/auth.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});