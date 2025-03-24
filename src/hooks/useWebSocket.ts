
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import websocketService, { WebSocketEventType } from '@/services/websocketService';

export function useWebSocket<T = any>(eventType: WebSocketEventType) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  
  // Store the callback reference
  const callbackRef = useRef<((data: T) => void) | null>(null);
  
  // Monitor connection status
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
    };
    
    const handleReconnecting = () => {
      setIsReconnecting(true);
    };
    
    // Subscribe to connection events
    websocketService.onConnect(handleConnect);
    websocketService.onDisconnect(handleDisconnect);
    websocketService.onReconnecting(handleReconnecting);
    
    // Set initial connection state
    setIsConnected(websocketService.isConnected());
    
    // Clean up subscriptions
    return () => {
      websocketService.offConnect(handleConnect);
      websocketService.offDisconnect(handleDisconnect);
      websocketService.offReconnecting(handleReconnecting);
    };
  }, []);
  
  // Set up event listener
  useEffect(() => {
    // Create a handler that updates state
    const handleEvent = (eventData: T) => {
      setData(eventData);
      if (callbackRef.current) {
        callbackRef.current(eventData);
      }
    };
    
    // Subscribe to the event
    const unsubscribe = websocketService.on<T>(eventType, handleEvent);
    
    // Ensure we're connected
    if (!isConnected && !isReconnecting) {
      websocketService.connect();
    }
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [eventType, isConnected, isReconnecting]);
  
  // Retry sending if disconnected
  const sendWithRetry = useCallback((data: any, maxRetries = 3, delayMs = 1000) => {
    let retries = 0;
    
    const attemptSend = () => {
      if (websocketService.isConnected()) {
        websocketService.send(eventType, data);
        return true;
      } else if (retries < maxRetries) {
        retries++;
        
        // Show reconnecting message on first retry
        if (retries === 1) {
          toast.info('Reconnecting to server...');
        }
        
        setTimeout(attemptSend, delayMs);
        return false;
      } else {
        toast.error('Unable to send message. Please try again later.');
        return false;
      }
    };
    
    return attemptSend();
  }, [eventType]);
  
  // Send data to the WebSocket server
  const sendMessage = useCallback((data: any) => {
    if (isConnected) {
      websocketService.send(eventType, data);
      return true;
    } else {
      return sendWithRetry(data);
    }
  }, [eventType, isConnected, sendWithRetry]);
  
  // Register a callback to be called when receiving messages
  const onMessage = useCallback((callback: (data: T) => void) => {
    callbackRef.current = callback;
  }, []);
  
  return { 
    data, 
    isConnected, 
    isReconnecting,
    sendMessage, 
    onMessage 
  };
}

export default useWebSocket;
