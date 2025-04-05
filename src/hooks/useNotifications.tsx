
import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';
import { 
  isAndroid, 
  isNotificationSupported, 
  getNotificationPermissionStatus,
  requestNotificationPermission,
  getNotificationSettingsInstructions 
} from '@/utils/notificationPermission';

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permissionChecked, setPermissionChecked] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Check notification support on mount
  useEffect(() => {
    const supported = isNotificationSupported();
    setIsSupported(supported);
    
    if (supported) {
      // Check if we already have permission
      const hasPermission = notificationService.hasPermission();
      setPermissionGranted(hasPermission);
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
      // Clear any previous errors
      setPermissionError(null);

      // Use enhanced permission request function
      const result = await requestNotificationPermission();
      setPermissionGranted(result.success);
      
      if (result.success) {
        toast.success("Notification permission granted!");
        
        // After permission is granted, try to get FCM token
        if (notificationService.isFcmSupported()) {
          try {
            const token = await notificationService.requestFcmToken();
            if (!token) {
              console.warn('Failed to obtain FCM token even with permission granted');
            }
          } catch (fcmError) {
            console.error('Error getting FCM token:', fcmError);
          }
        }
      } else {
        // Handle different failure cases
        if (result.status === 'denied') {
          const message = isAndroid() 
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
    }
  }, [isSupported]);

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

  return {
    isSupported,
    permissionGranted,
    permissionChecked,
    permissionError,
    isAndroid: isAndroid(),
    requestPermission,
    checkPermission,
    showReplyNotification,
    showNotificationPrompt: permissionChecked && !permissionGranted && isSupported,
    getSettingsInstructions: getNotificationSettingsInstructions
  };
};
