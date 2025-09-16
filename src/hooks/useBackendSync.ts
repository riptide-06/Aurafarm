import { useEffect } from 'react';
import { groupSyncService } from '../services/groupSync';
import type { FriendGroup } from '../types';

// Hook to add backend synchronization to existing group functionality
export const useBackendSync = () => {
  useEffect(() => {
    // Initialize the sync service
    groupSyncService.initialize();
  }, []);

  // Wrapper functions that add backend sync to your existing functions
  const createGroupWithSync = (name: string, originalCreateGroup: (name: string) => void) => {
    // Call your original function first
    originalCreateGroup(name);
    
    // Then sync to backend in the background
    setTimeout(() => {
      const newGroup: FriendGroup = {
        id: Date.now().toString(),
        name: name,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [],
        createdAt: new Date()
      };
      groupSyncService.createGroup(newGroup);
    }, 100);
  };

  const joinGroupWithSync = (code: string, originalJoinGroup: (code: string) => void) => {
    // Call your original function first
    originalJoinGroup(code);
    
    // Then sync to backend in the background
    setTimeout(() => {
      groupSyncService.joinGroup(code);
    }, 100);
  };

  const addPointsWithSync = (groupId: string, points: number, reason?: string) => {
    groupSyncService.addPoints(groupId, points, reason);
  };

  return {
    createGroupWithSync,
    joinGroupWithSync,
    addPointsWithSync,
    isBackendAvailable: () => groupSyncService.isBackendAvailable(),
    getBackendGroups: () => groupSyncService.getBackendGroups()
  };
};
