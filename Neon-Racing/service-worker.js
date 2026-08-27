const CACHE_NAME = "neon-racing-v1";

const FILES_TO_CACHE = [
  "/Neon-Racing/",
  "/Neon-Racing/index.html",
  "/Neon-Racing/style.css?v=3",
  "/Neon-Racing/game.js?v=3",
  "/Neon-Racing/site.webmanifest",

  "/Neon-Racing/assets/favicon.png",
  "/Neon-Racing/assets/icon-192.png",
  "/Neon-Racing/assets/icon-512.png",
  "/Neon-Racing/assets/icon-maskable-512.png",

  "/Neon-Racing/assets/logo-ildebrando.png",
  "/Neon-Racing/assets/cover-neon-racing.png",
  "/Neon-Racing/assets/qq-chery.jpeg",

  "/Neon-Racing/assets/brake.wav",
  "/Neon-Racing/assets/coin.wav",
  "/Neon-Racing/assets/engine.wav",
  "/Neon-Racing/assets/hit.wav",
  "/Neon-Racing/assets/nitro.wav"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          const copy = networkResponse.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });

          return networkResponse;
        });
    })
  );
});
