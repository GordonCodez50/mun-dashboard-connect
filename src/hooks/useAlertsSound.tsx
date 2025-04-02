
import { useState, useEffect, useRef } from 'react';
import { Alert } from '@/components/admin/AlertItem';

export const useAlertsSound = (alerts: Alert[], alertsMuted: boolean) => {
  const [previousAlerts, setPreviousAlerts] = useState<Alert[]>([]);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    notificationSound.current = new Audio("https://pixabay.com/sound-effects/notification-18-270129/");
    return () => {
      if (notificationSound.current) {
        notificationSound.current = null;
      }
    };
  }, []);

  // Play sound for new alerts if not muted
  useEffect(() => {
    if (!alerts || !previousAlerts) return;
    
    const newAlerts = alerts.filter(
      alert => !previousAlerts.some(a => a.id === alert.id)
    );
    
    if (newAlerts.length > 0 && !alertsMuted) {
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
