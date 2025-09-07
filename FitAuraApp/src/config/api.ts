// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Profile endpoints
  PROFILE: `${API_BASE_URL}/api/profile`,
  
  // Logging endpoints
  LOGGING: `${API_BASE_URL}/api/logging`,
  
  // Insights endpoints
  INSIGHTS: `${API_BASE_URL}/api/insights`,
  INSIGHTS_INITIALIZE: `${API_BASE_URL}/api/insights/initialize`,
  INSIGHTS_STATS: `${API_BASE_URL}/api/insights/stats`,
  INSIGHTS_RESPONSES_SEARCH: `${API_BASE_URL}/api/insights/responses/search`,
  INSIGHTS_RESPONSES_HISTORY: `${API_BASE_URL}/api/insights/responses/history`,
  
  // Health check
  HEALTH: `${API_BASE_URL}/health`,
} as const;

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// Environment configuration
export const ENV_CONFIG = {
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  API_BASE_URL,
} as const;
