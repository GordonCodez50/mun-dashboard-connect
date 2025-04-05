
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { notificationService } from './services/notificationService';
import { 
  isNotificationSupported,
  getNotificationPermissionStatus,
  isAndroid,
  isChrome,
  isIOS,
  getIOSVersion,
  canPotentiallyEnableNotifications
} from '@/utils/notificationPermission';

// Add viewport meta for proper mobile rendering
const updateViewportMeta = () => {
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
};

// Call immediately
updateViewportMeta();

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
    isIOS: isIOS(),
    iosVersion: isIOS() ? getIOSVersion() : 0,
    isChrome: isChrome(),
    canPotentiallyEnableNotifications: canPotentiallyEnableNotifications(),
    userAgent: navigator.userAgent
  }
};

console.log('Notification support status:', notificationStatus);

// Check for notification support early
if (notificationService.isNotificationSupported()) {
  console.log('Browser notifications are supported');
  
  // Check for specific issues with iOS
  if (isIOS()) {
    const iosVersion = getIOSVersion();
    console.log(`iOS ${iosVersion} detected`);
    
    if (iosVersion >= 16.4) {
      console.log('iOS 16.4+ supports web push notifications');
    } else if (iosVersion >= 16) {
      console.log('iOS 16-16.3 detected - limited notification support');
    } else {
      console.log('iOS version does not support web push notifications');
    }
  }
  
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
