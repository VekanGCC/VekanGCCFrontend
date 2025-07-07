export const environment = {
  production: true,
  apiUrl: 'https://vekangcc-effpa2gjbfgafmds.centralindia-01.azurewebsites.net/api',
  useMockData: false,
  connectionSettings: {
    maxRetries: 2,
    retryDelay: 2000,
    serverCheckInterval: 60000,
    enableOfflineDetection: true,
    preventExcessiveRequests: true
  }
};
