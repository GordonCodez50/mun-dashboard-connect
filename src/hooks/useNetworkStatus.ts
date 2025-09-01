import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  downlink?: number;
  effectiveType?: string;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown'
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      const isSlowConnection = connection ? 
        (connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' ||
         connection.downlink < 1.5) : false;

      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection,
        connectionType: connection?.type || 'unknown',
        downlink: connection?.downlink,
        effectiveType: connection?.effectiveType
      });
    };

    const handleOnline = () => {
      updateNetworkStatus();
      toast.success('Back online');
    };

    const handleOffline = () => {
      updateNetworkStatus();
      toast.error('You are offline');
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // Initial update
    updateNetworkStatus();

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
}