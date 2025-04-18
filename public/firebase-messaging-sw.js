// Firebase Cloud Messaging Service Worker - Professional Production Version

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Log successful service worker initialization
console.log('[FCM-SW] Service worker initialized (v1.2.0)');

// Initialize the Firebase app in the service worker with the correct config
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
console.log('[FCM-SW] Firebase messaging instance created');

// Storage for user role and other persistent data
let userRole = null;
let lastNotificationData = null;

// Enhanced install handler
self.addEventListener('install', (event) => {
  console.log('[FCM-SW] Service worker installing');
  // Force activation without waiting for tabs to close
  self.skipWaiting();
  
  // Cache important assets
  event.waitUntil(
    caches.open('fcm-assets-v2').then((cache) => {
      return cache.addAll([
        '/logo.png',
        '/notification.mp3',
        '/ringtonenotification.mp3',
        '/manifest.json'
      ]);
    })
  );
});

// Enhanced activation handler
self.addEventListener('activate', (event) => {
  console.log('[FCM-SW] Service worker activating');
  
  // Take control of all clients immediately for consistent behavior
  event.waitUntil(
    clients.claim().then(() => {
      // Notify all clients that the service worker is active
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SERVICE_WORKER_ACTIVATED',
            timestamp: Date.now(),
            version: '1.2.0'
          });
        });
      });
      
      // Clear old caches
      return caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName.startsWith('fcm-assets-') && cacheName !== 'fcm-assets-v2';
          }).map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      });
    })
  );
});

// Device detection utilities
const isIOS = () => /iPad|iPhone|iPod/.test(self.navigator.userAgent);
const isAndroid = () => /android/i.test(self.navigator.userAgent);
const isMobile = () => isIOS() || isAndroid();

// Sound playback helper
const playNotificationSound = async () => {
  try {
    const cache = await caches.open('fcm-assets-v2');
    const response = await cache.match('/notification.mp3');
    
    if (response) {
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);
      const audio = new self.Audio(objectURL);
      await audio.play();
    }
  } catch (e) {
    console.error('[FCM-SW] Error playing notification sound:', e);
  }
};

// URL generation based on notification type and user role
const getTargetUrl = (notificationData) => {
  // Extract data or use defaults
  const type = notificationData?.type || 'alert';
  const role = notificationData?.userRole || userRole || 'chair';
  const alertId = notificationData?.alertId;
  const customUrl = notificationData?.url;
  
  // If a specific URL was provided, use that
  if (customUrl && customUrl.startsWith('/')) {
    return `${self.location.origin}${customUrl}`;
  } else if (customUrl) {
    return customUrl;
  }
  
  const currentOrigin = self.location.origin;
  
  // Base paths by role
  let basePath = '/chair-dashboard';
  if (role === 'admin') {
    basePath = '/admin-panel';
  } else if (role === 'press') {
    basePath = '/press-dashboard';
  }
  
  // Special paths based on notification type
  if (type === 'timer') {
    return `${currentOrigin}/timer-manager`;
  } else if (type === 'attendance') {
    return `${currentOrigin}/${role === 'admin' ? 'admin-attendance' : 'chair-attendance'}`;
  } else if (type === 'file') {
    return `${currentOrigin}/file-share`;
  } else if (type === 'reply' && alertId) {
    // For replies, go directly to the respective dashboard with alert ID as query param
    return `${currentOrigin}${basePath}?alert=${alertId}`;
  } else if (type === 'document') {
    return `${currentOrigin}/documents`;
  }
  
  // Default fallback
  return `${currentOrigin}${basePath}`;
};

// Get the client to focus or open, with enhanced reliability
const getClientToFocus = async (targetUrl) => {
  const allClients = await clients.matchAll({ 
    type: 'window', 
    includeUncontrolled: true 
  });
  
  console.log(`[FCM-SW] Found ${allClients.length} clients`);
  
  // First, look for an exact URL match
  for (const client of allClients) {
    if (client.url === targetUrl && 'focus' in client) {
      console.log(`[FCM-SW] Found exact match: ${client.url}`);
      return client;
    }
  }
  
  // Next, look for any client from our origin
  for (const client of allClients) {
    if (client.url.includes(self.location.origin) && 'focus' in client) {
      console.log(`[FCM-SW] Found client from our origin: ${client.url}`);
      return client;
    }
  }
  
  // If no match, return the first focusable client
  for (const client of allClients) {
    if ('focus' in client) {
      console.log(`[FCM-SW] Found focusable client: ${client.url}`);
      return client;
    }
  }
  
  // No suitable client found
  return null;
};

// Enhanced background message handler with improved reliability
messaging.onBackgroundMessage(async (payload) => {
  console.log('[FCM-SW] Received background message', payload);
  
  // Store last notification data for debugging
  lastNotificationData = payload;
  
  // Extract notification details
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationBody = payload.notification?.body || '';
  
  // Create rich notification options
  const notificationOptions = {
    body: notificationBody,
    icon: '/logo.png',
    badge: '/logo.png',
    data: {
      ...(payload.data || {}),
      userRole: payload.data?.userRole || userRole,
      timestamp: Date.now()
    },
    tag: payload.data?.tag || 'general',
    requireInteraction: payload.data?.requireInteraction === 'true',
    renotify: payload.data?.renotify === 'true',
    silent: false
  };

  // Mobile-specific enhancements
  if (isMobile()) {
    notificationOptions.vibrate = [200, 100, 200];
    
    if (isAndroid()) {
      // Android supports notification actions
      if (payload.data?.actions) {
        try {
          notificationOptions.actions = JSON.parse(payload.data.actions);
        } catch (e) {
          console.error('[FCM-SW] Error parsing notification actions:', e);
        }
      }
    }
  }
  
  // Ensure we have a URL for the notification click
  if (!notificationOptions.data.url) {
    notificationOptions.data.url = getTargetUrl(notificationOptions.data);
  }
  
  // Add sound (will work on some platforms)
  try {
    await playNotificationSound();
  } catch (error) {
    console.error('[FCM-SW] Error playing sound:', error);
  }
  
  // Show the notification
  try {
    await self.registration.showNotification(notificationTitle, notificationOptions);
    console.log('[FCM-SW] Notification shown successfully in background');
  } catch (error) {
    console.error('[FCM-SW] Error showing notification:', error);
  }
});

// Improved notification click handler with reliable navigation
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM-SW] Notification clicked', event);
  
  // Close the notification
  event.notification.close();
  
  // Get notification data
  const notificationData = event.notification.data || {};
  
  // Handle action clicks (Android feature)
  const actionUrl = event.action && notificationData.actionUrls ? 
    notificationData.actionUrls[event.action] : null;
  
  // Get the target URL
  const urlToOpen = actionUrl || 
    notificationData.url || 
    getTargetUrl(notificationData);
  
  console.log('[FCM-SW] Will navigate to:', urlToOpen);
  
  // Enhanced client focus and navigation with retries
  event.waitUntil((async () => {
    try {
      // First try to get an existing client
      const client = await getClientToFocus(urlToOpen);
      
      if (client) {
        // Focus the client
        await client.focus();
        console.log('[FCM-SW] Focused client:', client.url);
        
        // Navigate after a short delay to ensure focus completes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          await client.navigate(urlToOpen);
          console.log('[FCM-SW] Successfully navigated to:', urlToOpen);
          return;
        } catch (navError) {
          console.error('[FCM-SW] Navigation failed, opening new window:', navError);
        }
      }
      
      // If no suitable client or navigation failed, open a new window
      console.log('[FCM-SW] Opening new window for:', urlToOpen);
      await clients.openWindow(urlToOpen);
      
    } catch (error) {
      console.error('[FCM-SW] Error handling notification click:', error);
      
      // Last resort: try opening a new window
      try {
        await clients.openWindow(urlToOpen);
      } catch (finalError) {
        console.error('[FCM-SW] Final fallback failed:', finalError);
      }
    }
  })());
});

// Web Push API support (separate from FCM)
self.addEventListener('push', async (event) => {
  console.log('[FCM-SW] Push event received:', event);
  
  if (!event.data) {
    console.log('[FCM-SW] No data in push event');
    return;
  }
  
  event.waitUntil((async () => {
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
          ...(data.data || {}),
          userRole: data.data?.userRole || userRole,
          timestamp: Date.now()
        },
        requireInteraction: data.data?.requireInteraction === 'true'
      };
      
      // Ensure we have a URL
      if (!options.data.url) {
        options.data.url = getTargetUrl(options.data);
      }
      
      try {
        await playNotificationSound();
      } catch (soundError) {
        console.error('[FCM-SW] Sound playback error:', soundError);
      }
      
      await self.registration.showNotification(title, options);
      console.log('[FCM-SW] Push notification displayed');
      
    } catch (e) {
      // Fallback for non-JSON payloads
      console.log('[FCM-SW] Not JSON format, using text payload');
      const text = event.data.text();
      
      await self.registration.showNotification('New Notification', {
        body: text,
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        data: {
          userRole,
          timestamp: Date.now(),
          url: getTargetUrl({ userRole })
        }
      });
    }
  })());
});

// Enhanced messaging between service worker and pages
self.addEventListener('message', (event) => {
  const data = event.data;
  console.log('[FCM-SW] Message received:', data);
  
  // Handle ping/pong for service worker status checks
  if (data && data.type === 'PING') {
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ 
        type: 'PONG', 
        timestamp: Date.now(),
        version: '1.2.0'
      });
    }
  }
  
  // Store user role for better navigation on notification click
  if (data && data.type === 'SET_USER_ROLE') {
    userRole = data.role;
    console.log('[FCM-SW] User role set:', userRole);
    
    // Confirm receipt
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ 
        type: 'USER_ROLE_SET',
        role: userRole,
        timestamp: Date.now()
      });
    }
  }
  
  // Request for service worker diagnostics
  if (data && data.type === 'DIAGNOSTICS_REQUEST') {
    if (event.source && event.source.postMessage) {
      event.source.postMessage({
        type: 'DIAGNOSTICS_RESPONSE',
        version: '1.2.0',
        userRole: userRole,
        lastNotification: lastNotificationData,
        timestamp: Date.now()
      });
    }
  }
  
  // Test notification request
  if (data && data.type === 'TEST_NOTIFICATION') {
    const { title, body, options } = data;
    self.registration.showNotification(title || 'Test Notification', {
      body: body || 'This is a test notification from the service worker',
      icon: '/logo.png',
      ...(options || {}),
      data: {
        ...(options?.data || {}),
        timestamp: Date.now(),
        isTest: true
      }
    }).then(() => {
      if (event.source && event.source.postMessage) {
        event.source.postMessage({
          type: 'TEST_NOTIFICATION_SHOWN',
          timestamp: Date.now()
        });
      }
    }).catch(error => {
      if (event.source && event.source.postMessage) {
        event.source.postMessage({
          type: 'TEST_NOTIFICATION_ERROR',
          error: error.toString(),
          timestamp: Date.now()
        });
      }
    });
  }
});

// Keep service worker alive
const keepAliveInterval = 15 * 60 * 1000; // 15 minutes
setInterval(() => {
  console.log('[FCM-SW] Keeping service worker alive');
  
  // Check caches and refresh if needed
  caches.open('fcm-assets-v2').then(cache => {
    cache.match('/logo.png').then(response => {
      if (!response) {
        console.log('[FCM-SW] Refreshing cache assets');
        cache.addAll([
          '/logo.png',
          '/notification.mp3',
          '/ringtonenotification.mp3'
        ]);
      }
    });
  });
}, keepAliveInterval);

console.log('[FCM-SW] Service worker setup complete');
