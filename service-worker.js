const CACHE_NAME = 'trivia-thief-static-v3';
const DATA_CACHE_NAME = 'trivia-thief-data-v1';

const STATIC_ASSETS = [
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
  './apple-touch-icon.png',
  './site.webmanifest',
  './favicon-96x96.png',
  './favicon.ico',
  './favicon.svg',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png'
];

// Install: pre-cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(err => {
      console.warn('[SW] Failed to pre-cache assets', err);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== DATA_CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', event => {
  const { request } = event;

  // Handle questions.json with stale-while-revalidate
  if (request.url.endsWith('questions.json')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(async cache => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cachedResponse = await cache.match(request);
          return cachedResponse || new Response('{"easy":[],"medium":[],"hard":[]}', {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
    );
    return;
  }

  // Default: cache-first for static assets
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).catch(() => {
        // Fallback: if offline and HTML requested, serve cached index.html
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Background sync example
self.addEventListener('sync', event => {
  if (event.tag === 'sync-quiz-scores') {
    event.waitUntil(uploadScores());
  }
});

async function uploadScores() {
  console.log('[SW] Background sync: uploading quiz scores…');
  await new Promise(res => setTimeout(res, 2000));
  console.log('[SW] Quiz scores uploaded!');
}

// Periodic sync example for refreshing questions
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-questions') {
    event.waitUntil(fetchNewQuestions());
  }
});

async function fetchNewQuestions() {
  console.log('[SW] Periodic sync: fetching latest questions…');
  try {
    const res = await fetch('./questions.json');
    if (res.ok) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put('./questions.json', res.clone());
      console.log('[SW] Questions updated successfully');
    }
  } catch (err) {
    console.error('[SW] Failed to fetch new questions', err);
  }
}
// Push notifications example
self.addEventListener('push', event => {
  const data = event.data ? event.data.text() : 'New notification from Trivia Thief!';
  const options = {
    body: data,
    icon: './logo.png',
    badge: './badgeone.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: 1 }
  };
  event.waitUntil(
    self.registration.showNotification('Trivia Thief', options)
  );
});
// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
// Listen for messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
// This service worker script is designed to enhance the offline capabilities and performance of the Trivia Thief web app. It implements caching strategies, background sync, periodic updates, and push notifications to provide a seamless user experience even when the network is unreliable.
// Make sure to test thoroughly across different browsers and devices to ensure compatibility and performance.
// Update the CACHE_NAME and DATA_CACHE_NAME variables to manage cache versions effectively.
// Increment the version numbers when you make changes to the static assets or data structure to ensure users receive the latest updates.
// Remember to register this service worker in your main application script (e.g., app.js or index.js) using navigator.serviceWorker.register('/service-worker.js');
// Also, ensure your server is configured to serve the service worker with the correct MIME type (application/javascript).
// This code is provided as-is without any warranties. Use it at your own risk.
// (c) 2025 Trivia Thief. All rights reserved.
// License: All Rights Reserved. Unauthorized use is prohibited.
// For any questions or support, contact the developer at Trivia Thief Instagram Handle
//
