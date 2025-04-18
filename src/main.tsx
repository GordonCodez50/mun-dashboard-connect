
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

// Improved service worker registration function
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return;
  }

  try {
    // First unregister any existing service workers to ensure clean state
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
    
    // Register with cache-busting parameter to ensure latest version
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js?v=' + Date.now(), {
      updateViaCache: 'none', // Don't use cached version
      scope: '/'
    });
    
    console.log('Service Worker registered successfully with scope:', registration.scope);
    
    // Force immediate update
    await registration.update();
    
    // Monitor service worker state
    if (registration.installing) {
      console.log('Service worker installing...');
      registration.installing.addEventListener('statechange', (e) => {
        console.log('Service worker state changed to:', (e.target as any).state);
        if ((e.target as any).state === 'activated') {
          console.log('Service worker now activated');
        }
      });
    } else if (registration.waiting) {
      console.log('Service worker waiting...');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else if (registration.active) {
      console.log('Service worker is active');
      
      // Test communication with service worker
      if (registration.active) {
        registration.active.postMessage({ 
          type: 'PING',
          timestamp: Date.now()
        });
      }
    }
    
    // Set up message listener for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Received message from service worker:', event.data);
      if (event.data && event.data.type === 'PONG') {
        console.log('Service worker responded to ping:', event.data.timestamp);
      }
    });
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    
    // Special handling for Android Chrome
    if (isAndroid() && isChrome()) {
      console.warn('Android Chrome detected. This may affect notifications.');
      // Try alternative registration approach for Android Chrome
      try {
        console.log('Attempting alternative registration approach for Android Chrome');
        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        console.log('Alternative registration succeeded:', reg.scope);
        return reg;
      } catch (altError) {
        console.error('Alternative registration also failed:', altError);
      }
    }
    
    return null;
  }
};

// Execute service worker registration
registerServiceWorker();

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
  
  // Initialize Firebase Cloud Messaging with better error handling
  notificationService.initializeMessaging().catch(err => {
    console.error('Error initializing Firebase messaging:', err);
    // Schedule a retry after a short delay
    setTimeout(() => {
      console.log('Retrying Firebase messaging initialization...');
      notificationService.initializeMessaging();
    }, 3000);
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
