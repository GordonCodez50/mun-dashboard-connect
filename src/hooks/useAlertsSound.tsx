
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
};

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

  // Play sound for new alerts if not muted and show notifications
  useEffect(() => {
    if (!alerts || !previousAlerts) return;
    
    // Ensure all alerts have valid IDs
    const validAlerts = alerts.filter(alert => alert && alert.id);
    const validPreviousAlerts = previousAlerts.filter(alert => alert && alert.id);
    
    // Check for new alerts (by ID)
    const newAlerts = validAlerts.filter(
      alert => !validPreviousAlerts.some(a => a.id === alert.id)
    );
    
    // Check for new replies on existing alerts
    const alertsWithNewReplies = validAlerts.filter(alert => {
      const prevAlert = validPreviousAlerts.find(a => a.id === alert.id);
      return prevAlert && alert.reply && alert.reply !== prevAlert.reply;
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
      
      // Show notifications for new replies
      alertsWithNewReplies.forEach(alert => {
        if (alert.reply) {
          notificationService.showNotification(
            `New reply from ${alert.admin || 'Admin'}`,
            {
              body: alert.reply,
              icon: '/logo.png',
              tag: `alert-reply-${alert.id}`,
              timestamp: Date.now()
            }
          );
        }
      });
    }
    
    setPreviousAlerts(validAlerts);
  }, [alerts, alertsMuted, previousAlerts]);
  
  return notificationSound;
};
