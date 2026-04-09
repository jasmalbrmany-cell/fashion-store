self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // A minimal fetch listener is required by Chrome to trigger the PWA install prompt.
  // We just let the network handle it (Network-first strategy placeholder).
  e.respondWith(fetch(e.request).catch(() => new Response("Network error.")));
});
