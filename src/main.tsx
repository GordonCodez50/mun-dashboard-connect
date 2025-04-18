
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { notificationService } from './services/notificationService';
import { realtimeService } from './services/realtimeService';
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

// Register service worker for FCM with better error handling and retries
if ('serviceWorker' in navigator) {
  // Unregister any existing service workers first to ensure clean state
  navigator.serviceWorker.getRegistrations().then(registrations => {
    // Unregister all existing service workers
    const unregisterPromises = registrations.map(registration => registration.unregister());
    
    // After unregistering, register the new service worker
    Promise.all(unregisterPromises).then(() => {
      // Register with a timestamp to force update
      navigator.serviceWorker.register(`/firebase-messaging-sw.js?v=${Date.now()}`, {
        updateViaCache: 'none', // Don't use cached version
        scope: '/'
      })
      .then(registration => {
        console.log('Service Worker registered successfully with scope:', registration.scope);
        
        // Immediately update the service worker if needed
        registration.update();
        
        // Check for active service worker
        if (registration.active) {
          console.log('Service worker is active and ready');
        } else {
          console.log('Service worker registered but not yet active, waiting for activation');
          registration.installing?.addEventListener('statechange', e => {
            if ((e.target as any).state === 'activated') {
              console.log('Service worker now activated');
            }
          });
        }
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
        
        // If we're on Android Chrome and service worker failed, log detailed info
        if (isAndroid() && isChrome()) {
          console.warn('Android Chrome detected with service worker failure. This may affect notifications.');
        }
      });
    });
  });
  
  // Also set up a communication channel with the service worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'SERVICE_WORKER_ACTIVATED') {
      console.log('Received confirmation that service worker is activated');
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

// User role detection from localStorage (if the user was previously logged in)
const getUserRoleFromStorage = (): 'admin' | 'chair' | 'press' | null => {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user && user.role) {
        if (user.role === 'admin') return 'admin';
        if (user.role === 'chair') {
          return user.council === 'PRESS' ? 'press' : 'chair';
        }
      }
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
    }
  }
  return null;
};

// Get user role from storage if available
const userRole = getUserRoleFromStorage();
if (userRole) {
  console.log('User role found in storage:', userRole);
  notificationService.setUserRole(userRole);
}

// Check for notification support early
if (notificationService.isNotificationSupported()) {
  console.log('Browser notifications are supported');
  
  // Initialize Firebase Cloud Messaging
  notificationService.initializeMessaging().catch(err => {
    console.error('Error initializing Firebase messaging:', err);
  });
  
  // Initialize global alert listeners to work across all pages
  realtimeService.initializeAlertListeners();
  
  // Test service worker connection
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PING',
      timestamp: Date.now()
    });
  }
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
