export const environment = {
  production: true,
  apiUrl: 'http://localhost:5000/api',
  useMockData: false, // Disable mock data to use real API
  // Connection management settings
  connectionSettings: {
    maxRetries: 2, // Slightly more retries in production
    retryDelay: 2000, // 2 second delay between retries
    serverCheckInterval: 60000, // 1 minute between server availability checks
    enableOfflineDetection: true,
    preventExcessiveRequests: true
  }
};