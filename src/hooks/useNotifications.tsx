
import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';
import { 
  isAndroid, 
  isChrome,
  isIOS,
  isSafari,
  isNotificationSupported, 
  getNotificationPermissionStatus,
  requestNotificationPermission,
  getNotificationSettingsInstructions,
  testNotification,
  setupIOSNotifications,
  simulateNotification,
  getInstallInstructions
} from '@/utils/crossPlatformNotifications';

// Enhanced notifications hook with better cross-platform support
export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permissionChecked, setPermissionChecked] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [requestInProgress, setRequestInProgress] = useState<boolean>(false);
  const [isPwa, setIsPwa] = useState<boolean>(false);
  const [installInstructions, setInstallInstructions] = useState<string>('');
  const serviceWorkerRegistration = useRef<ServiceWorkerRegistration | null>(null);

  // Platform detection for better UX guidance
  const platformInfo = {
    isAndroid: isAndroid(),
    isIOS: isIOS(), 
    isChrome: isChrome(),
    isSafari: isSafari(),
    isMobile: isIOS() || isAndroid(),
  };

  // Load service worker registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        serviceWorkerRegistration.current = reg || null;
      });
    }
  }, []);

  // Check if the app is running as PWA
  useEffect(() => {
    const isPwaMode = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;
    setIsPwa(isPwaMode);
    
    // Set install instructions based on platform
    setInstallInstructions(getInstallInstructions());
  }, []);

  // Notification permission check with better cross-platform support
  useEffect(() => {
    // Check if notifications are supported
    const supported = isNotificationSupported();
    setIsSupported(supported);
    
    if (supported) {
      // Check if we already have permission
      const hasPermission = notificationService.hasPermission();
      setPermissionGranted(hasPermission);
      console.log('Initial permission check:', hasPermission);
      
      // Special handling for iOS
      if (isIOS()) {
        // On iOS, we need PWA mode for notifications
        if (isPwa) {
          setupIOSNotifications();
        }
      }
    }
    
    setPermissionChecked(true);
  }, [isPwa]);

  // Request notification permission with enhanced cross-platform support
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      // Unsupported browser
      toast.error("Notifications are not supported in your browser");
      
      // Special handling for iOS
      if (isIOS() && !isPwa) {
        toast({
          title: "Add to Home Screen First",
          description: installInstructions,
          duration: 8000
        });
      }
      return false;
    }
    
    try {
      // Prevent multiple concurrent requests
      if (requestInProgress) {
        console.log('Permission request already in progress');
        return false;
      }
      
      setRequestInProgress(true);
      setPermissionError(null);

      console.log('Requesting notification permission for platform:', 
        `Android: ${platformInfo.isAndroid}, iOS: ${platformInfo.isIOS}, ` +
        `Chrome: ${platformInfo.isChrome}, Safari: ${platformInfo.isSafari}`);
      
      // Show platform-appropriate toast message
      if (platformInfo.isIOS && !isPwa) {
        toast.info("For iOS notifications, add this app to your home screen first");
        toast.info(installInstructions, { duration: 10000 });
        setRequestInProgress(false);
        return false;
      } else {
        toast.info("Requesting notification permission...");
      }

      // Use enhanced permission request function
      const result = await requestNotificationPermission();
      setPermissionGranted(result.success);
      
      if (result.success) {
        toast.success("Notification permission granted!");
        
        // Try to show a test notification
        setTimeout(async () => {
          const notificationShown = await testNotification();
          if (!notificationShown) {
            console.warn('Test notification failed despite permission granted');
          }
        }, 1000);
        
        // After permission is granted, try to get FCM token with better error handling
        if (notificationService.isFcmSupported()) {
          try {
            // Register service worker if needed before requesting token
            if ('serviceWorker' in navigator && !serviceWorkerRegistration.current) {
              try {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                serviceWorkerRegistration.current = registration;
                console.log('Service worker registered');
              } catch (swError) {
                console.error('Service worker registration error:', swError);
              }
            }
            
            const token = await notificationService.requestFcmToken();
            if (!token) {
              console.warn('Failed to obtain FCM token even with permission granted');
              
              // Platform-specific handling for token failures
              if (platformInfo.isAndroid && platformInfo.isChrome) {
                console.log('Android Chrome detected, trying service worker refresh');
                
                // Re-register the service worker
                if ('serviceWorker' in navigator) {
                  try {
                    // First unregister any existing service workers
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                      await registration.unregister();
                    }
                    console.log('Service workers unregistered');
                    
                    // Register a fresh service worker
                    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    serviceWorkerRegistration.current = registration;
                    console.log('Service worker re-registered');
                    
                    // Try getting token again
                    const secondToken = await notificationService.requestFcmToken();
                    if (secondToken) {
                      console.log('Second attempt to get FCM token succeeded');
                    } else {
                      console.warn('Second attempt to get FCM token failed');
                      // Simulate a fake notification to check if basic notifications work
                      simulateNotification(
                        'Test Notification', 
                        'This is a test notification to verify notifications work on your device', 
                        '/logo.png'
                      );
                    }
                  } catch (swError) {
                    console.error('Service worker registration error:', swError);
                  }
                }
              } else if (platformInfo.isIOS) {
                // iOS special handling
                toast.info("For reliable notifications on iOS, please ensure you're using this app from your home screen");
              }
            }
          } catch (fcmError) {
            console.error('Error getting FCM token:', fcmError);
            // Try basic notifications as fallback
            simulateNotification(
              'Test Notification', 
              'This is a test notification to verify notifications work on your device',
              '/logo.png'
            );
          }
        }
      } else {
        // Handle different failure cases with platform-specific guidance
        if (result.status === 'denied') {
          let message = getNotificationSettingsInstructions();
            
          toast.error(message, { duration: 8000 });
          setPermissionError(message);
        } else if (result.status === 'unsupported') {
          // Special unsupported message for iOS
          if (platformInfo.isIOS && !platformInfo.isSafari) {
            const iosMessage = "iOS only supports notifications in Safari or when added to your home screen. Please add this app to your home screen first.";
            toast.error(iosMessage, { duration: 8000 });
            setPermissionError(iosMessage);
          } else {
            toast.error("Your browser doesn't support notifications.");
            setPermissionError("Browser doesn't support notifications");
          }
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
  }, [isSupported, requestInProgress, platformInfo, isPwa, installInstructions]);

  // Show a notification with improved cross-platform support
  const showNotification = useCallback((
    title: string,
    options?: NotificationOptions
  ) => {
    if (!permissionGranted || !isSupported) {
      // Fall back to toast for unsupported browsers
      toast(title, {
        description: options?.body,
        duration: 5000
      });
      return false;
    }
    
    // Enhanced notification with platform-specific optimizations
    try {
      const enhancedOptions = { ...options };
      
      // Platform-specific enhancements
      if (platformInfo.isAndroid) {
        enhancedOptions.vibrate = enhancedOptions.vibrate || [200, 100, 200];
        enhancedOptions.requireInteraction = enhancedOptions.requireInteraction || false;
      }
      
      if (platformInfo.isIOS) {
        // iOS has limitations with web notifications, relies more on service worker
        enhancedOptions.silent = false; // Ensure sound plays on iOS
      }
      
      // When using through service worker, enhanced features are supported
      if (serviceWorkerRegistration.current) {
        serviceWorkerRegistration.current.showNotification(title, enhancedOptions)
          .then(() => console.log('Notification shown via service worker'))
          .catch(err => {
            console.error('Error showing notification via service worker:', err);
            
            // Fall back to basic Notification API
            new Notification(title, enhancedOptions);
          });
        return true;
      }
      
      // Default to basic notification
      new Notification(title, enhancedOptions);
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      
      // Fall back to toast
      toast(title, {
        description: options?.body,
        duration: 5000
      });
      return false;
    }
  }, [permissionGranted, isSupported, platformInfo]);

  // Show a reply notification with enhanced cross-platform support
  const showReplyNotification = useCallback((
    fromName: string,
    message: string,
    alertId: string,
    userType: 'admin' | 'chair' | 'press' = 'admin'
  ) => {
    if (!permissionGranted || !isSupported) {
      // Fall back to toast
      toast(`New reply from ${fromName}`, {
        description: message,
        duration: 5000
      });
      return false;
    }
    
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

  // Test FCM functionality with improved error handling
  const testFcm = useCallback(async () => {
    if (!permissionGranted || !isSupported) {
      toast.error("Notification permission not granted");
      return false;
    }
    
    toast.info("Testing FCM notifications...");
    
    // Check service worker status first
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        toast.error("Service worker not registered");
        
        try {
          // Try to register it
          const newRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          serviceWorkerRegistration.current = newRegistration;
          toast.success("Service worker registered successfully");
        } catch (err) {
          console.error('Error registering service worker:', err);
          toast.error("Failed to register service worker");
          return false;
        }
      } else {
        serviceWorkerRegistration.current = registration;
      }
    }
    
    // Test FCM
    const result = await notificationService.testFcm();
    
    if (result) {
      toast.success("FCM test successful!");
    } else {
      toast.error("FCM test failed. Falling back to basic notifications.");
      
      // Show a basic notification as fallback
      setTimeout(() => {
        showNotification(
          "Test Notification", 
          { 
            body: "This is a basic notification test.",
            icon: '/logo.png'
          }
        );
      }, 1000);
    }
    
    return result;
  }, [permissionGranted, isSupported, showNotification]);
  
  // Check if app can be installed (PWA install prompt)
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  // Listen for beforeinstallprompt event to detect if app can be installed
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
      setCanInstall(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Function to show the install prompt
  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      // If the prompt isn't available, show install instructions instead
      toast.info("Installation", {
        description: installInstructions,
        duration: 10000
      });
      return;
    }
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the saved prompt - it can only be used once
    setInstallPrompt(null);
    setCanInstall(false);
  }, [installPrompt, installInstructions]);

  return {
    isSupported,
    permissionGranted,
    permissionChecked,
    permissionError,
    isPwa,
    canInstall,
    promptInstall,
    installInstructions,
    ...platformInfo,
    requestPermission,
    checkPermission,
    showNotification,
    showReplyNotification,
    showNotificationPrompt: permissionChecked && !permissionGranted && isSupported,
    getSettingsInstructions: getNotificationSettingsInstructions,
    testFcm,
    requestInProgress
  };
};
