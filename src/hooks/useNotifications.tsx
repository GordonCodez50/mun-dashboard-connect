
import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permissionChecked, setPermissionChecked] = useState<boolean>(false);

  // Check notification support on mount
  useEffect(() => {
    const supported = notificationService.isNotificationSupported();
    setIsSupported(supported);
    
    if (supported) {
      // Check if we already have permission
      const hasPermission = notificationService.hasPermission();
      setPermissionGranted(hasPermission);
    }
    
    setPermissionChecked(true);
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Notifications are not supported in your browser");
      return false;
    }
    
    try {
      const permission = await notificationService.requestPermission();
      setPermissionGranted(permission);
      
      if (permission) {
        toast.success("Notification permission granted!");
      } else {
        toast.error("Notification permission denied.");
      }
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error("Failed to request notification permission");
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
    requestPermission,
    checkPermission,
    showReplyNotification,
    showNotificationPrompt: permissionChecked && !permissionGranted && isSupported
  };
};
