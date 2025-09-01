// Preload critical resources for faster loading
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  fontLink.onload = () => {
    fontLink.rel = 'stylesheet';
  };
  document.head.appendChild(fontLink);

  // Preload critical images for dashboard
  const criticalImages = [
    'https://res.cloudinary.com/dgnniyuqw/image/upload/v1755773693/Small-1_hqo0x9.png', // Always preload smallest image
    '/logo.png'
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = 'image';
    document.head.appendChild(link);
  });
};

// Service worker registration with better caching
export const registerServiceWorkerWithCaching = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/cache-sw.js', {
        scope: '/'
      });
      
      // Update service worker when new version is available
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, update
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
};