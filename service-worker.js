const CACHE_NAME = 'trivia-thief-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './logo.png',
  './coin.png',
  './chest_closed.png',
  './badgeone.png',
  './badgetwo.png',
  './start.wav',
  './tick.wav',
  './coin.wav',
  './chest.wav',
  './questions.json',
  './apple-touch-icon.png',
  './site.webmanifest',
  './favicon-96x96.png',
  './favicon.ico',
  './favicon.svg',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png',
  // Add any other assets you want cached
];

// Install event: cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Activate event: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

// Fetch event: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(response => {
      return response || fetch(event.request);
    })
  );
});
/*
All Rights Reserved
Copyright (c) 2025 Sofia Kaur
Unauthorized copying of this file, via any medium is strictly prohibited.
*/

