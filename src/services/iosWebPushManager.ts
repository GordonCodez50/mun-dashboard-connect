/**
 * iOS PWA Web Push Manager
 * Handles native Web Push API for iOS PWAs (16.4+)
 */

import { isIOS, isPwa, isIOS164PlusWithWebPush } from '@/utils/crossPlatformNotifications';
import { notificationLogger } from './notificationLogger';

const VAPID_PUBLIC_KEY = 'BLW7VJrM3F8oL2IFysoC7monAgQ_dTWeaZZU3y3Hp0SgGK0C_jPBqknMcMs4v6v6NxJAaa0mqJDoNEn3Ce1Y0F8';

let pushSubscription: PushSubscription | null = null;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

/**
 * Convert base64 VAPID key to Uint8Array
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Check if iOS PWA Web Push is supported
 */
export const isIOSWebPushSupported = (): boolean => {
  return isIOS() && isPwa() && isIOS164PlusWithWebPush() && 'PushManager' in window;
};

/**
 * Initialize iOS PWA Web Push
 */
export const initializeIOSWebPush = async (): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> => {
  console.log('Initializing iOS PWA Web Push...');

  if (!isIOSWebPushSupported()) {
    const error = 'iOS PWA Web Push not supported on this device/configuration';
    console.warn(error);
    notificationLogger.logDebug('ios_webpush_unsupported', error, {
      isIOS: isIOS(),
      isPWA: isPwa(),
      isIOS164Plus: isIOS164PlusWithWebPush(),
      hasPushManager: 'PushManager' in window
    });
    return { success: false, error };
  }

  try {
    // Register iOS PWA service worker
    serviceWorkerRegistration = await navigator.serviceWorker.register('/ios-pwa-push-sw.js', {
      scope: '/'
    });

    console.log('iOS PWA service worker registered:', serviceWorkerRegistration);
    notificationLogger.logServiceWorker('ios_pwa_register_success', 'success', 'iOS PWA service worker registered successfully');

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Check for existing subscription
    const existingSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
    
    if (existingSubscription) {
      console.log('Found existing iOS PWA push subscription');
      pushSubscription = existingSubscription;
      localStorage.setItem('iosPwaSubscription', JSON.stringify(existingSubscription.toJSON()));
      
      notificationLogger.logDebug('ios_webpush_existing_subscription', 'Found existing iOS PWA push subscription');
      
      return { success: true, subscription: existingSubscription };
    }

    // Create new subscription
    const subscription = await serviceWorkerRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('iOS PWA push subscription created:', subscription);
    pushSubscription = subscription;
    
    // Store subscription
    localStorage.setItem('iosPwaSubscription', JSON.stringify(subscription.toJSON()));
    
    notificationLogger.logDebug('ios_webpush_subscription_created', 'iOS PWA push subscription created successfully', {
      endpoint: subscription.endpoint
    });

    return { success: true, subscription };

  } catch (error) {
    console.error('Error initializing iOS PWA Web Push:', error);
    notificationLogger.log('error', 'ios_webpush_init_failed', 'error', 'Failed to initialize iOS PWA Web Push', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Request iOS PWA push permission
 */
export const requestIOSPushPermission = async (): Promise<{
  granted: boolean;
  subscription?: PushSubscription;
  error?: string;
}> => {
  if (!isIOSWebPushSupported()) {
    return {
      granted: false,
      error: 'iOS PWA Web Push not supported'
    };
  }

  try {
    // Request notification permission first
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      notificationLogger.logPermissionRequest('error', permission);
      return {
        granted: false,
        error: `Permission ${permission}`
      };
    }

    // Initialize Web Push
    const result = await initializeIOSWebPush();
    
    if (result.success && result.subscription) {
      notificationLogger.logPermissionRequest('success', 'granted');
      return {
        granted: true,
        subscription: result.subscription
      };
    } else {
      return {
        granted: false,
        error: result.error || 'Failed to initialize Web Push'
      };
    }

  } catch (error) {
    console.error('Error requesting iOS push permission:', error);
    notificationLogger.logPermissionRequest('error', 'default', error);
    
    return {
      granted: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Send a test notification via iOS PWA Web Push (background capable)
 */
export const testIOSWebPush = async (): Promise<boolean> => {
  if (!pushSubscription || !serviceWorkerRegistration) {
    console.warn('No iOS PWA push subscription available for testing');
    return false;
  }

  try {
    // Send both a local test notification and a background push
    await serviceWorkerRegistration.showNotification('iOS PWA Test (Local)', {
      body: 'iOS PWA local notifications are working!',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'ios-pwa-test-local',
      vibrate: [200, 100, 200]
    } as any);

    // Also test background push capability
    await sendIOSBackgroundPush('iOS PWA Test (Background)', {
      body: 'iOS PWA background notifications are working!',
      icon: '/logo.png',
      tag: 'ios-pwa-test-background'
    });

    console.log('iOS PWA test notifications sent (local + background)');
    notificationLogger.logNotificationShow('success', 'iOS PWA Test', { body: 'Test notification', method: 'ios_webpush' });
    
    return true;
  } catch (error) {
    console.error('Error sending iOS PWA test notification:', error);
    notificationLogger.logNotificationShow('error', 'iOS PWA Test', { method: 'ios_webpush' }, error);
    
    return false;
  }
};

/**
 * Show notification via iOS PWA Web Push (background capable)
 */
export const showIOSNotification = async (title: string, options: {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  vibrate?: number[];
}): Promise<boolean> => {
  // Always send as background push to ensure it works when app is closed
  return await sendIOSBackgroundPush(title, options);
};

/**
 * Show local notification (only when app is active)
 */
export const showIOSLocalNotification = async (title: string, options: {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  vibrate?: number[];
}): Promise<boolean> => {
  if (!serviceWorkerRegistration) {
    console.warn('No iOS PWA service worker registration available');
    return false;
  }

  try {
    const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
      body: options.body || '',
      icon: options.icon || '/logo.png',
      badge: options.badge || '/logo.png',
      tag: options.tag || `notification-${Date.now()}`,
      data: options.data || {},
      requireInteraction: options.requireInteraction || false,
      vibrate: options.vibrate || [200, 100, 200]
    };

    await serviceWorkerRegistration.showNotification(title, notificationOptions);
    
    console.log('iOS PWA local notification sent:', title);
    notificationLogger.logNotificationShow('success', title, { ...options, method: 'ios_webpush_local' });
    
    return true;
  } catch (error) {
    console.error('Error showing iOS PWA local notification:', error);
    notificationLogger.logNotificationShow('error', title, { ...options, method: 'ios_webpush_local' }, error);
    
    return false;
  }
};

/**
 * Send background push notification via Web Push Protocol
 * This works even when the app is closed or in background
 */
export const sendIOSBackgroundPush = async (title: string, options: {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  vibrate?: number[];
}): Promise<boolean> => {
  if (!pushSubscription) {
    console.warn('No iOS PWA push subscription available for background push');
    return false;
  }

  try {
    const payload = {
      title,
      body: options.body || '',
      icon: options.icon || '/logo.png',
      badge: options.badge || '/logo.png',
      tag: options.tag || `notification-${Date.now()}`,
      data: options.data || {},
      requireInteraction: options.requireInteraction || false,
      vibrate: options.vibrate || [200, 100, 200]
    };

    // Send via our Supabase edge function for Web Push
    const supabaseUrl = 'https://iunqhcqcxtbgduayjhhv.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/send-ios-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: pushSubscription.toJSON(),
        payload
      })
    });

    if (!response.ok) {
      throw new Error(`Push send failed: ${response.status}`);
    }

    console.log('iOS PWA background push sent:', title);
    notificationLogger.logNotificationShow('success', title, { ...options, method: 'ios_webpush_background' });
    
    return true;
  } catch (error) {
    console.error('Error sending iOS PWA background push:', error);
    notificationLogger.logNotificationShow('error', title, { ...options, method: 'ios_webpush_background' }, error);
    
    // Fallback to local notification if background push fails
    return await showIOSLocalNotification(title, options);
  }
};

/**
 * Get current iOS PWA push subscription
 */
export const getIOSPushSubscription = (): PushSubscription | null => {
  return pushSubscription;
};

/**
 * Get stored subscription from localStorage
 */
export const getStoredIOSSubscription = (): any => {
  try {
    const stored = localStorage.getItem('iosPwaSubscription');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error retrieving stored iOS subscription:', error);
    return null;
  }
};

/**
 * Cleanup iOS Web Push resources
 */
export const cleanupIOSWebPush = async (): Promise<void> => {
  try {
    if (pushSubscription) {
      await pushSubscription.unsubscribe();
      pushSubscription = null;
    }
    
    localStorage.removeItem('iosPwaSubscription');
    console.log('iOS Web Push resources cleaned up');
  } catch (error) {
    console.error('Error cleaning up iOS Web Push:', error);
  }
};