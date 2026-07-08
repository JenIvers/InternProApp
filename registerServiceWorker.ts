export const register = (onUpdate: (registration: ServiceWorkerRegistration) => void) => {
  if ('serviceWorker' in navigator) {
    // When the waiting worker is told to skipWaiting (via the update toast) and
    // takes control, reload so the page never keeps running old JS against the
    // new cache. One-shot guard prevents a reload loop.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered: ', registration);

          // 1. Check if there is already a waiting worker (e.g. from a background check)
          if (registration.waiting) {
            onUpdate(registration);
          }

          // 2. Listen for future updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available; please refresh.
                  onUpdate(registration);
                }
              });
            }
          });

          // 3. Proactive check runner: Check for updates every 10 minutes
          // This is lightweight as it only checks the server for a byte-for-byte diff of the SW script
          setInterval(() => {
            registration.update();
          }, 1000 * 60 * 10);
        })
        .catch((error) => {
          console.error('SW registration failed: ', error);
        });
    });
  }
};
