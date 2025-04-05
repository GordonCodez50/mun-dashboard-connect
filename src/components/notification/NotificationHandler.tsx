
import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { isIOS, getIOSVersion, isNotificationSupported } from '@/utils/notificationPermission';
import { toast } from 'sonner';
import { requestAndSaveFcmToken } from '@/utils/fcmUtils';
import { notificationService } from '@/services/notificationService';
import LoginNotificationPrompt from './LoginNotificationPrompt';

// This component handles notification permissions and displays
// appropriate prompts based on the user's platform
const NotificationHandler: React.FC = () => {
  const { 
    permissionGranted, 
    isIOS: isIOSDevice,
    iosVersion,
    permissionChecked 
  } = useNotifications();
  
  // For iOS, show appropriate guidance based on version
  useEffect(() => {
    if (!permissionChecked) return;
    
    // For iOS 16.4+, we need special handling
    if (isIOSDevice && iosVersion >= 16 && !permissionGranted) {
      // Check if we've shown this recently
      const lastPrompt = localStorage.getItem('ios-notification-prompt-shown');
      const showAgain = !lastPrompt || 
        (Date.now() - parseInt(lastPrompt, 10)) > 1000 * 60 * 60 * 24; // 24 hours
      
      if (showAgain) {
        if (iosVersion >= 16.4 && isNotificationSupported()) {
          toast.info("Enable notifications for important alerts", {
            description: "iOS 16.4+ supports web notifications. Tap Allow when prompted.",
            duration: 8000,
            action: {
              label: "Learn More",
              onClick: () => {
                toast.info("How to enable notifications on iOS", {
                  description: "Go to Settings → Safari → Advanced → Website Data → find this site and allow notifications.",
                  duration: 10000,
                });
              }
            }
          });
        }
      }
    }
    
    // If permission is granted, initialize FCM
    if (permissionGranted && notificationService.isFcmSupported()) {
      requestAndSaveFcmToken().catch(err => {
        console.error('Failed to get FCM token:', err);
      });
    }
  }, [permissionChecked, permissionGranted, isIOSDevice, iosVersion]);
  
  return <LoginNotificationPrompt />;
};

export default NotificationHandler;
