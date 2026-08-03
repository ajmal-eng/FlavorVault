// FlavorVault service worker
// Minimal cache-first shell so the browser recognizes each page as
// installable and it can still open (last known state) when offline.
const CACHE_NAME = 'flavorvault-shell-v1';
const SHELL_FILES = [
  'indexuser.html',
  'admin.html',
  'chef.html',
  'deliveryauth.html',
  'favicon.ico',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .catch(() => {}) // don't block install if a file is briefly unreachable
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Network-first for API/socket calls, cache-first for the app shell itself.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API or websocket traffic - always go to network.
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) {
    return;
  }
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
