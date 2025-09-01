/**
 * iOS PWA Push Service Worker
 * Handles native Web Push API for iOS PWA mode
 */

self.addEventListener('push', function(event) {
  console.log('iOS PWA Push event received (background capable):', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('iOS PWA Push data:', data);
      
      const notification = data.notification || data;
      const title = notification.title || 'New Notification';
      const options = {
        body: notification.body || 'You have a new notification',
        icon: notification.icon || '/logo.png',
        badge: notification.badge || '/logo.png',
        tag: notification.tag || `ios-pwa-${Date.now()}`,
        data: notification.data || {},
        requireInteraction: notification.requireInteraction || false,
        vibrate: notification.vibrate || [200, 100, 200],
        silent: false, // Ensure sound plays
        timestamp: Date.now(),
        actions: notification.data?.url ? [
          {
            action: 'open',
            title: 'Open App',
            icon: '/logo.png'
          }
        ] : []
      };
      
      console.log('Showing iOS PWA background notification:', title);
      
      event.waitUntil(
        self.registration.showNotification(title, options)
          .then(() => {
            console.log('iOS PWA background notification shown successfully');
          })
          .catch(error => {
            console.error('Error showing iOS PWA background notification:', error);
          })
      );
    } catch (error) {
      console.error('Error parsing iOS PWA push data:', error);
      
      // Fallback notification with better error handling
      event.waitUntil(
        self.registration.showNotification('New Notification', {
          body: 'You have a new notification from BMUNIS Dashboard',
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `ios-pwa-fallback-${Date.now()}`,
          timestamp: Date.now(),
          vibrate: [200, 100, 200]
        })
      );
    }
  } else {
    console.log('Push event without data, showing fallback notification');
    
    // Show fallback notification when no data is provided
    event.waitUntil(
      self.registration.showNotification('BMUNIS Dashboard', {
        body: 'You have a new notification',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `ios-pwa-nodata-${Date.now()}`,
        timestamp: Date.now(),
        vibrate: [200, 100, 200]
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('iOS PWA Notification clicked:', event);
  
  event.notification.close();
  
  // Handle notification click with better URL handling
  let urlToOpen = '/';
  
  if (event.action === 'open' || !event.action) {
    urlToOpen = event.notification.data?.url || '/';
  }
  
  console.log('Opening URL from iOS PWA notification:', urlToOpen);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to focus existing window first
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientURL = new URL(client.url);
        const targetURL = new URL(urlToOpen, self.location.origin);
        
        // If we found a window with the same origin, focus it and navigate
        if (clientURL.origin === targetURL.origin && 'focus' in client) {
          if (clientURL.pathname !== targetURL.pathname) {
            client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
          }
          return client.focus();
        }
      }
      
      // No suitable window found, open a new one
      if (clients.openWindow) {
        const fullUrl = new URL(urlToOpen, self.location.origin).href;
        console.log('Opening new window for iOS PWA notification:', fullUrl);
        return clients.openWindow(fullUrl);
      }
    }).catch(error => {
      console.error('Error handling iOS PWA notification click:', error);
    })
  );
});

self.addEventListener('install', function(event) {
  console.log('iOS PWA Push service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('iOS PWA Push service worker activated');
  event.waitUntil(self.clients.claim());
});