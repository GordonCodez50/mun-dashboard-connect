
// This is a temporary service worker used to help trigger notification permissions
// Especially useful for Android Chrome which sometimes needs a service worker
// to properly request notification permissions

self.addEventListener('install', (event) => {
  console.log('Temporary notification service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Temporary notification service worker activated');
  event.waitUntil(clients.claim());
});

// This worker doesn't need to handle any actual push events
// It just needs to exist for Chrome on Android to properly show
// the notification permission prompt

