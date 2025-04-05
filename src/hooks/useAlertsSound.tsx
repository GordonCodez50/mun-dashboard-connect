
import { useState, useEffect, useRef } from 'react';
import { notificationService } from '@/services/notificationService';

// Define the Alert type to match what's used in AlertItem and ChairDashboard
export type AlertWithSound = {
  id: string;
  type?: string;
  message?: string;
  timestamp: Date;
  status?: 'pending' | 'acknowledged' | 'resolved';
  reply?: string;
  admin?: string;
  council?: string;
  chairName?: string;
  priority?: 'normal' | 'urgent';
  chairReply?: string;
  replyTimestamp?: number;
  replyFrom?: 'admin' | 'chair' | 'press';
};

// Extended notification options for TypeScript compatibility
interface ExtendedNotificationOptions extends NotificationOptions {
  timestamp?: number;
}

export const useAlertsSound = (alerts: AlertWithSound[], alertsMuted: boolean) => {
  const [previousAlerts, setPreviousAlerts] = useState<AlertWithSound[]>([]);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound with the new ringtone
  useEffect(() => {
    notificationSound.current = new Audio("/ringtonenotification.mp3");
    return () => {
      if (notificationSound.current) {
        notificationSound.current = null;
      }
    };
  }, []);

  // Play sound for new alerts and replies if not muted and show notifications
  useEffect(() => {
    if (!alerts || !previousAlerts) return;
    
    // Ensure all alerts have valid IDs
    const validAlerts = alerts.filter(alert => alert && alert.id);
    const validPreviousAlerts = previousAlerts.filter(alert => alert && alert.id);
    
    // Check for new alerts (by ID)
    const newAlerts = validAlerts.filter(
      alert => !validPreviousAlerts.some(a => a.id === alert.id)
    );
    
    // Check for new replies (admin replies or chair replies) on existing alerts
    const alertsWithNewReplies = validAlerts.filter(alert => {
      const prevAlert = validPreviousAlerts.find(a => a.id === alert.id);
      
      // Check for admin replies
      const hasNewAdminReply = prevAlert && alert.reply && alert.reply !== prevAlert.reply;
      
      // Check for chair replies
      const hasNewChairReply = prevAlert && alert.chairReply && alert.chairReply !== prevAlert.chairReply;
      
      // Check for reply timestamp changes (for differentiating new replies)
      const hasNewReplyTimestamp = prevAlert && 
                                  alert.replyTimestamp && 
                                  (!prevAlert.replyTimestamp || alert.replyTimestamp > prevAlert.replyTimestamp);
      
      return hasNewAdminReply || hasNewChairReply || hasNewReplyTimestamp;
    });
    
    if ((newAlerts.length > 0 || alertsWithNewReplies.length > 0) && !alertsMuted) {
      // Play the notification sound
      if (notificationSound.current) {
        notificationSound.current.currentTime = 0;
        notificationSound.current.play().catch(err => console.error("Error playing sound:", err));
      }
      
      // Show browser notifications for each new alert
      newAlerts.forEach(alert => {
        const isUrgent = alert.priority === 'urgent';
        notificationService.showAlertNotification(
          alert.type || 'New Alert',
          alert.council || 'Unknown Council',
          alert.message || 'No message provided',
          isUrgent
        );
      });
      
      // Show notifications for new replies from admins
      alertsWithNewReplies.forEach(alert => {
        if (alert.reply && !alert.replyFrom) {
          // Admin reply (default if replyFrom not specified)
          notificationService.showNotification(
            `New reply from ${alert.admin || 'Admin'}`,
            {
              body: alert.reply,
              icon: '/logo.png',
              tag: `alert-reply-${alert.id}`,
              timestamp: Date.now(),
            } as ExtendedNotificationOptions
          );
        } else if (alert.reply && alert.replyFrom) {
          // Reply from a specific user type
          notificationService.showNotification(
            `New reply from ${alert.replyFrom === 'admin' ? (alert.admin || 'Admin') : 
                              alert.replyFrom === 'press' ? 'Press' : 
                              (alert.chairName || 'Chair')}`,
            {
              body: alert.reply,
              icon: '/logo.png',
              tag: `alert-reply-${alert.id}`,
              timestamp: Date.now(),
            } as ExtendedNotificationOptions
          );
        }
        
        // Show notifications for chair replies
        if (alert.chairReply && alert.chairName) {
          notificationService.showNotification(
            `New reply from ${alert.chairName}`,
            {
              body: alert.chairReply,
              icon: '/logo.png',
              tag: `chair-reply-${alert.id}`,
              timestamp: Date.now(),
            } as ExtendedNotificationOptions
          );
        }
      });
    }
    
    setPreviousAlerts(validAlerts);
  }, [alerts, alertsMuted, previousAlerts]);
  
  return notificationSound;
};
