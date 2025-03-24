
/**
 * Application configuration
 * This file contains environment-specific configuration settings
 */

// WebSocket service configuration
export const WS_CONFIG = {
  // In production, this should be your actual WebSocket server URL
  // For Vercel deployment, you can set this in your environment variables
  endpoint: import.meta.env.VITE_WS_ENDPOINT || 'wss://api.example.com/ws',
  
  // Feature flags
  simulationMode: import.meta.env.VITE_SIMULATION_MODE === 'true' || true,
  
  // Connection settings
  reconnectAttempts: 5,
  initialReconnectDelay: 1000, // ms
};

// Authentication configuration
export const AUTH_CONFIG = {
  // If true, users will be persisted in localStorage (for demo purposes)
  // In production, this should be false to use a real authentication system
  useLocalStorage: true,
  
  // Storage keys
  storageKeys: {
    user: 'mun_user',
    users: 'mun_users',
  }
};

// Application settings
export const APP_CONFIG = {
  appName: 'MUN Conference Dashboard',
  version: '1.0.0',
};
