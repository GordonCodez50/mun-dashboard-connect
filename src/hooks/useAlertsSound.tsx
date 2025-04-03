
import { useState, useEffect, useRef } from 'react';

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

  // Initialize notification sound
  useEffect(() => {
    notificationSound.current = new Audio("/notification.mp3");
    return () => {
      if (notificationSound.current) {
        notificationSound.current = null;
      }
    };
  }, []);

  // Play sound for new alerts if not muted
  useEffect(() => {
    if (!alerts || !previousAlerts) return;
    
    // Check for new alerts (by ID)
    const newAlerts = alerts.filter(
      alert => !previousAlerts.some(a => a.id === alert.id)
    );
    
    // Check for new replies on existing alerts
    const alertsWithNewReplies = alerts.filter(alert => {
      const prevAlert = previousAlerts.find(a => a.id === alert.id);
      return prevAlert && alert.reply && alert.reply !== prevAlert.reply;
    });
    
    if ((newAlerts.length > 0 || alertsWithNewReplies.length > 0) && !alertsMuted) {
      // Play the notification sound
      if (notificationSound.current) {
        notificationSound.current.currentTime = 0;
        notificationSound.current.play().catch(err => console.error("Error playing sound:", err));
      }
    }
    
    setPreviousAlerts(alerts);
  }, [alerts, alertsMuted, previousAlerts]);
  
  return notificationSound;
};
