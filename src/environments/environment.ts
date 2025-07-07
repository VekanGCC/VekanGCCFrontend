export const environment = {
  production: false,
  apiUrl: 'https://vekangcc-effpa2gjbfgafmds.centralindia-01.azurewebsites.net/api',
  useMockData: false, // Disable mock data to use real API
  // Connection management settings
  connectionSettings: {
    maxRetries: 1, // Reduced from default
    retryDelay: 1000, // 1 second delay between retries
    serverCheckInterval: 30000, // 30 seconds between server availability checks
    enableOfflineDetection: true,
    preventExcessiveRequests: true
  }
};