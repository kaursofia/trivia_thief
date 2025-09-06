const CACHE_NAME = 'trivia-thief-cache-v2';

// All files in same folder as index.html
const ASSETS_TO_CACHE = [
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
  './web-app-manifest-512x512.png'
  // ❌ Removed README.md, LICENSE.txt, and service-worker.js from cache list
  // These may not be served or needed in cache
];

// Install event: safely cache assets
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const asset of ASSETS_TO_CACHE) {
      try {
        const response = await fetch(asset, { cache: 'reload' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await cache.put(asset, response.clone());
      } catch (err) {
        console.warn('[SW] Failed to cache', asset, err);
      }
    }
    self.skipWaiting();
  })());
});

// Activate event: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch event: serve from cache first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(response => response || fetch(event.request))
  );
});

// Optional background sync example
self.addEventListener('sync', event => {
  if (event.tag === 'sync-quiz-scores') {
    event.waitUntil(uploadScores());
  }
});

async function uploadScores() {
  console.log('Background sync: Uploading quiz scores...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('Quiz scores uploaded!');
}

// Optional periodic sync example
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-questions') {
    event.waitUntil(fetchNewQuestions());
  }
});

async function fetchNewQuestions() {
  console.log('Periodic sync: Fetching latest questions...');
  try {
    const res = await fetch('./questions.json');
    if (res.ok) {
      console.log('Questions updated successfully');
    }
  } catch (err) {
    console.error('Failed to fetch new questions', err);
  }
}

/*
All Rights Reserved
Copyright (c) 2025 Sofia Kaur
Unauthorized copying of this file, via any medium is strictly prohibited.
*/

