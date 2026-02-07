export const register = (onUpdate: (registration: ServiceWorkerRegistration) => void) => {
  if ('serviceWorker' in navigator) {
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
