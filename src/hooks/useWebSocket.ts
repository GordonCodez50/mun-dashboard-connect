
import { useEffect, useRef, useState, useCallback } from 'react';
import websocketService, { WebSocketEventType } from '@/services/websocketService';

export function useWebSocket<T = any>(eventType: WebSocketEventType) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Store the callback reference
  const callbackRef = useRef<((data: T) => void) | null>(null);
  
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
    setIsConnected(true);
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [eventType]);
  
  // Send data to the WebSocket server
  const sendMessage = useCallback((data: any) => {
    websocketService.send(eventType, data);
  }, [eventType]);
  
  // Register a callback to be called when receiving messages
  const onMessage = useCallback((callback: (data: T) => void) => {
    callbackRef.current = callback;
  }, []);
  
  return { data, isConnected, sendMessage, onMessage };
}

export default useWebSocket;
