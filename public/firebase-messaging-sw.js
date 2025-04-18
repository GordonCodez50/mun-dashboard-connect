
// Firebase Cloud Messaging Service Worker - Cross-Platform Enhanced Version

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Log successful service worker initialization
console.log('Firebase messaging service worker initialized');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAmlEDVo8OJhGV-3Sr-jIwcY3UdD5kQBMU",
  authDomain: "isbmun-dashboard-prod-red.firebaseapp.com",
  databaseURL: "https://isbmun-dashboard-prod-red-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "isbmun-dashboard-prod-red",
  storageBucket: "isbmun-dashboard-prod-red.firebasestorage.app",
  messagingSenderId: "879089256467",
  appId: "1:879089256467:web:2f9e323c8c83805c6917e6",
  measurementId: "G-BBWT3VCT08"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();
console.log('Firebase messaging instance created in service worker');

// Log service worker activation
self.addEventListener('install', (event) => {
  console.log('Firebase messaging service worker installed');
  // Force activation without waiting for tabs to close
  self.skipWaiting();
});

// Log service worker activation
self.addEventListener('activate', (event) => {
  console.log('Firebase messaging service worker activated');
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
});

// Determine if the device is iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(self.navigator.userAgent);
};

// Determine if the device is Android
const isAndroid = () => {
  return /android/i.test(self.navigator.userAgent);
};

// Handle background messages with improved cross-platform support
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  const notificationTitle = payload.notification.title || 'New Notification';
  
  // Base notification options
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {},
    tag: payload.data?.tag || 'general',
    requireInteraction: payload.data?.requireInteraction === 'true',
    renotify: payload.data?.renotify === 'true'
  };

  // Platform-specific optimizations
  if (isAndroid()) {
    // Add vibration for Android lock screen notifications
    notificationOptions.vibrate = [200, 100, 200];
    
    // Android can show actions on lock screen
    if (payload.data?.actions) {
      try {
        notificationOptions.actions = JSON.parse(payload.data.actions);
      } catch (e) {
        console.error('Error parsing notification actions:', e);
      }
    }
  }
  
  // Create and show the notification optimized for lock screen
  self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => console.log('Notification shown successfully on lock screen/background'))
    .catch(error => console.error('Error showing notification:', error));
});

// Handle notification click with improved navigation
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click', event);
  event.notification.close();
  
  // Get notification data
  const notificationData = event.notification.data || {};
  
  // Default URL if none specified is the current origin (with pathname cleared)
  const currentOrigin = self.location.origin;
  // Default to chair dashboard or a reasonable fallback
  let urlToOpen = notificationData.url || `${currentOrigin}/chair-dashboard`;
  
  // For alerts, we explicitly route to chair dashboard or admin panel
  if (notificationData.type === 'alert') {
    // If we have a userRole specified in the data, use that to determine destination
    if (notificationData.userRole === 'admin') {
      urlToOpen = `${currentOrigin}/admin-panel`;
    } else {
      urlToOpen = `${currentOrigin}/chair-dashboard`;
    }
  }
  
  console.log('[firebase-messaging-sw.js] Will open URL:', urlToOpen);
  
  // Check if specific action was clicked (Android feature)
  if (event.action) {
    console.log('[firebase-messaging-sw.js] Action clicked:', event.action);
    // Handle specific action clicks
    if (notificationData.actionUrls && notificationData.actionUrls[event.action]) {
      const actionUrl = notificationData.actionUrls[event.action];
      console.log('Opening action URL:', actionUrl);
      
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
          // Try to focus an existing window first
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url === actionUrl && 'focus' in client) {
              return client.focus();
            }
          }
          // If no matching window, open a new one
          if (clients.openWindow) {
            return clients.openWindow(actionUrl);
          }
        })
      );
      
      return;
    }
  }
  
  // Normal notification click handling with improved client focus/navigation
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL or any window
      let matchingClient = null;
      let anyClient = null;
      
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (!anyClient && 'focus' in client) {
          anyClient = client; // Store first focusable client as fallback
        }
        
        if (client.url.includes(currentOrigin) && 'focus' in client) {
          matchingClient = client;
          break;
        }
      }
      
      // If we found a matching client, focus it and navigate
      if (matchingClient) {
        console.log('Found matching client, focusing and navigating to:', urlToOpen);
        return matchingClient.focus().then(() => {
          return matchingClient.navigate(urlToOpen);
        });
      }
      
      // If we found any client from our origin, use that
      if (anyClient) {
        console.log('Found any client, focusing and navigating to:', urlToOpen);
        return anyClient.focus().then(() => {
          return anyClient.navigate(urlToOpen);
        });
      }
      
      // If no client found at all, open a new window
      console.log('No existing client found, opening new window for:', urlToOpen);
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push notifications (separate from FCM, for Web Push API support)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push received:', event);
  
  if (!event.data) {
    console.log('No data in push event');
    return;
  }
  
  try {
    // Try to parse as JSON first (FCM format)
    const data = event.data.json();
    
    // Extract notification details
    const title = data.notification?.title || 'New Notification';
    const options = {
      body: data.notification?.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: {
        ...data.data,
        url: data.data?.url || '/chair-dashboard', // Default url
        type: data.data?.type || 'alert'
      },
      requireInteraction: data.data?.requireInteraction === 'true'
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (e) {
    // Fall back to text if not JSON
    console.log('Push event was not JSON, using text');
    const text = event.data.text();
    
    event.waitUntil(
      self.registration.showNotification('New Notification', {
        body: text,
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        data: {
          url: '/chair-dashboard' // Default url
        }
      })
    );
  }
});

// Add message handlers to communicate with the page
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message received', event.data);
  
  if (event.data && event.data.type === 'PING') {
    // Respond to ping message to verify service worker is running
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: 'PONG' });
    }
  }
  
  // Handle notification permission check
  if (event.data && event.data.type === 'CHECK_NOTIFICATION_PERMISSION') {
    if (event.source && event.source.postMessage) {
      // Service workers don't have access to Notification.permission directly
      // But if this code is running, we're activated and permissions should be already granted
      event.source.postMessage({ 
        type: 'NOTIFICATION_PERMISSION_RESULT',
        permission: 'granted',
        serviceWorkerActive: true
      });
    }
  }
  
  // Store user role for better navigation on notification click
  if (event.data && event.data.type === 'SET_USER_ROLE') {
    // We can't persist this in the service worker easily, but we can log it
    console.log('[firebase-messaging-sw.js] User role set:', event.data.role);
    
    // If the event source exists, confirm receipt
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ 
        type: 'USER_ROLE_SET',
        role: event.data.role
      });
    }
  }
});
