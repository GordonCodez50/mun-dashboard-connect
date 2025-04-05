
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

// Store processed alerts in sessionStorage to prevent duplicates across page navigations
const getProcessedAlertIds = (): Set<string> => {
  const storedIds = sessionStorage.getItem('processedAlertIds');
  return storedIds ? new Set(JSON.parse(storedIds)) : new Set();
};

const getProcessedReplyIds = (): Set<string> => {
  const storedIds = sessionStorage.getItem('processedReplyIds');
  return storedIds ? new Set(JSON.parse(storedIds)) : new Set();
};

export const useAlertsSound = (alerts: AlertWithSound[], alertsMuted: boolean) => {
  const [previousAlerts, setPreviousAlerts] = useState<AlertWithSound[]>([]);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const processedAlertIds = useRef<Set<string>>(getProcessedAlertIds());
  const processedReplyIds = useRef<Set<string>>(getProcessedReplyIds());

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
    
    // Check for new alerts (by ID) that we haven't processed yet
    const newAlerts = validAlerts.filter(
      alert => !processedAlertIds.current.has(alert.id)
    );
    
    // Check for new replies on existing alerts that we haven't processed yet
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
      
      // Create a unique ID for replies to track them
      const replyId = hasNewAdminReply ? `${alert.id}-admin-${alert.reply}` : 
                     hasNewChairReply ? `${alert.id}-chair-${alert.chairReply}` :
                     hasNewReplyTimestamp ? `${alert.id}-timestamp-${alert.replyTimestamp}` : null;
      
      // Check if we've already processed this reply
      if (replyId && !processedReplyIds.current.has(replyId)) {
        return true;
      }
      
      return false;
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
        
        // Mark this alert as processed
        processedAlertIds.current.add(alert.id);
      });
      
      // Show notifications for new replies
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
          
          // Mark this reply as processed
          processedReplyIds.current.add(`${alert.id}-admin-${alert.reply}`);
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
          
          // Mark this reply as processed
          processedReplyIds.current.add(`${alert.id}-${alert.replyFrom}-${alert.reply}`);
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
          
          // Mark this chair reply as processed
          processedReplyIds.current.add(`${alert.id}-chair-${alert.chairReply}`);
        }
      });
      
      // Save the processed IDs to sessionStorage
      sessionStorage.setItem('processedAlertIds', JSON.stringify([...processedAlertIds.current]));
      sessionStorage.setItem('processedReplyIds', JSON.stringify([...processedReplyIds.current]));
    }
    
    setPreviousAlerts(validAlerts);
  }, [alerts, alertsMuted, previousAlerts]);
  
  return notificationSound;
};
