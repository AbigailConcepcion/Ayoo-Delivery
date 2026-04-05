// Production Service Worker Stub
// Enable: Register in vite.config.ts or index.html

self.addEventListener('install', (e) => {
  console.log('Ayoo SW installed');
});

self.addEventListener('fetch', (e) => {
  // Cache API calls, static assets in production
  e.respondWith(fetch(e.request));
});
