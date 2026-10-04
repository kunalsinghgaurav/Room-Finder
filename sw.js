const CACHE_NAME = "roomdekho-v1";
const ASSETS_TO_CACHE = [
  "/Room-Finder/",
  "/Room-Finder/index.html",
  "/Room-Finder/app.js",
  "/Room-Finder/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
