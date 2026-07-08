// Version: 2.0.0 - Whole-app refresh
const CACHE_NAME = 'internpro-v2.0.0';

// Same-origin app shell: precached atomically (these must all succeed).
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/bethel-logo.png',
  '/InternPro.png',
  '/manifest.json'
];

// Third-party assets: cached best-effort so a CDN hiccup can never abort the
// service-worker install (cache.addAll is all-or-nothing).
const OPTIONAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
  // No skipWaiting() here: the new worker must sit in the "waiting" state so
  // the in-app "New Version Available" toast controls when it activates.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all([
        cache.addAll(SHELL_ASSETS),
        ...OPTIONAL_ASSETS.map((url) => cache.add(url).catch(() => undefined))
      ])
    )
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
      fetch(event.request).catch(() =>
        caches.match('/index.html').then((cached) => cached || caches.match('/'))
      )
    );
    return;
  }

  // Cache-first for static assets. Same-origin build assets are content-hashed
  // by Vite, so caching them on first fetch is safe and is what makes the
  // installed PWA actually work offline.
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).then(networkResponse => {
        const isSameOrigin = url.origin === self.location.origin;
        const isFontCdn = url.hostname.includes('gstatic.com') || url.hostname.includes('googleapis.com');
        if (networkResponse.status === 200 && event.request.method === 'GET' && (isSameOrigin || isFontCdn)) {
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
