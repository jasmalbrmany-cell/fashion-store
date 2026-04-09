self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // A minimal fetch listener is required by Chrome to trigger the PWA install prompt.
  // Leaving it empty allows all network requests to bypass the service worker 
  // and be handled by the browser normally, avoiding CORS and caching issues.
});
