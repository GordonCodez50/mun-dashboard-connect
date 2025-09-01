
import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';
import { 
  isAndroid, 
  isChrome, 
  isIOS,
  isSafari,
  isMacOS,
  isPwa,
  isNotificationSupported,
  isWebPushSupported,
  isIOS164PlusWithWebPush,
  requestNotificationPermission,
  getNotificationInstructions,
  testNotification,
  getPwaInstructions,
  canShowLockScreenNotifications
} from '@/utils/crossPlatformNotifications';

import {
  createSafariNotificationGuide,
  hasSafariLimitations
} from '@/utils/safariNotifications';

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permissionChecked, setPermissionChecked] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [requestInProgress, setRequestInProgress] = useState<boolean>(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);
  const [canShowLockScreen, setCanShowLockScreen] = useState<boolean>(false);
  const [isSafariWithLimitations, setIsSafariWithLimitations] = useState<boolean>(false);
  const [webPushSupported, setWebPushSupported] = useState<boolean>(false);
  const [isIOS164PWA, setIsIOS164PWA] = useState<boolean>(false);

  // Check notification support on mount
  useEffect(() => {
    const supported = isNotificationSupported();
    setIsSupported(supported);
    
    // Check for web push support
    setWebPushSupported(isWebPushSupported());
    
    // Check for iOS 16.4+ PWA
    setIsIOS164PWA(isIOS164PlusWithWebPush());
    
    // Check if we have Safari limitations
    setIsSafariWithLimitations(hasSafariLimitations());
    
    if (supported) {
      // Check if we already have permission
      const hasPermission = notificationService.hasPermission();
      setPermissionGranted(hasPermission);
      console.log('Initial permission check:', hasPermission);
      
      // Check if notifications can appear on lock screen
      setCanShowLockScreen(canShowLockScreenNotifications());
    }
    
    // Check if running as PWA
    setIsPwaInstalled(isPwa());
    
    setPermissionChecked(true);
  }, []);

  // Request notification permission with better error handling
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Notifications are not supported in your browser");
      return false;
    }
    
    try {
      // Prevent multiple concurrent requests
      if (requestInProgress) {
        console.log('Permission request already in progress');
        return false;
      }
      
      setRequestInProgress(true);
      
      // Clear any previous errors
      setPermissionError(null);

      console.log('Requesting notification permission');
      console.log('Platform info:', {
        isAndroid: isAndroid(),
        isChrome: isChrome(),
        isIOS: isIOS(),
        isSafari: isSafari(),
        isPwa: isPwa(),
        isMacOS: isMacOS(),
        isIOS164PWA: isIOS164PlusWithWebPush()
      });
      
      // Show a toast to let the user know what's happening
      toast.info("Requesting notification permission...");

      // Use enhanced permission request function
      const result = await requestNotificationPermission();
      setPermissionGranted(result.success);
      
      if (result.success) {
        toast.success("Notification permission granted!");
        
        // Try to show a test notification
        const notificationShown = await testNotification();
        if (!notificationShown) {
          console.warn('Test notification failed despite permission granted');
        }
        
        // Update lock screen notification status
        setCanShowLockScreen(canShowLockScreenNotifications());
        
        // After permission is granted, try to get FCM token
        if (notificationService.isFcmSupported()) {
          try {
            const token = await notificationService.requestFcmToken();
            if (!token) {
              console.warn('Failed to obtain FCM token even with permission granted');
              
              // For Android Chrome, this could be due to service worker issues
              if (isAndroid() && isChrome()) {
                console.log('Android Chrome detected, trying service worker refresh');
                
                // Re-register the service worker
                if ('serviceWorker' in navigator) {
                  try {
                    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    console.log('Service worker re-registered');
                    
                    // Try getting token again
                    const secondToken = await notificationService.requestFcmToken();
                    if (!secondToken) {
                      console.warn('Second attempt to get FCM token failed');
                    }
                  } catch (swError) {
                    console.error('Service worker registration error:', swError);
                  }
                }
              }
            }
          } catch (fcmError) {
            console.error('Error getting FCM token:', fcmError);
          }
        } else if (hasSafariLimitations()) {
          // For Safari/iOS with limitations, initialize the fallback mechanisms
          await notificationService.initializeMessaging();
          
          toast.info(
            isIOS() && !isPwa() 
              ? "For reliable notifications, please add this app to your home screen." 
              : "Notification system initialized for your device"
          );
        }
      } else {
        // Handle different failure cases
        if (result.status === 'denied') {
          const message = getNotificationInstructions();
          toast.error(message, { duration: 8000 });
          setPermissionError(message);
          
          // If on iOS, suggest installing as PWA for better notification support
          if (isIOS() && !isPwa()) {
            const pwaMessage = getPwaInstructions();
            toast(pwaMessage, {
              description: "Install for better notifications",
              duration: 10000,
            });
          }
        } else if (result.status === 'unsupported') {
          toast.error("Your browser doesn't support notifications.");
          setPermissionError("Browser doesn't support notifications");
        } else {
          toast.error(result.error || "Failed to request notification permission");
          setPermissionError(result.error || "Unknown permission error");
        }
      }
      
      return result.success;
    } catch (error) {
      console.error('Error in requestPermission:', error);
      const errorMsg = error instanceof Error ? error.message : "Failed to request permission";
      toast.error(errorMsg);
      setPermissionError(errorMsg);
      return false;
    } finally {
      setRequestInProgress(false);
    }
  }, [isSupported, requestInProgress]);

  // Show a reply notification
  const showReplyNotification = useCallback((
    fromName: string,
    message: string,
    alertId: string,
    userType: 'admin' | 'chair' | 'press' = 'admin'
  ) => {
    if (!permissionGranted || !isSupported) return false;
    
    return notificationService.showReplyNotification(
      fromName,
      message,
      alertId,
      userType
    );
  }, [permissionGranted, isSupported]);

  // Allow manual notification checks
  const checkPermission = useCallback(() => {
    if (!isSupported) return false;
    
    const hasPermission = notificationService.hasPermission();
    setPermissionGranted(hasPermission);
    
    // Update capabilities info
    setIsSafariWithLimitations(hasSafariLimitations());
    setWebPushSupported(isWebPushSupported());
    setIsIOS164PWA(isIOS164PlusWithWebPush());
    
    // Update PWA and lock screen status
    setIsPwaInstalled(isPwa());
    setCanShowLockScreen(canShowLockScreenNotifications());
    
    return hasPermission;
  }, [isSupported]);

  // Test FCM functionality
  const testFcm = useCallback(async () => {
    if (!permissionGranted || !isSupported) {
      toast.error("Notification permission not granted");
      return false;
    }
    
    toast.info("Testing notifications...");
    const result = await notificationService.testFcm();
    
    if (result) {
      toast.success("Notification test successful!");
    } else {
      toast.error("Notification test failed. Check console for details.");
    }
    
    return result;
  }, [permissionGranted, isSupported]);

  // Get installation guide for PWA
  const getInstallationGuide = useCallback(() => {
    // Don't show guide if already installed
    if (isPwaInstalled) return null;
    
    // For iOS Safari, always show the guide
    if (isIOS() && isSafari() && !isPwa()) {
      return {
        title: 'Enable Full Notifications',
        message: 'To get the best notification experience on iOS, please add this app to your home screen.',
        instructions: getPwaInstructions(),
        buttonText: 'Got it'
      };
    }
    
    return null;
  }, [isPwaInstalled]);

  // Get Safari notification guide
  const getSafariGuide = useCallback(() => {
    return createSafariNotificationGuide();
  }, []);

  // Get detailed capability info
  const getCapabilityInfo = useCallback(() => {
    return notificationService.getNotificationCapabilities();
  }, []);

  return {
    isSupported,
    permissionGranted,
    permissionChecked,
    permissionError,
    isAndroid: isAndroid(),
    isChrome: isChrome(),
    isIOS: isIOS(),
    isSafari: isSafari(),
    isMacOS: isMacOS(),
    isPwa: isPwaInstalled,
    canShowLockScreen,
    webPushSupported,
    isSafariWithLimitations,
    isIOS164PWA,
    requestPermission,
    checkPermission,
    showReplyNotification,
    showNotificationPrompt: permissionChecked && !permissionGranted && isSupported,
    getSettingsInstructions: getNotificationInstructions,
    getPwaInstructions,
    getInstallationGuide,
    getSafariGuide,
    getCapabilityInfo,
    testFcm,
    requestInProgress
  };
};
