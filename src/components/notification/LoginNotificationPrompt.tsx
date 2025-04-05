
import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { isIOS, getIOSVersion } from '@/utils/notificationPermission';
import IOSNotificationModal from '../IOSNotificationModal';

// This component will show a notification prompt for iOS users on login
const LoginNotificationPrompt: React.FC = () => {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const { permissionGranted } = useNotifications();
  
  useEffect(() => {
    // Only show for iOS 16+ users who haven't granted permission
    if (isIOS() && getIOSVersion() >= 16 && !permissionGranted) {
      // Delay showing the modal to not interrupt the login flow
      const timer = setTimeout(() => {
        setShowIOSModal(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [permissionGranted]);
  
  const handleCloseModal = () => {
    setShowIOSModal(false);
    // Store a flag in localStorage so we don't show this too frequently
    localStorage.setItem('ios-notification-prompt-shown', Date.now().toString());
  };
  
  return (
    <IOSNotificationModal open={showIOSModal} onClose={handleCloseModal} />
  );
};

export default LoginNotificationPrompt;
