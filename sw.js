// FlavorVault service worker
// Network-first for the HTML pages themselves, so a fresh deploy always
// shows up immediately when the phone has a connection. Cache is only used
// as a fallback when truly offline. Icons stay cache-first since they never
// change and there's no benefit re-fetching them every time.
const CACHE_NAME = 'flavorvault-shell-v2';
const SHELL_FILES = [
  'indexuser.html',
  'admin.html',
  'chef.html',
  'deliveryauth.html',
  'favicon.ico',
  'icons/user/icon-192x192.png',
  'icons/user/icon-512x512.png',
  'icons/admin/icon-192x192.png',
  'icons/chef/icon-192x192.png',
  'icons/delivery/icon-192x192.png'
];
const HTML_FILES = ['indexuser.html', 'admin.html', 'chef.html', 'deliveryauth.html'];

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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API or websocket traffic - always go to network.
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) {
    return;
  }
  if (event.request.method !== 'GET') return;

  const isHtmlPage = event.request.mode === 'navigate' ||
    HTML_FILES.some((f) => url.pathname.endsWith(f));

  if (isHtmlPage) {
    // Network-first: always try to get the latest version. Only fall back
    // to the cached copy if there's no connection at all.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else (icons, static assets).
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
