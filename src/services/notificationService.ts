
/**
 * Service for handling browser notifications
 */

// Extended notification options type to handle additional properties
interface ExtendedNotificationOptions extends NotificationOptions {
  timestamp?: number;
  vibrate?: number[];
  requireInteraction?: boolean;
}

// Check if notifications are supported in this browser
const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Request notification permissions
const requestPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.warn('Notification permission was denied by the user');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Check current permission status
const hasPermission = (): boolean => {
  if (!isNotificationSupported()) {
    return false;
  }
  return Notification.permission === 'granted';
};

// Show a notification
const showNotification = (title: string, options?: ExtendedNotificationOptions): boolean => {
  if (!isNotificationSupported() || !hasPermission()) {
    return false;
  }
  
  try {
    // Create and display the notification
    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options,
    } as NotificationOptions);
    
    // Add click handler to focus the window
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// Show timer notification
const showTimerNotification = (timerName: string): boolean => {
  return showNotification(`${timerName} has ended!`, {
    body: 'Your timer has completed.',
    icon: '/logo.png',
    // Using optional properties that might not be supported in all browsers
    // Cast to satisfy TypeScript
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  });
};

// Show alert notification
const showAlertNotification = (alertType: string, council: string, message: string, urgent: boolean = false): boolean => {
  return showNotification(
    `${urgent ? '🚨 URGENT: ' : ''}${alertType} from ${council}`,
    {
      body: message,
      icon: '/logo.png',
      // Using optional properties that might not be supported in all browsers
      vibrate: urgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
      tag: 'alert-notification', // Group similar notifications
      requireInteraction: urgent, // Urgent alerts stay until clicked
      timestamp: Date.now(),
    }
  );
};

export const notificationService = {
  isNotificationSupported,
  requestPermission,
  hasPermission,
  showNotification,
  showTimerNotification,
  showAlertNotification,
};
