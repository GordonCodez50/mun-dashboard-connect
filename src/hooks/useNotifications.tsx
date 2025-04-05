
import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';
import { 
  isAndroid, 
  isIOS,
  isChrome,
  isSafari,
  getIOSVersion,
  isNotificationSupported, 
  getNotificationPermissionStatus,
  requestNotificationPermission,
  getNotificationSettingsInstructions,
  testNotification,
  canPotentiallyEnableNotifications
} from '@/utils/notificationPermission';

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permissionChecked, setPermissionChecked] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [requestInProgress, setRequestInProgress] = useState<boolean>(false);
  const [deviceInfo, setDeviceInfo] = useState<{
    isAndroid: boolean;
    isIOS: boolean;
    iosVersion: number;
    isChrome: boolean;
    isSafari: boolean;
    browserSupportsNotifications: boolean;
    canPotentiallyEnable: boolean;
  }>({
    isAndroid: false,
    isIOS: false,
    iosVersion: 0,
    isChrome: false,
    isSafari: false,
    browserSupportsNotifications: false,
    canPotentiallyEnable: false,
  });

  // Check notification support on mount
  useEffect(() => {
    const supported = isNotificationSupported();
    
    // Gather device info
    const isIosDevice = isIOS();
    const iosVer = isIosDevice ? getIOSVersion() : 0;
    const isAndroidDevice = isAndroid();
    const isChromeDevice = isChrome();
    const isSafariDevice = isSafari();
    const canEnable = canPotentiallyEnableNotifications();
    
    setIsSupported(supported);
    setDeviceInfo({
      isAndroid: isAndroidDevice,
      isIOS: isIosDevice,
      iosVersion: iosVer,
      isChrome: isChromeDevice,
      isSafari: isSafariDevice,
      browserSupportsNotifications: supported,
      canPotentiallyEnable: canEnable,
    });
    
    if (supported) {
      // Check if we already have permission
      const hasPermission = notificationService.hasPermission();
      setPermissionGranted(hasPermission);
      console.log('Initial permission check:', hasPermission);
    }
    
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

      console.log('Requesting notification permission, iOS:', deviceInfo.isIOS, 
                 'iOS version:', deviceInfo.iosVersion, 
                 'Android:', deviceInfo.isAndroid, 
                 'Chrome:', deviceInfo.isChrome);
      
      // Show a toast to let the user know what's happening
      toast.info("Requesting notification permission...");

      // iOS 16+ specific approach
      if (deviceInfo.isIOS && deviceInfo.iosVersion >= 16 && deviceInfo.isSafari) {
        console.log('iOS 16+ Safari detected, showing guidance');
        toast.info("iOS requires manual notification setup", {
          description: getNotificationSettingsInstructions(),
          duration: 8000,
        });
      }

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
        
        // After permission is granted, try to get FCM token
        if (notificationService.isFcmSupported()) {
          try {
            const token = await notificationService.requestFcmToken();
            if (!token) {
              console.warn('Failed to obtain FCM token even with permission granted');
              
              // For Android Chrome, this could be due to service worker issues
              if (deviceInfo.isAndroid && deviceInfo.isChrome) {
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
              
              // For iOS 16.4+, we need to check if Safari is blocking notifications
              if (deviceInfo.isIOS && deviceInfo.iosVersion >= 16.4 && !token) {
                toast.warning("Safari may be blocking notifications", {
                  description: "Check Safari settings to allow notifications for this website",
                  duration: 6000,
                });
              }
            }
          } catch (fcmError) {
            console.error('Error getting FCM token:', fcmError);
          }
        }
      } else {
        // Handle different failure cases
        if (result.status === 'denied') {
          const message = deviceInfo.isIOS
            ? "Notification permission denied. " + getNotificationSettingsInstructions()
            : deviceInfo.isAndroid 
              ? "Notification permission denied. " + getNotificationSettingsInstructions()
              : "Notification permission denied.";
              
          toast.error(message, { duration: 8000 });
          setPermissionError(message);
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
  }, [isSupported, requestInProgress, deviceInfo]);

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
    return hasPermission;
  }, [isSupported]);

  // Test FCM functionality
  const testFcm = useCallback(async () => {
    if (!permissionGranted || !isSupported) {
      toast.error("Notification permission not granted");
      return false;
    }
    
    toast.info("Testing FCM notifications...");
    const result = await notificationService.testFcm();
    
    if (result) {
      toast.success("FCM test successful!");
    } else {
      toast.error("FCM test failed. Check console for details.");
    }
    
    return result;
  }, [permissionGranted, isSupported]);

  return {
    isSupported,
    permissionGranted,
    permissionChecked,
    permissionError,
    isAndroid: deviceInfo.isAndroid,
    isIOS: deviceInfo.isIOS,
    iosVersion: deviceInfo.iosVersion,
    isChrome: deviceInfo.isChrome,
    isSafari: deviceInfo.isSafari,
    canEnableNotifications: deviceInfo.canPotentiallyEnable,
    requestPermission,
    checkPermission,
    showReplyNotification,
    showNotificationPrompt: permissionChecked && !permissionGranted && isSupported,
    getSettingsInstructions: getNotificationSettingsInstructions,
    testFcm,
    requestInProgress,
    deviceInfo
  };
};
