const CACHE_NAME = 'trivia-thief-cache-v1';

// All files in same folder as index.html
const ASSETS_TO_CACHE = [
  'index.html',
  'logo.png',
  'coin.png',
  'chest_closed.png',
  'badgeone.png',
  'badgetwo.png',
  'start.wav',
  'tick.wav',
  'coin.wav',
  'chest.wav',
  'questions.json',
  'apple-touch-icon.png',
  'site.webmanifest',
  'favicon-96x96.png',
  'favicon.ico',
  'favicon.svg',
  'web-app-manifest-192x192.png',
  'web-app-manifest-512x512.png',
  'service-worker.js',
  'README.md',
  'LICENSE.txt'
  // Add any other assets you want cached here (no comma after last item)
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

// --- Background Sync Example ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quiz-scores') {
    event.waitUntil(uploadScores());
  }
});

async function uploadScores() {
  // Example: simulate uploading stored quiz scores
  console.log('Background sync: Uploading quiz scores...');
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('Quiz scores uploaded!');
}

// --- Periodic Sync Example ---
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-questions') {
    event.waitUntil(fetchNewQuestions());
  }
});

async function fetchNewQuestions() {
  console.log('Periodic sync: Fetching latest questions...');
  try {
    const res = await fetch('questions.json'); // relative path safe for ZIP
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
