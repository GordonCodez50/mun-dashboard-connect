
// This is a minimal temporary service worker used to trigger
// the notification permission dialog on certain platforms

self.addEventListener('install', (event) => {
  console.log('Temporary notification permission service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Temporary notification permission service worker activated');
  clients.claim();
});

// Add basic message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REQUEST_PERMISSION') {
    // Service worker can't request permission directly, but its presence
    // can help trigger the permission dialog on some platforms
    if (event.source) {
      event.source.postMessage({ type: 'READY_FOR_PERMISSION_REQUEST' });
    }
  }
});

// The service worker will automatically unregister itself after 5 minutes
// to avoid leaving unnecessary service workers around
setTimeout(() => {
  self.registration.unregister()
    .then(() => console.log('Temporary permission service worker unregistered'))
    .catch(error => console.error('Error unregistering temp service worker:', error));
}, 5 * 60 * 1000);
