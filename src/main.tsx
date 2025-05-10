
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { notificationService } from './services/notificationService';
import { realtimeService } from './services/realtimeService';
import { 
  isNotificationSupported,
  requestNotificationPermission,
  isAndroid,
  isChrome,
  isEdge 
} from '@/utils/crossPlatformNotifications';

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Improved service worker registration function with Chrome optimizations
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    console.log('Registering service worker...');
    
    // Check if we already have registrations
    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    console.log('Existing service worker registrations:', existingRegistrations.length);
    
    // For Chrome, we may need to unregister old service workers to avoid conflicts
    if ((isChrome() || isEdge()) && existingRegistrations.length > 0) {
      console.log('Chrome/Edge detected with existing service workers, checking for updates');
      
      // Try updating each registration rather than unregistering
      const updatePromises = existingRegistrations.map(reg => {
        console.log('Updating service worker scope:', reg.scope);
        return reg.update();
      });
      
      await Promise.all(updatePromises);
      console.log('Service worker update completed');
    }
    
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
      });
    } else if (registration.waiting) {
      console.log('Service worker waiting...');
      // For Chrome, we want to activate the waiting worker immediately
      if (isChrome() || isEdge()) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('Sent SKIP_WAITING message to waiting worker');
      }
    } else if (registration.active) {
      console.log('Service worker is active');
      
      // Test communication with service worker
      registration.active.postMessage({ 
        type: 'PING',
        timestamp: Date.now(),
        browser: isChrome() ? 'chrome' : isAndroid() ? 'android' : 'other'
      });
    }
    
    // Set up message listener for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Received message from service worker:', event.data);
      
      // For Chrome, check if we need to reload for a new service worker
      if (event.data && event.data.type === 'RELOAD_PAGE_FOR_UPDATE') {
        console.log('Reloading page for service worker update');
        window.location.reload();
      }
    });
    
    // Set up controller change listener (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker controller changed (new service worker activated)');
    });
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Execute service worker registration
registerServiceWorker();

// Check for notification support early and log platform information
const notificationStatus = {
  supported: isNotificationSupported(),
  permission: Notification.permission, 
  platform: {
    isAndroid: isAndroid(),
    isChrome: isChrome(),
    isEdge: isEdge(),
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
  
  // For Chrome, we need to be more careful about initialization timing
  if (isChrome() || isEdge()) {
    console.log('Chrome/Edge detected, ensuring service worker is ready before initializing messaging');
    
    // Wait for service worker to be ready
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('Service worker is ready, initializing Firebase messaging');
        
        // Initialize Firebase Cloud Messaging with better error handling
        notificationService.initializeMessaging().catch(err => {
          console.error('Error initializing Firebase messaging:', err);
        });
      });
    }
  } else {
    // For other browsers, initialize directly
    notificationService.initializeMessaging().catch(err => {
      console.error('Error initializing Firebase messaging:', err);
    });
  }
  
  // Initialize global alert listeners to work across all pages
  realtimeService.initializeAlertListeners();
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
