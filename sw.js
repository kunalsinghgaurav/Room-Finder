self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  // Pass-through fetch for PWA caching support
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});