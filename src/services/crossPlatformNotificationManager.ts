/**
 * Comprehensive Cross-Platform Notification Manager
 * 
 * This service handles all notification scenarios across different devices:
 * - iOS Safari (browser): Limited support, uses fallbacks
 * - iOS PWA (16.4+): Full FCM support when added to home screen
 * - Android Chrome: Full FCM support
 * - Safari macOS: FCM support with some quirks
 * - Other browsers: Standard web notifications
 */

import { initializeApp, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { firebaseConfig } from '@/config/firebaseConfig';
import { toast } from 'sonner';

// Cross-platform utilities
import { 
  isAndroid, 
  isChrome, 
  isIOS,
  isSafari,
  isMacOS,
  isPwa,
  isIOS164PlusWithWebPush,
  isServiceWorkerSupported,
  isNotificationSupported as checkNotificationSupport,
  isWebPushSupported,
  playNotificationSound
} from '@/utils/crossPlatformNotifications';

import { playManagedNotificationSound } from '@/utils/mediaSessionManager';

import {
  storeNotificationForLater,
  checkForStoredNotifications,
  initializeSafariNotificationWorkaround,
  hasSafariLimitations,
  createSafariNotificationGuide
} from '@/utils/safariNotifications';

import { notificationLogger } from '@/services/notificationLogger';
import { initializeIOSWebPush, requestIOSPushPermission, showIOSNotification } from '@/services/iosWebPushManager';

// The public VAPID key for web push
const VAPID_KEY = 'BLW7VJrM3F8oL2IFysoC7monAgQ_dTWeaZZU3y3Hp0SgGK0C_jPBqknMcMs4v6v6NxJAaa0mqJDoNEn3Ce1Y0F8';

// State management
let firebaseApp: any;
let messaging: any = null;
let currentUserRole: 'admin' | 'chair' | 'press' | 'logistics' | null = null;
let isInitialized = false;
let cleanupFunctions: Array<() => void> = [];

// Notification tracking to prevent duplicates
let lastNotificationId: string | null = null;
let lastNotificationTimestamp = 0;

// Initialize Firebase app
try {
  firebaseApp = getApp();
} catch (e) {
  firebaseApp = initializeApp(firebaseConfig);
}

/**
 * Comprehensive initialization that works on all platforms
 */
export const initializeCrossPlatformNotifications = async (): Promise<{
  success: boolean;
  platform: string;
  capabilities: string[];
  recommendations?: string[];
}> => {
  if (isInitialized) {
    console.log('Cross-platform notifications already initialized');
    return {
      success: true,
      platform: getPlatformInfo().platform,
      capabilities: getCapabilities()
    };
  }

  console.log('Initializing cross-platform notifications...');
  
  const platformInfo = getPlatformInfo();
  console.log('Platform detection:', platformInfo);
  
  // Log initialization attempt
  notificationLogger.logDebug('initialization_start', 'Starting cross-platform notification initialization', {
    platform: platformInfo.platform,
    supportsFCM: platformInfo.supportsFCM,
    needsFallbacks: platformInfo.needsFallbacks
  });

  try {
    // Clean up any existing initialization
    cleanup();

    // Initialize based on platform capabilities
    if (platformInfo.supportsFCM) {
      await initializeFCM();
    }

    // Initialize iOS PWA Web Push for supported devices
    if (platformInfo.supportsIOSWebPush) {
      await initializeIOSWebPush();
    }

    // Initialize fallbacks for iOS and Safari
    if (platformInfo.needsFallbacks) {
      initializeFallbacks();
    }

    // Set up general notification listeners
    setupGeneralListeners();

    isInitialized = true;

    const result = {
      success: true,
      platform: platformInfo.platform,
      capabilities: getCapabilities(),
      recommendations: getRecommendations()
    };

    console.log('Cross-platform notifications initialized:', result);
    
    // Log successful initialization
    notificationLogger.logDebug('initialization_success', 'Cross-platform notifications initialized successfully', result);
    
    return result;

  } catch (error) {
    console.error('Error initializing cross-platform notifications:', error);
    
    // Log initialization error
    notificationLogger.log('error', 'initialization_failed', 'error', 'Failed to initialize cross-platform notifications', error, {
      platform: platformInfo.platform
    });
    
    return {
      success: false,
      platform: platformInfo.platform,
      capabilities: [],
      recommendations: getRecommendations()
    };
  }
};

/**
 * Get detailed platform information
 */
const getPlatformInfo = () => {
  const platform = 
    isIOS() && isPwa() ? 'iOS PWA' :
    isIOS() ? 'iOS Safari' :
    isAndroid() && isChrome() ? 'Android Chrome' :
    isAndroid() ? 'Android Other' :
    isSafari() && isMacOS() ? 'Safari macOS' :
    isChrome() ? 'Chrome Desktop' :
    'Other Browser';

  // Updated FCM support detection - iOS devices should NOT use Firebase messaging
  const supportsFCM = 
    // iOS devices: Never use FCM, even in PWA mode - use native Web Push instead
    !isIOS() && (
      (isAndroid() && isServiceWorkerSupported()) ||
      (isSafari() && isMacOS() && isServiceWorkerSupported()) ||
      (!isSafari() && isServiceWorkerSupported() && isWebPushSupported())
    );

  const needsFallbacks = hasSafariLimitations() || isIOS();
  const supportsIOSWebPush = isIOS() && isPwa() && isIOS164PlusWithWebPush();

  return {
    platform,
    supportsFCM,
    needsFallbacks,
    supportsIOSWebPush,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isPWA: isPwa(),
    isSafari: isSafari(),
    isMacOS: isMacOS(),
    supportsServiceWorker: isServiceWorkerSupported(),
    supportsWebPush: isWebPushSupported(),
    supportsNotifications: checkNotificationSupport()
  };
};

/**
 * Initialize Firebase Cloud Messaging
 */
const initializeFCM = async () => {
  console.log('Initializing Firebase Cloud Messaging...');

  try {
    // Only initialize if we detect FCM support
    if (!isServiceWorkerSupported() || !isWebPushSupported()) {
      throw new Error('Browser does not support FCM requirements');
    }

    messaging = getMessaging(firebaseApp);
    console.log('Firebase messaging instance created');
    
    // Log FCM messaging instance creation
    notificationLogger.logDebug('fcm_instance_created', 'Firebase messaging instance created successfully');

    // Register service worker if needed
    await ensureServiceWorkerRegistered();

    // Set up foreground message handling
    setupFCMListener();

    console.log('FCM initialization complete');
    notificationLogger.logDebug('fcm_init_complete', 'FCM initialization completed successfully');
  } catch (error) {
    console.error('FCM initialization failed:', error);
    
    // Log FCM initialization failure
    notificationLogger.log('error', 'fcm_init_failed', 'error', 'FCM initialization failed', error);
    
    messaging = null;
  }
};

/**
 * Ensure service worker is registered for FCM
 */
const ensureServiceWorkerRegistered = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    // Check for existing registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    let swRegistration = registrations.find(reg => 
      reg.scope.includes('firebase-messaging-sw.js') || 
      reg.active?.scriptURL.includes('firebase-messaging-sw.js')
    );

    if (!swRegistration) {
      console.log('Registering FCM service worker...');
      
      // Log service worker registration attempt
      notificationLogger.logServiceWorker('register_attempt', 'info', 'Attempting to register FCM service worker');
      
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('FCM service worker registered');
      
      // Log successful registration
      notificationLogger.logServiceWorker('register_success', 'success', 'FCM service worker registered successfully', undefined, {
        scope: swRegistration.scope,
        scriptURL: swRegistration.active?.scriptURL
      });
    } else {
      console.log('FCM service worker already registered');
      notificationLogger.logServiceWorker('register_existing', 'info', 'FCM service worker already registered', undefined, {
        scope: swRegistration.scope
      });
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    return swRegistration;

  } catch (error) {
    console.error('Service worker registration failed:', error);
    
    // Log service worker registration failure
    notificationLogger.logServiceWorker('register_failed', 'error', 'Service worker registration failed', error);
    
    return null;
  }
};

/**
 * Set up FCM foreground message listener
 */
const setupFCMListener = () => {
  if (!messaging) return;

  try {
    onMessage(messaging, (payload) => {
      console.log('FCM foreground message received:', payload);
      
      // Log FCM message received
      notificationLogger.logDebug('fcm_message_received', 'FCM foreground message received', {
        hasNotification: !!payload.notification,
        hasData: !!payload.data,
        notificationTitle: payload.notification?.title,
        notificationBody: payload.notification?.body
      });
      
      handleFCMMessage(payload);
    });

    console.log('FCM foreground listener established');
    notificationLogger.logDebug('fcm_listener_setup', 'FCM foreground listener established successfully');
  } catch (error) {
    console.error('Error setting up FCM listener:', error);
    notificationLogger.log('error', 'fcm_listener_failed', 'error', 'Failed to set up FCM listener', error);
  }
};

/**
 * Handle incoming FCM messages
 */
const handleFCMMessage = (payload: any) => {
  if (!payload.notification) return;

  const title = payload.notification.title || 'New Notification';
  const body = payload.notification.body || '';
  
  // Show cross-platform notification
  const notificationShown = showCrossPlatformNotification(title, {
    body,
    data: {
      ...payload.data,
      type: payload.data?.type || 'alert',
      fromFCM: true
    }
  });
  
  // Log notification display attempt
  notificationLogger.logNotificationShow(
    notificationShown ? 'success' : 'error', 
    title, 
    { body, fromFCM: true },
    notificationShown ? undefined : 'Failed to show FCM notification'
  );

  // Also show toast for better UX in foreground
  toast(title, {
    description: body,
    duration: 5000,
  });
};

/**
 * Initialize fallback mechanisms for limited browsers
 */
const initializeFallbacks = () => {
  console.log('Initializing notification fallbacks...');

  // Initialize Safari-specific workarounds
  if (hasSafariLimitations()) {
    const cleanup = initializeSafariNotificationWorkaround();
    cleanupFunctions.push(cleanup);
  }

  // Check for stored notifications on initialization
  checkForStoredNotifications();

  console.log('Fallback mechanisms initialized');
};

/**
 * Set up general notification listeners
 */
const setupGeneralListeners = () => {
  // Listen for page visibility changes to check for stored notifications
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkForStoredNotifications();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  cleanupFunctions.push(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });
};

/**
 * Request notification permission with full cross-platform support
 */
export const requestNotificationPermission = async (): Promise<{
  granted: boolean;
  token?: string;
  iosSubscription?: any;
  error?: string;
  recommendations?: string[];
}> => {
  console.log('Requesting notification permission...');

  try {
    // First check if notifications are supported
    if (!checkNotificationSupport()) {
      return {
        granted: false,
        error: 'Notifications not supported on this device',
        recommendations: getRecommendations()
      };
    }

    // Request permission
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';

    console.log(`Permission result: ${permission}`);
    
    // Log permission request result
    notificationLogger.logPermissionRequest(
      granted ? 'success' : (permission === 'denied' ? 'error' : 'warning'),
      permission
    );

    if (!granted) {
      return {
        granted: false,
        error: permission === 'denied' ? 'Permission denied' : 'Permission not granted',
        recommendations: getRecommendations()
      };
    }

    // Handle platform-specific token requests
    let fcmToken: string | undefined;
    let iosSubscription: any;
    
    const platformInfo = getPlatformInfo();
    
    if (platformInfo.supportsIOSWebPush) {
      // iOS PWA: Use native Web Push
      const iosResult = await requestIOSPushPermission();
      if (iosResult.granted && iosResult.subscription) {
        iosSubscription = iosResult.subscription;
        console.log('iOS PWA push subscription obtained');
      }
    } else if (messaging && platformInfo.supportsFCM) {
      // Other platforms: Use FCM
      fcmToken = await requestFCMToken();
    }

    // Initialize fallbacks if needed
    if (platformInfo.needsFallbacks) {
      initializeFallbacks();
    }

    return {
      granted: true,
      token: fcmToken,
      iosSubscription,
      recommendations: getRecommendations()
    };

  } catch (error) {
    console.error('Error requesting notification permission:', error);
    
    // Log permission request error
    notificationLogger.logPermissionRequest('error', 'default', error);
    
    return {
      granted: false,
      error: `Failed to request permission: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recommendations: getRecommendations()
    };
  }
};

/**
 * Request FCM token with platform-specific handling
 */
const requestFCMToken = async (): Promise<string | undefined> => {
  if (!messaging) {
    console.warn('FCM messaging not available');
    return undefined;
  }

  try {
    const swRegistration = await navigator.serviceWorker.ready;
    
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (token) {
      console.log('FCM token obtained:', token.substring(0, 10) + '...');
      localStorage.setItem('fcmToken', token);
      
      // Log successful token generation
      notificationLogger.logTokenRequest('success', token);
      
      // Inform service worker about user role
      if (currentUserRole && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_USER_ROLE',
          role: currentUserRole
        });
      }
      
      return token;
    } else {
      console.warn('No FCM token available');
      
      // Log token generation failure
      notificationLogger.logTokenRequest('error', undefined, 'No FCM token available');
      
      return undefined;
    }

  } catch (error) {
    console.error('Error requesting FCM token:', error);
    
    // Log FCM token request error
    notificationLogger.logTokenRequest('error', undefined, error);
    
    return undefined;
  }
};

/**
 * Show notification with cross-platform compatibility
 */
export const showCrossPlatformNotification = async (title: string, options: {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  vibrate?: number[];
  requireInteraction?: boolean;
  data?: any;
}): Promise<boolean> => {
  // Check for duplicate notifications
  const now = Date.now();
  const notificationId = `${title}-${options.body}`;
  if (lastNotificationId === notificationId && (now - lastNotificationTimestamp) < 2000) {
    console.log('Preventing duplicate notification:', notificationId);
    return false;
  }

  lastNotificationId = notificationId;
  lastNotificationTimestamp = now;

  // For browsers with limitations, use fallback storage
  if (hasSafariLimitations()) {
    const url = getNotificationUrl(options.data?.type || 'alert');
    storeNotificationForLater(title, options.body || '', url);
    
    // Log fallback notification storage
    notificationLogger.logNotificationShow('success', title, options, 'Used Safari fallback storage');
    
    // If app is visible, show toast
    if (document.visibilityState === 'visible') {
      toast(title, {
        description: options.body,
        duration: 8000,
        action: {
          label: "View",
          onClick: () => window.location.href = url
        }
      });
      playNotificationSound();
    }
    
    return true;
  }

  // Check if we should use iOS PWA Web Push (background capable)
  const platformInfo = getPlatformInfo();
  if (platformInfo.supportsIOSWebPush) {
    try {
      const success = await showIOSNotification(title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction,
        vibrate: options.vibrate
      });
      
      if (success) {
        // Only play sound if app is in foreground
        if (document.visibilityState === 'visible') {
          await playManagedNotificationSound();
        }
        notificationLogger.logNotificationShow('success', title, options, 'iOS PWA Web Push (background capable) used');
        return true;
      }
    } catch (error) {
      console.error('iOS PWA notification failed, falling back:', error);
      notificationLogger.logNotificationShow('error', title, options, error);
    }
  }

  // For standard browsers, use Notification API
  try {
    if (Notification.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      
      // Log permission issue
      notificationLogger.logNotificationShow('error', title, options, 'Permission not granted');
      
      return false;
    }

    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/logo.png',
      badge: options.badge || '/logo.png',
      requireInteraction: options.requireInteraction || false,
      data: {
        ...options.data,
        userRole: currentUserRole,
        url: getNotificationUrl(options.data?.type || 'alert'),
        timestamp: Date.now()
      }
    });

    // Trigger vibration if supported (mobile devices)
    if (navigator.vibrate && options.vibrate) {
      navigator.vibrate(options.vibrate);
    }

    // Handle click
    notification.onclick = () => {
      // Log notification click
      notificationLogger.logNotificationClick({
        title,
        data: options.data,
        timestamp: Date.now()
      });
      
      notification.close();
      if (options.data?.url) {
        window.open(options.data.url, '_blank');
      }
      window.focus();
    };

    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    playNotificationSound();
    
    // Log successful notification display
    notificationLogger.logNotificationShow('success', title, options);
    
    return true;

  } catch (error) {
    console.error('Error showing notification:', error);
    
    // Log notification display error
    notificationLogger.logNotificationShow('error', title, options, error);
    
    return false;
  }
};

/**
 * Get appropriate URL based on notification type and user role
 */
const getNotificationUrl = (type: string): string => {
  if (!currentUserRole) {
    currentUserRole = localStorage.getItem('notificationUserRole') as any;
  }
  
  const baseUrl = currentUserRole === 'admin' ? '/admin-panel' : 
                 currentUserRole === 'press' ? '/press-dashboard' : 
                 '/chair-dashboard';
                 
  switch (type) {
    case 'timer':
      return '/timer';
    case 'attendance':
      return currentUserRole === 'admin' ? '/admin-attendance' : '/chair-attendance';
    case 'alert':
      return baseUrl;
    default:
      return baseUrl;
  }
};

/**
 * Set user role for notification routing
 */
export const setUserRole = (role: 'admin' | 'chair' | 'press' | 'logistics') => {
  console.log('Setting notification user role:', role);
  currentUserRole = role;
  localStorage.setItem('notificationUserRole', role);
  
  // Inform service worker if available
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_USER_ROLE',
      role
    });
  }
};

/**
 * Restore user role from localStorage
 */
export const restoreUserRole = () => {
  const stored = localStorage.getItem('notificationUserRole') as 'admin' | 'chair' | 'press' | 'logistics' | null;
  if (stored) {
    currentUserRole = stored;
    console.log('Restored user role from storage:', stored);
  }
};

/**
 * Get current capabilities
 */
const getCapabilities = (): string[] => {
  const capabilities: string[] = [];
  
  if (checkNotificationSupport()) capabilities.push('Basic Notifications');
  if (getPlatformInfo().supportsFCM) capabilities.push('Firebase Cloud Messaging');
  if (isServiceWorkerSupported()) capabilities.push('Service Workers');
  if (isWebPushSupported()) capabilities.push('Web Push');
  if (isPwa()) capabilities.push('PWA Mode');
  if (getPlatformInfo().needsFallbacks) capabilities.push('Fallback Mechanisms');
  
  return capabilities;
};

/**
 * Get platform-specific recommendations
 */
const getRecommendations = (): string[] => {
  const recommendations: string[] = [];
  
  if (isIOS() && isPwa()) {
    recommendations.push('iOS PWAs have limited notification support - Firebase messaging is not available');
    recommendations.push('Notifications will use fallback mechanisms for better compatibility');
    recommendations.push('For real-time notifications, consider checking the app regularly');
  } else if (isIOS() && !isPwa()) {
    recommendations.push('Add this app to your Home Screen for better notification support');
    recommendations.push('Use Safari to add to Home Screen for full functionality');
    recommendations.push('iOS Safari browser has very limited notification capabilities');
  }
  
  if (isSafari() && isMacOS() && Notification.permission !== 'granted') {
    recommendations.push('Enable notifications in Safari preferences for this website');
  }
  
  if (isAndroid() && !isChrome()) {
    recommendations.push('Chrome browser provides the best notification experience on Android');
  }
  
  return recommendations;
};

/**
 * Check if notifications are currently enabled
 */
export const hasNotificationPermission = (): boolean => {
  return checkNotificationSupport() && Notification.permission === 'granted';
};

/**
 * Check if FCM is available and working
 */
export const isFCMAvailable = (): boolean => {
  return messaging !== null && getPlatformInfo().supportsFCM;
};

/**
 * Get detailed status information
 */
export const getNotificationStatus = () => {
  const platformInfo = getPlatformInfo();
  
  return {
    isSupported: checkNotificationSupport(),
    hasPermission: hasNotificationPermission(),
    isFCMAvailable: isFCMAvailable(),
    platform: platformInfo.platform,
    capabilities: getCapabilities(),
    recommendations: getRecommendations(),
    userRole: currentUserRole,
    token: localStorage.getItem('fcmToken'),
    initialized: isInitialized
  };
};

/**
 * Clean up all listeners and resources
 */
const cleanup = () => {
  cleanupFunctions.forEach(fn => {
    try {
      fn();
    } catch (error) {
      console.error('Error in cleanup function:', error);
    }
  });
  cleanupFunctions = [];
};

/**
 * Remove FCM token and clean up
 */
export const removeNotificationToken = async (): Promise<boolean> => {
  try {
    if (messaging) {
      await deleteToken(messaging);
    }
    
    localStorage.removeItem('fcmToken');
    localStorage.removeItem('notificationUserRole');
    
    cleanup();
    isInitialized = false;
    
    return true;
  } catch (error) {
    console.error('Error removing notification token:', error);
    return false;
  }
};

/**
 * Test notification functionality
 */
export const testNotification = async (): Promise<boolean> => {
  return await showCrossPlatformNotification('Test Notification', {
    body: 'This is a test notification to verify functionality',
    data: { type: 'test' }
  });
};

// Specific notification types for the app
export const showAlertNotification = (alertType: string, council: string, message: string, urgent = false) => {
  return showCrossPlatformNotification(
    `${urgent ? '🚨 URGENT: ' : ''}${alertType} from ${council}`,
    {
      body: message,
      vibrate: urgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
      requireInteraction: urgent,
      data: { type: 'alert', alertType, council, urgent }
    }
  );
};

export const showTimerNotification = (timerName: string) => {
  return showCrossPlatformNotification(`${timerName} has ended!`, {
    body: 'Your timer has completed.',
    vibrate: [200, 100, 200],
    data: { type: 'timer' }
  });
};

/**
 * Send alert notification to specific users (works in background for iOS PWA)
 */
export const sendAlert = async (
  alertType: string,
  council: string,
  message: string,
  targetUsers: string[] = [],
  urgent: boolean = false
): Promise<boolean> => {
  console.log(`📢 Sending ${urgent ? 'URGENT ' : ''}alert: ${alertType} from ${council}`);
  
  try {
    const result = await showCrossPlatformNotification(
      `${urgent ? '🚨 URGENT: ' : ''}${alertType} from ${council}`,
      {
        body: message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `alert-${Date.now()}`,
        vibrate: urgent ? [200, 100, 200, 100, 200] : [200, 100, 200],
        requireInteraction: urgent,
        data: {
          type: 'alert',
          alertType,
          council,
          urgent,
          timestamp: Date.now(),
          url: getCurrentUserDashboardUrl()
        }
      }
    );

    // Store in localStorage for persistence and debugging
    storeNotificationHistory({
      type: 'alert',
      title: `${urgent ? '🚨 URGENT: ' : ''}${alertType} from ${council}`,
      body: message,
      timestamp: new Date().toISOString(),
      council,
      urgent
    });

    return result;
  } catch (error) {
    console.error('Error sending alert notification:', error);
    notificationLogger.log('error', 'send_alert_failed', 'error', 'Failed to send alert notification', error);
    return false;
  }
};

/**
 * Get current user's dashboard URL for notification navigation
 */
function getCurrentUserDashboardUrl(): string {
  if (currentUserRole === 'admin') return '/admin-panel';
  if (currentUserRole === 'chair') return '/chair-dashboard';
  if (currentUserRole === 'press') return '/press-dashboard';
  if (currentUserRole === 'logistics') return '/logistics-dashboard';
  return '/';
}

/**
 * Store notification in history for debugging
 */
function storeNotificationHistory(notification: any): void {
  try {
    const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
    history.unshift(notification);
    // Keep only last 50 notifications
    if (history.length > 50) {
      history.splice(50);
    }
    localStorage.setItem('notificationHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Error storing notification history:', error);
  }
}

export const showReplyNotification = (fromName: string, replyMessage: string, alertId: string) => {
  return showCrossPlatformNotification(`New reply from ${fromName}`, {
    body: replyMessage,
    vibrate: [100, 50, 100],
    data: { type: 'reply', alertId, fromName }
  });
};