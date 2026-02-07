// Version: 1.1.1 - Improved iOS PWA navigation and cache handling
const CACHE_NAME = 'internpro-v1.1.1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/bethel-logo.png',
  '/InternPro.png',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER cache auth-related requests or navigation (HTML) requests
  // This prevents OAuth redirect loops in PWAs
  // On iOS PWA, navigate requests are critical for staying in standalone mode
  const isNavigation = event.request.mode === 'navigate';
  const isAuthRelated = url.hostname.includes('google') ||
                        url.hostname.includes('firebase') ||
                        url.hostname.includes('googleapis') ||
                        url.pathname.includes('__/auth/');

  if (isNavigation || isAuthRelated) {
    // Network-first for navigation and auth
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      
      return fetch(event.request).then(networkResponse => {
        // Cache external fonts and scripts if successful
        if (networkResponse.status === 200 && (url.hostname.includes('gstatic.com') || url.hostname.includes('googleapis.com'))) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
