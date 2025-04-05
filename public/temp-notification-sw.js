
// This is a temporary service worker to help trigger the notification permission dialog
// Particularly useful for Android Chrome

self.addEventListener('install', (event) => {
  console.log('Temporary notification service worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Temporary notification service worker activated');
});

// No specific functionality needed, this is just to trigger the permission dialog
