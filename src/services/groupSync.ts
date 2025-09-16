// Background group synchronization service
// This runs in the background and syncs local groups to the backend when available

import { apiService } from './api';
import type { FriendGroup } from '../types';

class GroupSyncService {
  private isInitialized = false;
  private syncQueue: Array<{ action: 'create' | 'join' | 'leave'; data: any }> = [];

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Check if backend is available
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        this.isInitialized = true;
        console.log('🔄 Group sync service initialized - backend available');
        
        // Process any queued sync operations
        await this.processSyncQueue();
      }
    } catch (error) {
      console.log('📱 Group sync service running in offline mode');
    }
  }

  async createGroup(group: FriendGroup) {
    if (!this.isInitialized) {
      this.syncQueue.push({ action: 'create', data: group });
      return;
    }

    try {
      await apiService.createGroup({
        name: group.name,
        description: `Group created with code: ${group.code}`
      });
      console.log('✅ Group synced to backend:', group.name);
    } catch (error) {
      console.log('⚠️ Failed to sync group to backend:', error);
    }
  }

  async joinGroup(groupCode: string) {
    if (!this.isInitialized) {
      this.syncQueue.push({ action: 'join', data: { code: groupCode } });
      return;
    }

    try {
      await apiService.joinGroup(groupCode);
      console.log('✅ Joined group synced to backend:', groupCode);
    } catch (error) {
      console.log('⚠️ Failed to sync group join to backend:', error);
    }
  }

  async leaveGroup(groupId: string) {
    if (!this.isInitialized) {
      this.syncQueue.push({ action: 'leave', data: { groupId } });
      return;
    }

    try {
      await apiService.leaveGroup(groupId);
      console.log('✅ Group leave synced to backend:', groupId);
    } catch (error) {
      console.log('⚠️ Failed to sync group leave to backend:', error);
    }
  }

  async addPoints(groupId: string, points: number, reason?: string) {
    if (!this.isInitialized) return;

    try {
      await apiService.addPointsToGroup(groupId, points, reason);
      console.log('✅ Points synced to backend:', points);
    } catch (error) {
      console.log('⚠️ Failed to sync points to backend:', error);
    }
  }

  private async processSyncQueue() {
    while (this.syncQueue.length > 0) {
      const operation = this.syncQueue.shift();
      if (!operation) break;

      try {
        switch (operation.action) {
          case 'create':
            await this.createGroup(operation.data);
            break;
          case 'join':
            await this.joinGroup(operation.data.code);
            break;
          case 'leave':
            await this.leaveGroup(operation.data.groupId);
            break;
        }
      } catch (error) {
        console.log('⚠️ Failed to process queued operation:', error);
      }
    }
  }

  // Check if backend is available
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get backend groups if available
  async getBackendGroups(): Promise<FriendGroup[]> {
    if (!this.isInitialized) return [];

    try {
      return await apiService.getUserGroups();
    } catch (error) {
      console.log('⚠️ Failed to get backend groups:', error);
      return [];
    }
  }
}

// Export singleton instance
export const groupSyncService = new GroupSyncService();

// Initialize the service when the module loads
groupSyncService.initialize();
