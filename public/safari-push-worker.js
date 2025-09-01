
/**
 * Safari-Specific Push Service Worker
 * 
 * This service worker is specifically designed for Safari on macOS,
 * which has a different implementation of web push notifications.
 */

self.addEventListener('install', (event) => {
  console.log('Safari push service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Safari push service worker activated');
  event.waitUntil(clients.claim());
});

// Handle push notifications using Safari's format
self.addEventListener('push', (event) => {
  console.log('[safari-push-worker.js] Push received:', event);
  
  try {
    let payload;
    if (event.data) {
      // Try to parse as JSON
      try {
        payload = event.data.json();
      } catch (e) {
        // Fall back to text
        payload = { notification: { title: 'New Notification', body: event.data.text() } };
      }
    } else {
      // No data in push event
      payload = { notification: { title: 'New Notification', body: 'You have a new notification' } };
    }
    
    const title = payload.notification.title || 'New Notification';
    const options = {
      body: payload.notification.body || '',
      icon: self.location.origin + '/logo.png',
      timestamp: Date.now(),
      tag: `safari-${Date.now()}`,
      data: {
        url: self.location.origin,
        ...(payload.data || {})
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => console.log('Notification shown in Safari'))
        .catch(error => console.error('Error showing notification in Safari:', error))
    );
  } catch (error) {
    console.error('Error handling Safari push:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[safari-push-worker.js] Notification click', event);
  
  // Close the notification
  event.notification.close();
  
  // Get notification data
  const data = event.notification.data || {};
  
  // Get the target URL (default to origin if not specified)
  const targetUrl = data.url || self.location.origin;
  
  // Navigate to the URL
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if a window is already open
      for (const client of clientList) {
        if ('navigate' in client && client.url.includes(self.location.origin)) {
          return client.focus().then(client => client.navigate(targetUrl));
        }
      }
      
      // If no window is open, open one
      return clients.openWindow(targetUrl);
    })
  );
});

// Set up message handlers for communication with the page
self.addEventListener('message', (event) => {
  console.log('[safari-push-worker.js] Message received', event.data);
  
  if (event.data && event.data.type === 'PING') {
    // Respond to ping to verify the service worker is running
    if (event.source && event.source.postMessage) {
      event.source.postMessage({
        type: 'PONG',
        timestamp: Date.now(),
        browser: 'safari'
      });
    }
  }
});

/**
 * Note: Safari's web push notification system is different from Chrome and Firefox:
 * - Safari requires a valid SSL certificate (not self-signed)
 * - Safari uses a different push API (Apple Push Notification Service)
 * - Safari handles notifications slightly differently
 * 
 * This service worker is simplified to handle basic notifications in Safari.
 */
