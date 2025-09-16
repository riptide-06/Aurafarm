// Configuration for the AuraFarm application
export const config = {
  // Backend API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  
  // Development settings
  devMode: import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV,
  
  // Feature flags
  features: {
    realTimeSync: true,
    offlineMode: true,
    analytics: true,
  },
  
  // Default settings
  defaults: {
    maxGroupsPerUser: 5,
    maxMembersPerGroup: 20,
    defaultGroupSettings: {
      isPublic: false,
      allowInvites: true,
      requireApproval: false,
    },
  },
};

export default config;
