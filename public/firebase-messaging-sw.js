// Firebase Cloud Messaging Service Worker - Cross-Platform Enhanced Version
// Optimized for Chrome and Chrome-based browsers

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Log successful service worker initialization
console.log('Firebase messaging service worker initialized - Chrome Optimized');

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

// Track user role for better navigation (will be set by the application)
let userRole = null;

// Log service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase messaging service worker installed');
  // Force activation without waiting for tabs to close
  self.skipWaiting();
  
  // Cache important files
  event.waitUntil(
    caches.open('fcm-assets-v2').then((cache) => {
      return cache.addAll([
        '/logo.png',
        '/notification.mp3',
        '/ringtonenotification.mp3'
      ]);
    })
  );
});

// Log service worker activation and control all clients
self.addEventListener('activate', (event) => {
  console.log('Firebase messaging service worker activated');
  // Take control of all clients immediately
  event.waitUntil(clients.claim().then(() => {
    // Notify all clients that the service worker is active
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SERVICE_WORKER_ACTIVATED',
          timestamp: Date.now()
        });
      });
    });
  }));
});

// Determine if the device is iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(self.navigator.userAgent);
};

// Determine if the device is Android
const isAndroid = () => {
  return /android/i.test(self.navigator.userAgent);
};

// Determine if the browser is Chrome
const isChrome = () => {
  return /chrome|chromium|crios|edg/i.test(self.navigator.userAgent.toLowerCase()) &&
         !/firefox|fxios|safari/i.test(self.navigator.userAgent.toLowerCase());
};

// Play notification sound (if supported)
const playNotificationSound = async () => {
  try {
    // First try to get from cache
    const cache = await caches.open('fcm-assets-v2');
    const response = await cache.match('/notification.mp3');
    
    if (response) {
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);
      const audio = new self.Audio(objectURL);
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('Error playing notification sound (likely autoplay restriction):', e);
        });
      }
    }
  } catch (e) {
    console.error('Error playing notification sound:', e);
  }
};

// Function to get the correct URL based on user role
const getTargetUrl = (notificationData) => {
  // Get data from notification or use defaults
  const type = notificationData.type || 'alert';
  const role = notificationData.userRole || userRole || 'chair';
  const alertId = notificationData.alertId;
  
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
    return `${currentOrigin}/timer`;
  } else if (type === 'attendance') {
    return `${currentOrigin}/${role === 'admin' ? 'admin-attendance' : 'chair-attendance'}`;
  } else if (type === 'file') {
    return `${currentOrigin}/file-share`;
  } else if (type === 'reply' && alertId) {
    // For replies, go directly to the respective dashboard with alert ID as query param
    return `${currentOrigin}${basePath}?alert=${alertId}`;
  }
  
  // Default fallback
  return `${currentOrigin}${basePath}`;
};

// Handle background messages with improved cross-platform support
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  const notificationTitle = payload.notification.title || 'New Notification';
  
  // Generate unique tag to prevent notification grouping in Chrome
  const uniqueTag = payload.data?.tag || `notification-${Date.now()}`;
  
  // Base notification options
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {},
    tag: uniqueTag,
    requireInteraction: payload.data?.requireInteraction === 'true',
    renotify: payload.data?.renotify === 'true'
  };

  // Add user role from data or stored value
  notificationOptions.data.userRole = payload.data?.userRole || userRole;
  
  // Add timestamp for better sorting in notification center
  notificationOptions.timestamp = Date.now();

  // Chrome-specific optimizations
  if (isChrome()) {
    // Add actions for Chrome (which supports them well)
    if (payload.data?.actions) {
      try {
        notificationOptions.actions = JSON.parse(payload.data.actions);
      } catch (e) {
        console.error('Error parsing notification actions:', e);
      }
    }
    
    // Ensure icon URLs are absolute for Chrome
    if (!notificationOptions.icon.startsWith('http')) {
      notificationOptions.icon = self.location.origin + notificationOptions.icon;
    }
    
    if (!notificationOptions.badge.startsWith('http')) {
      notificationOptions.badge = self.location.origin + notificationOptions.badge;
    }
  }

  // Platform-specific optimizations
  if (isAndroid()) {
    // Add vibration for Android lock screen notifications
    notificationOptions.vibrate = [200, 100, 200];
  }
  
  // Try to play a sound (supported on some browsers)
  playNotificationSound();
  
  // Create and show the notification optimized for lock screen/background
  self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => console.log('Notification shown successfully on lock screen/background'))
    .catch(error => console.error('Error showing notification:', error));
});

// Handle notification click with improved navigation
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click', event);
  
  // Close the notification to avoid duplicate interactions
  event.notification.close();
  
  // Get notification data
  const notificationData = event.notification.data || {};
  console.log('Notification data:', notificationData);
  
  // Get the target URL using the helper function
  const urlToOpen = notificationData.url || getTargetUrl(notificationData);
  
  console.log('[firebase-messaging-sw.js] Will open URL:', urlToOpen);
  
  // Check if specific action was clicked (Android/Chrome feature)
  if (event.action) {
    console.log('[firebase-messaging-sw.js] Action clicked:', event.action);
    // Handle specific action clicks
    if (notificationData.actionUrls && notificationData.actionUrls[event.action]) {
      const actionUrl = notificationData.actionUrls[event.action];
      
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
          // Try to focus an existing window first
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus().then(() => client.navigate(actionUrl));
            }
          }
          // If no matching window, open a new one
          return clients.openWindow(actionUrl);
        })
      );
      
      return;
    }
  }
  
  // Normal notification click handling with improved client focus/navigation
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL or any window
      let anyClient = null;
      let matchingClient = null;
      
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        console.log('Found client with URL:', client.url);
        
        // Store first client as fallback
        if (!anyClient && 'focus' in client) {
          anyClient = client;
        }
        
        // If the client is from our origin, prefer this one
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          matchingClient = client;
          break;  // Use the first matching client
        }
      }
      
      // If we found a matching client from our origin
      if (matchingClient) {
        console.log('Found client from our origin, focusing and navigating to:', urlToOpen);
        return matchingClient.focus().then(() => {
          // Give a small delay to allow focus to complete
          return new Promise(resolve => {
            setTimeout(() => {
              matchingClient.navigate(urlToOpen).then(resolve);
            }, 100);
          });
        });
      }
      
      // If we found any client, use that
      if (anyClient) {
        console.log('Using any available client:', anyClient.url);
        return anyClient.focus().then(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              anyClient.navigate(urlToOpen).then(resolve);
            }, 100);
          });
        });
      }
      
      // If no client found at all, open a new window
      console.log('No existing clients found, opening new window for:', urlToOpen);
      return clients.openWindow(urlToOpen);
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
    
    // Generate unique tag to prevent notification grouping in Chrome
    const uniqueTag = data.data?.tag || `push-${Date.now()}`;
    
    // Extract notification details
    const title = data.notification?.title || 'New Notification';
    const options = {
      body: data.notification?.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      tag: uniqueTag,
      data: {
        ...data.data,
        userRole: data.data?.userRole || userRole // Use notification data role or fallback to stored
      },
      requireInteraction: data.data?.requireInteraction === 'true'
    };
    
    // Chrome-specific optimizations
    if (isChrome()) {
      // Ensure icon URLs are absolute for Chrome
      if (!options.icon.startsWith('http')) {
        options.icon = self.location.origin + options.icon;
      }
      
      if (!options.badge.startsWith('http')) {
        options.badge = self.location.origin + options.badge;
      }
    }
    
    // Add URL to data if not present
    if (!options.data.url) {
      options.data.url = getTargetUrl(options.data);
    }
    
    // Try to play a sound
    playNotificationSound();
    
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
        tag: `plain-text-${Date.now()}`,
        data: {
          userRole, // Include user role for routing
          timestamp: Date.now()
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
      event.source.postMessage({ 
        type: 'PONG', 
        timestamp: Date.now(),
        browser: isChrome() ? 'chrome' : isIOS() ? 'ios' : 'other'
      });
    }
  }
  
  // Handle notification permission check
  if (event.data && event.data.type === 'CHECK_NOTIFICATION_PERMISSION') {
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ 
        type: 'NOTIFICATION_PERMISSION_RESULT',
        permission: 'granted',
        serviceWorkerActive: true,
        browser: isChrome() ? 'chrome' : isIOS() ? 'ios' : 'other'
      });
    }
  }
  
  // Store user role for better navigation on notification click
  if (event.data && event.data.type === 'SET_USER_ROLE') {
    userRole = event.data.role;
    console.log('[firebase-messaging-sw.js] User role set:', userRole);
    
    // Confirm receipt
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ 
        type: 'USER_ROLE_SET',
        role: userRole
      });
    }
  }
});

// Keep-alive interval to prevent service worker from being terminated
// This is especially important for Chrome which might terminate inactive service workers
setInterval(() => {
  console.log('[firebase-messaging-sw.js] Keeping service worker alive');
}, 1000 * 60 * 15); // Every 15 minutes
