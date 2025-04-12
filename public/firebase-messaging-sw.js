
// Firebase Cloud Messaging Service Worker with cross-platform enhancements

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

// Enhanced background messages with better mobile support
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  const notificationTitle = payload.notification.title || 'New Notification';
  
  // Enhance options based on platform hints in payload
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: {
      ...payload.data,
      url: payload.data?.url || '/',
      timestamp: Date.now(),
    },
    // Enhanced options for better mobile experience
    vibrate: payload.data?.vibrate ? 
      JSON.parse(payload.data.vibrate) : 
      [200, 100, 200],
    requireInteraction: payload.data?.requireInteraction === 'true',
    actions: getNotificationActions(payload),
    tag: payload.data?.tag || 'default',
    renotify: payload.data?.renotify === 'true',
    silent: payload.data?.silent === 'true'
  };

  // Create and show the notification with platform-specific handling
  self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      // Log success but with device info for debugging
      const deviceInfo = getUserAgentInfo();
      console.log(`Notification shown successfully on ${deviceInfo.platform} using ${deviceInfo.browser}`);
    })
    .catch(error => {
      console.error('Error showing notification:', error);
      // Report detailed error with platform info
      reportNotificationError(error);
    });
});

// Process notification actions if present in payload
function getNotificationActions(payload) {
  if (payload.data?.actions) {
    try {
      return JSON.parse(payload.data.actions);
    } catch (e) {
      console.error('Error parsing notification actions:', e);
    }
  }
  
  // Default actions based on notification type
  if (payload.data?.type === 'alert') {
    return [
      { action: 'acknowledge', title: 'Acknowledge' },
      { action: 'view', title: 'View Details' }
    ];
  }
  
  return undefined;
}

// Enhanced notification click handler with better cross-platform support
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click', event);
  event.notification.close();
  
  // Handle actions if present
  if (event.action) {
    handleNotificationAction(event);
    return;
  }
  
  // Handle the user clicking on the notification body
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, focus it
        if ('focus' in client) {
          client.postMessage({ 
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen,
            data: event.notification.data 
          });
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification actions
function handleNotificationAction(event) {
  const action = event.action;
  const data = event.notification.data;
  
  console.log(`Handling notification action: ${action}`, data);
  
  // Broadcast action to all clients
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('postMessage' in client) {
          client.postMessage({ 
            type: 'NOTIFICATION_ACTION', 
            action,
            data
          });
        }
      }
      
      // Open window for specific actions that require user interface
      if (action === 'view' && data?.url) {
        return clients.openWindow(data.url);
      }
    })
  );
}

// Utility function to extract user agent info for better error logging
function getUserAgentInfo() {
  // This is running in service worker context, so we need to be careful
  const ua = self.navigator.userAgent.toLowerCase();
  
  let platform = 'unknown';
  if (/android/.test(ua)) platform = 'Android';
  else if (/iphone|ipad|ipod/.test(ua)) platform = 'iOS';
  else if (/windows/.test(ua)) platform = 'Windows';
  else if (/macintosh|mac os x/.test(ua)) platform = 'macOS';
  else if (/linux/.test(ua)) platform = 'Linux';
  
  let browser = 'unknown';
  if (/firefox/.test(ua)) browser = 'Firefox';
  else if (/chrome|chromium|crios/.test(ua)) browser = 'Chrome';
  else if (/safari/.test(ua)) browser = 'Safari';
  else if (/edge|edg/.test(ua)) browser = 'Edge';
  
  return { platform, browser };
}

// Log detailed notification errors with platform info
function reportNotificationError(error) {
  const deviceInfo = getUserAgentInfo();
  console.error(`Notification error on ${deviceInfo.platform} using ${deviceInfo.browser}:`, error);
  
  // This would ideally report to an error tracking service
  // But we'll just log it for now
}

// Enhanced message event handling for better cross-client communication
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message received', event.data);
  
  // Handle different message types
  if (event.data && event.data.type === 'PING') {
    // Respond to ping with platform info for debugging
    const deviceInfo = getUserAgentInfo();
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ 
        type: 'PONG',
        deviceInfo
      });
    }
  } else if (event.data && event.data.type === 'CLEAR_NOTIFICATIONS') {
    // Clear all notifications of a specific tag or all if not specified
    self.registration.getNotifications({ tag: event.data.tag })
      .then(notifications => {
        notifications.forEach(notification => notification.close());
        console.log(`Cleared ${notifications.length} notifications`);
        
        if (event.source && event.source.postMessage) {
          event.source.postMessage({ 
            type: 'NOTIFICATIONS_CLEARED',
            count: notifications.length
          });
        }
      });
  } else if (event.data && event.data.type === 'GET_NOTIFICATION_PERMISSION') {
    // Report current permission status to client
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ 
        type: 'NOTIFICATION_PERMISSION_STATUS',
        permission: self.Notification.permission
      });
    }
  }
});

// Push event handler (for web push API - complement to FCM)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push received', event);
  
  let notificationData = {};
  
  // Try to parse the push data
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      // If JSON parsing fails, use text
      notificationData = {
        title: 'New Notification',
        body: event.data.text()
      };
    }
  }
  
  // Ensure minimum required notification properties
  const title = notificationData.notification?.title || notificationData.title || 'New Notification';
  const options = {
    body: notificationData.notification?.body || notificationData.body || '',
    icon: notificationData.notification?.icon || '/logo.png',
    badge: notificationData.notification?.badge || '/logo.png',
    data: notificationData.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false
  };
  
  // Show the notification
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed', event);
  
  // Broadcast to clients
  clients.matchAll({ type: 'window' }).then(windowClients => {
    windowClients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_CLOSED',
        data: event.notification.data
      });
    });
  });
});
