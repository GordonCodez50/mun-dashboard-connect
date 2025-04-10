
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { notificationService } from './services/notificationService';
import { 
  isNotificationSupported,
  getNotificationPermissionStatus,
  isAndroid,
  isChrome 
} from '@/utils/notificationPermission';

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Register service worker for FCM with better error handling
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(err => {
      console.error('Service Worker registration failed:', err);
      
      // If we're on Android Chrome and service worker failed, log detailed info
      if (isAndroid() && isChrome()) {
        console.warn('Android Chrome detected with service worker failure. This may affect notifications.');
      }
    });
}

// Check for notification support early and log platform information
const notificationStatus = {
  supported: isNotificationSupported(),
  permission: getNotificationPermissionStatus(),
  platform: {
    isAndroid: isAndroid(),
    isChrome: isChrome(),
    userAgent: navigator.userAgent
  }
};

console.log('Notification support status:', notificationStatus);

// Check for notification support early
if (notificationService.isNotificationSupported()) {
  console.log('Browser notifications are supported');
  
  // Initialize Firebase Cloud Messaging
  notificationService.initializeMessaging().catch(err => {
    console.error('Error initializing Firebase messaging:', err);
  });
} else {
  console.warn('Browser notifications are not supported in this browser');
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
