
// Firebase Cloud Messaging Service Worker

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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: payload.data?.requireInteraction === 'true'
  };

  // Create and show the notification
  self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => console.log('Notification shown successfully'))
    .catch(error => console.error('Error showing notification:', error));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click', event);
  event.notification.close();
  
  // Handle the user clicking on the notification
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, focus it
        if (client.url === urlToOpen && 'focus' in client) {
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

// Add message handlers to communicate with the page
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message received', event.data);
  
  if (event.data && event.data.type === 'PING') {
    // Respond to ping message to verify service worker is running
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: 'PONG' });
    }
  }
});
