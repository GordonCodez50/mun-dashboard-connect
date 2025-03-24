import { toast } from "sonner";
import { WS_CONFIG } from "@/config/appConfig";

// WebSocket event types
export type WebSocketEventType = 
  | 'COUNCIL_STATUS_UPDATE' 
  | 'NEW_ALERT' 
  | 'ALERT_STATUS_UPDATE' 
  | 'TIMER_SYNC'
  | 'DOCUMENT_UPDATE';

// WebSocket message format
export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
}

// Connection event handlers
type ConnectionHandler = () => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<WebSocketEventType, Set<(data: any) => void>> = new Map();
  private connectListeners: Set<ConnectionHandler> = new Set();
  private disconnectListeners: Set<ConnectionHandler> = new Set();
  private reconnectingListeners: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = WS_CONFIG.reconnectAttempts;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private url: string;
  private connected = false;
  private reconnecting = false;
  private simulationMode: boolean;
  
  constructor(url: string = WS_CONFIG.endpoint, simulationMode = WS_CONFIG.simulationMode) {
    this.url = url;
    this.simulationMode = simulationMode;
    
    // Log the current mode
    console.log(`WebSocket Service initialized in ${this.simulationMode ? 'SIMULATION' : 'PRODUCTION'} mode`);
  }
  
  // Connect to WebSocket server
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.connected = true;
      return;
    }
    
    if (this.reconnecting) return;
    
    try {
      if (this.simulationMode) {
        // For development, we'll use mock data
        this.simulateConnection();
        return;
      }
      
      // Production WebSocket connection
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.reconnecting = false;
        this.notifyConnectListeners();
        console.log('WebSocket connected to server');
      };
      
      this.socket.onclose = () => {
        this.connected = false;
        this.notifyDisconnectListeners();
        this.handleReconnect();
        console.log('WebSocket disconnected');
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.socket?.readyState !== WebSocket.OPEN) {
          this.handleReconnect();
        }
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.dispatchEvent(message.type, message.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }
  
  // Check if socket is connected
  isConnected(): boolean {
    return this.connected;
  }
  
  // Add connection event listener
  onConnect(callback: ConnectionHandler): () => void {
    this.connectListeners.add(callback);
    
    // If already connected, call the callback immediately
    if (this.connected) {
      callback();
    }
    
    return () => {
      this.connectListeners.delete(callback);
    };
  }
  
  // Remove connection event listener
  offConnect(callback: ConnectionHandler): void {
    this.connectListeners.delete(callback);
  }
  
  // Add disconnection event listener
  onDisconnect(callback: ConnectionHandler): () => void {
    this.disconnectListeners.add(callback);
    return () => {
      this.disconnectListeners.delete(callback);
    };
  }
  
  // Remove disconnection event listener
  offDisconnect(callback: ConnectionHandler): void {
    this.disconnectListeners.delete(callback);
  }
  
  // Add reconnecting event listener
  onReconnecting(callback: ConnectionHandler): () => void {
    this.reconnectingListeners.add(callback);
    
    // If already reconnecting, call the callback immediately
    if (this.reconnecting) {
      callback();
    }
    
    return () => {
      this.reconnectingListeners.delete(callback);
    };
  }
  
  // Remove reconnecting event listener
  offReconnecting(callback: ConnectionHandler): void {
    this.reconnectingListeners.delete(callback);
  }
  
  // Notify connect listeners
  private notifyConnectListeners(): void {
    this.connectListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in connect listener:', error);
      }
    });
  }
  
  // Notify disconnect listeners
  private notifyDisconnectListeners(): void {
    this.disconnectListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in disconnect listener:', error);
      }
    });
  }
  
  // Notify reconnecting listeners
  private notifyReconnectingListeners(): void {
    this.reconnectingListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in reconnecting listener:', error);
      }
    });
  }
  
  // Add event listener
  on<T>(event: WebSocketEventType, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)?.add(callback as (data: any) => void);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback as (data: any) => void);
      }
    };
  }
  
  // Remove event listener
  off(event: WebSocketEventType, callback: (data: any) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  // Send message to server
  send(event: WebSocketEventType, data: any): void {
    if (!this.connected) {
      this.connect();
      // Queue message to be sent after connection
      setTimeout(() => this.send(event, data), 100);
      return;
    }
    
    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: new Date().toISOString()
    };
    
    if (this.simulationMode) {
      // For development, we'll simulate sending and immediate echo
      this.simulateSend(message);
      return;
    }
    
    // Production mode: actually send the message
    this.socket?.send(JSON.stringify(message));
  }
  
  // Close WebSocket connection
  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
      this.notifyDisconnectListeners();
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  // Handle reconnection
  private handleReconnect(): void {
    if (this.reconnecting) return;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      toast.error('Unable to connect to real-time services. Please refresh the page.');
      return;
    }
    
    this.reconnecting = true;
    this.notifyReconnectingListeners();
    
    this.reconnectAttempts++;
    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }
  
  // Simulate connection for development
  private simulateConnection(): void {
    console.log('WebSocket connected (SIMULATION MODE)');
    
    // Mark as connected
    this.connected = true;
    this.reconnecting = false;
    
    // Reset reconnect attempts on successful connection
    this.reconnectAttempts = 0;
    
    // Notify listeners
    this.notifyConnectListeners();
    
    // Simulate periodic status updates
    setInterval(() => {
      const statuses: ('in-session' | 'on-break' | 'technical-issue')[] = ['in-session', 'on-break', 'technical-issue'];
      const randomCouncil = Math.floor(Math.random() * 5) + 1;
      
      if (Math.random() > 0.7) { // 30% chance of a status update
        this.dispatchEvent('COUNCIL_STATUS_UPDATE', {
          councilId: String(randomCouncil),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          timestamp: new Date().toISOString()
        });
      }
    }, 15000);
    
    // Simulate random alerts
    setInterval(() => {
      const alertTypes = ['IT Support', 'Mic Issue', 'Security', 'Break'];
      const councils = ['Security Council', 'Human Rights Council', 'Economic and Social Council', 'General Assembly', 'Environmental Committee'];
      const chairNames = ['John Smith', 'Emma Johnson', 'Michael Brown', 'Sarah Wilson', 'Alex Thompson'];
      
      if (Math.random() > 0.8) { // 20% chance of a new alert
        const randomCouncil = Math.floor(Math.random() * councils.length);
        this.dispatchEvent('NEW_ALERT', {
          id: Date.now().toString(),
          council: councils[randomCouncil],
          chairName: chairNames[randomCouncil],
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          message: 'Simulated alert from WebSocket',
          timestamp: new Date().toISOString(),
          status: 'pending',
          priority: Math.random() > 0.7 ? 'urgent' : 'normal'
        });
      }
    }, 30000);
  }
  
  // Simulate sending message for development
  private simulateSend(message: WebSocketMessage): void {
    console.log('WebSocket message sent (SIMULATION MODE):', message);
    
    // Simulate echo/response from server
    setTimeout(() => {
      this.dispatchEvent(message.type, message.data);
    }, 200);
  }
  
  // Dispatch event to listeners
  private dispatchEvent(event: WebSocketEventType, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for event ${event}:`, error);
        }
      });
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// Initialize connection on import
websocketService.connect();

export default websocketService;
