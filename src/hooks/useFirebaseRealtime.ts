
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { realtimeService } from '@/services/firebaseService';

// Define event types
export type RealtimeEventType = 'NEW_ALERT' | 'ALERT_STATUS_UPDATE' | 'TIMER_SYNC';

export function useFirebaseRealtime<T = any>(eventType: RealtimeEventType, entityId?: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Set up listeners based on event type
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = async () => {
      try {
        switch (eventType) {
          case 'NEW_ALERT':
            // Listen to all alerts
            unsubscribe = realtimeService.onNewAlert((data) => {
              // Deduplicate data if it's an array
              if (Array.isArray(data)) {
                const uniqueAlerts = Array.from(
                  new Map(data.map(item => [item.id, item])).values()
                );
                setData(uniqueAlerts as T);
              } else {
                setData(data as T);
              }
              setIsLoading(false);
            });
            break;
            
          case 'ALERT_STATUS_UPDATE':
            // Listen to alert status updates
            unsubscribe = realtimeService.onAlertStatusUpdates((data) => {
              setData(data as T);
              setIsLoading(false);
            });
            break;
            
          case 'TIMER_SYNC':
            if (entityId) {
              // Listen to a specific timer
              unsubscribe = realtimeService.onTimerSync(entityId, (data) => {
                setData(data as T);
                setIsLoading(false);
              });
            }
            break;
        }
      } catch (err) {
        console.error(`Error setting up Firebase listener for ${eventType}:`, err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    };
    
    setupListener();
    
    // Clean up listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [eventType, entityId]);
  
  // Send data based on event type
  const sendMessage = useCallback((messageData: any): Promise<boolean> => {
    try {
      switch (eventType) {
        case 'NEW_ALERT':
          return realtimeService.createAlert(messageData);
          
        case 'ALERT_STATUS_UPDATE':
          if (!messageData.id) {
            throw new Error('Alert ID is required for status updates');
          }
          return realtimeService.updateAlertStatus(messageData.id, messageData.status, messageData);
          
        case 'TIMER_SYNC':
          if (!entityId) {
            throw new Error('Timer ID is required for timer sync');
          }
          return realtimeService.updateTimer(entityId, messageData);
          
        default:
          throw new Error(`Unsupported event type: ${eventType}`);
      }
    } catch (error) {
      console.error(`Error sending ${eventType}:`, error);
      toast.error(`Failed to send ${eventType}`);
      return Promise.resolve(false);
    }
  }, [eventType, entityId]);
  
  return { 
    data, 
    isLoading,
    error,
    sendMessage
  };
}

export default useFirebaseRealtime;
