
// Temporary service worker for iOS notification support
// This is just a stub to force the permission dialog on iOS
self.addEventListener('install', event => {
  console.log('Temporary notification service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Temporary notification service worker activated');
  event.waitUntil(self.clients.claim());
});

// Minimal push handler
self.addEventListener('push', event => {
  const title = 'New Notification';
  const options = {
    body: event.data ? event.data.text() : 'Notification content',
    icon: '/logo.png'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(clientList => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
  );
});
