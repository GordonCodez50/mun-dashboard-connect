
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

// Improved service worker registration with retries
const registerServiceWorker = async (retryCount = 0): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    console.log('Registering service worker with cache busting...');
    
    // Use cache busting to ensure the latest version
    const swUrl = '/firebase-messaging-sw.js?v=' + Date.now();
    
    // Register with appropriate options
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
      updateViaCache: 'none' // Don't use cached version
    });
    
    console.log('Service Worker registered successfully with scope:', registration.scope);
    
    // Force immediate update
    try {
      await registration.update();
      console.log('Service worker update triggered');
    } catch (updateError) {
      console.warn('Error updating service worker:', updateError);
    }
    
    // Monitor service worker state
    if (registration.installing) {
      console.log('Service worker installing...');
      
      // Listen for state changes
      registration.installing.addEventListener('statechange', (e) => {
        console.log('Service worker state changed to:', (e.target as any).state);
        
        if ((e.target as any).state === 'activated') {
          console.log('Service worker now activated');
          
          // Test communication
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ 
              type: 'PING',
              timestamp: Date.now()
            });
          }
        }
      });
    } else if (registration.waiting) {
      console.log('Service worker waiting...');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else if (registration.active) {
      console.log('Service worker is active');
      
      // Test communication
      registration.active.postMessage({ 
        type: 'PING',
        timestamp: Date.now()
      });
    }
    
    // Set up message listener for service worker responses
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Received message from service worker:', event.data);
    });
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    
    // Retry logic for registration failures
    if (retryCount < 3) {
      console.log(`Retrying service worker registration (attempt ${retryCount + 1}/3)...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      return registerServiceWorker(retryCount + 1);
    }
    
    // Special handling for Android Chrome
    if (isAndroid() && isChrome() && retryCount >= 3) {
      console.warn('Android Chrome detected with persistent failures. Trying alternative approach...');
      
      try {
        // Alternative registration for Android Chrome
        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { 
          scope: '/' 
        });
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
registerServiceWorker().then(registration => {
  if (registration) {
    console.log('Service worker registration complete');
    
    // Check for notification support
    if (notificationService.isNotificationSupported()) {
      // Initialize Firebase messaging once service worker is ready
      notificationService.initializeMessaging().catch(err => {
        console.error('Error initializing Firebase messaging:', err);
        
        // Schedule a retry after a short delay
        setTimeout(() => {
          console.log('Retrying Firebase messaging initialization...');
          notificationService.initializeMessaging();
        }, 3000);
      });
    }
  } else {
    console.warn('Service worker registration failed or is not supported');
  }
});

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

// User role detection from localStorage (for quicker initialization)
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

// Initialize global alert listeners to ensure they work across all pages
realtimeService.initializeAlertListeners();

// Mount the React application
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
