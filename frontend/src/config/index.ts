// Environment configuration
export const config = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000',
  SSE_URL: process.env.REACT_APP_SSE_URL || 'http://localhost:4000/events/stream',
  
  // Default Seller ID
  DEFAULT_SELLER_ID: process.env.REACT_APP_DEFAULT_SELLER_ID || 'demo-seller',
  
  // Low Stock Threshold
  LOW_STOCK_THRESHOLD: parseInt(process.env.REACT_APP_LOW_STOCK_THRESHOLD || '5', 10),
  
  // Environment
  ENV: process.env.REACT_APP_ENV || 'development',
  
  // Feature Flags
  ENABLE_SSE: process.env.REACT_APP_ENABLE_SSE !== 'false',
  ENABLE_NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS !== 'false',
  
  // API Timeouts
  API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10),
  SSE_RECONNECT_INTERVAL: parseInt(process.env.REACT_APP_SSE_RECONNECT_INTERVAL || '5000', 10),
} as const;

// Type-safe environment configuration
export type Config = typeof config;
