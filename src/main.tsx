
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
  isEdge,
  isIOS,
  isSafari,
  isPwa,
  isMacOS,
  isIOS164PlusWithWebPush
} from '@/utils/crossPlatformNotifications';

import { 
  hasSafariLimitations, 
  initializeSafariNotificationWorkaround 
} from '@/utils/safariNotifications';

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Improved service worker registration function with platform-specific optimizations
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    console.log('Registering service worker...');
    
    // Check platform specifics
    console.log('Browser info:', { 
      isAndroid: isAndroid(), 
      isChrome: isChrome(),
      isEdge: isEdge(),
      isIOS: isIOS(),
      isSafari: isSafari(),
      isPwa: isPwa(),
      isMacOS: isMacOS(),
      isIOS164PWA: isIOS164PlusWithWebPush()
    });
    
    // For Safari on macOS, use a Safari-specific service worker
    if (isSafari() && isMacOS()) {
      console.log('Safari on macOS detected, using Safari-specific service worker');
      
      try {
        const registration = await navigator.serviceWorker.register('/safari-push-worker.js', {
          scope: '/'
        });
        console.log('Safari push service worker registered with scope:', registration.scope);
        return registration;
      } catch (safariError) {
        console.error('Safari service worker registration failed:', safariError);
        // Fall back to standard service worker
      }
    }
    
    // For iOS PWA on iOS 16.4+, ensure we're using the right service worker
    if (isIOS() && isPwa() && isIOS164PlusWithWebPush()) {
      console.log('iOS 16.4+ PWA detected, ensuring push support is enabled');
    }
    
    // Check if we already have registrations
    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    console.log('Existing service worker registrations:', existingRegistrations.length);
    
    // For Chrome/Edge, we may need to unregister old service workers to avoid conflicts
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
        browser: isChrome() ? 'chrome' : 
                 isEdge() ? 'edge' :
                 isSafari() ? 'safari' :
                 isAndroid() ? 'android' : 'other'
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

// Initialize temporary service worker for Android Chrome
const registerTempServiceWorker = async () => {
  if (isAndroid() && isChrome() && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/temp-notification-sw.js', {
        scope: '/'
      });
      console.log('Temporary notification service worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Failed to register temporary service worker:', error);
      return null;
    }
  }
  return null;
};

// Execute service worker registration
registerServiceWorker();

// For Android Chrome, also register the temporary notification service worker
// This helps with notification permission requests
if (isAndroid() && isChrome()) {
  registerTempServiceWorker();
}

// For Safari/iOS with limitations, initialize the fallback mechanism
if (hasSafariLimitations() && isNotificationSupported() && Notification.permission === 'granted') {
  console.log('Initializing Safari/iOS notification fallback mechanism');
  initializeSafariNotificationWorkaround();
}

// Check for notification support early and log platform information
const notificationStatus = {
  supported: isNotificationSupported(),
  permission: Notification.permission, 
  platform: {
    isAndroid: isAndroid(),
    isChrome: isChrome(),
    isEdge: isEdge(),
    isIOS: isIOS(),
    isSafari: isSafari(),
    isMacOS: isMacOS(),
    isPwa: isPwa(),
    isIOS164PWA: isIOS164PlusWithWebPush(),
    hasSafariLimitations: hasSafariLimitations(),
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
  
  // Platform-specific initialization
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
  } else if (isSafari() && isMacOS()) {
    console.log('Safari on macOS detected, initializing with Safari-specific approach');
    notificationService.initializeMessaging().catch(err => {
      console.error('Error initializing Safari notifications:', err);
    });
  } else if (isIOS() && isPwa() && isIOS164PlusWithWebPush()) {
    console.log('iOS 16.4+ PWA detected, initializing web push');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        notificationService.initializeMessaging().catch(err => {
          console.error('Error initializing iOS PWA notifications:', err);
        });
      });
    }
  } else if (hasSafariLimitations()) {
    console.log('Safari/iOS with limitations detected, initializing fallback mechanisms');
    notificationService.initializeMessaging().catch(err => {
      console.error('Error initializing fallback notification system:', err);
    });
  } else {
    // For other browsers, initialize directly
    notificationService.initializeMessaging().catch(err => {
      console.error('Error initializing notifications:', err);
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

// Add meta tags for iOS PWA support
if (isIOS()) {
  // Add meta tags for better iOS PWA experience
  const metaTags = [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'MUN Dashboard' }
  ];
  
  metaTags.forEach(tag => {
    const metaTag = document.querySelector(`meta[name="${tag.name}"]`);
    if (!metaTag) {
      const newMeta = document.createElement('meta');
      newMeta.name = tag.name;
      newMeta.content = tag.content;
      document.head.appendChild(newMeta);
    }
  });
  
  // Add apple touch icon link if it doesn't exist
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const linkTag = document.createElement('link');
    linkTag.rel = 'apple-touch-icon';
    linkTag.href = '/logo.png';
    document.head.appendChild(linkTag);
  }
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
