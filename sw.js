/* jshint esversion: 11 */
/* global caches */
/* global self */
/** Bump this string whenever app.js / app.css / index shell meaningfully change so old CacheStorage buckets are dropped on activate. */
const CACHE = "nq-v4";
const ASSET_Q = "?v=nq-v4";
const FILES = [
  "/",
  "/index.html",
  "/app.css" + ASSET_Q,
  "/app.js" + ASSET_Q,
  "/manifest.json",
  "/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(FILES.map(f => c.add(f)));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match("/index.html")))
    );
    return;
  }

  const url = new URL(e.request.url);
  const path = url.pathname;
  // Always try network first for the live-edited bundle so deploys are visible without nuking site data.
  if (path === "/app.js" || path === "/app.css") {
    e.respondWith(
      fetch(e.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
