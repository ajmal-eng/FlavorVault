// Minimal service worker - required for browsers to treat this as an
// installable app. Doesn't do heavy offline caching (the app needs a live
// connection to the backend anyway), just satisfies the installability
// requirement and caches the app icons for a faster launch.
const CACHE_NAME = "flavorvault-shell-v2";
// This service worker is shared by every role's page (admin/user/chef/
// delivery), each with its own icon folder, so it can't safely hardcode
// one set of icon paths here. Precaching is a nice-to-have for faster
// launch, not required for installability, so failures on individual
// URLs must never abort the whole install (cache.addAll rejects the
// entire batch on a single 404, which previously broke SW install).
const PRECACHE_URLS = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
