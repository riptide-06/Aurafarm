import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, Group, User } from '../services/api';
import { FriendGroup, Friend } from '../types';

// Convert backend Group to frontend FriendGroup
const convertToFriendGroup = (group: Group): FriendGroup => {
  const members: Friend[] = group.members
    .filter(member => member.isActive)
    .map(member => ({
      id: member.userId._id,
      name: member.displayName || member.userId.displayNameOrFull,
      avatar: member.avatar || member.userId.avatar || '👤',
      aura: member.userId.totalAuraEarned || 0,
      dailyComplete: false, // This would need to be tracked separately
    }));

  return {
    id: group.id,
    name: group.name,
    code: group.code,
    members,
    createdAt: new Date(group.createdAt),
  };
};

export const useGroups = () => {
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<FriendGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const socketRef = useRef<any>(null);

  // Initialize user and groups
  useEffect(() => {
    const initializeData = async () => {
      if (!apiService.isAuthenticated()) {
        return;
      }

      try {
        setLoading(true);
        const [userData, groupsData] = await Promise.all([
          apiService.getCurrentUser(),
          apiService.getUserGroups(),
        ]);

        setUser(userData);
        setGroups(groupsData.map(convertToFriendGroup));

        // Connect to socket for real-time updates
        const socket = apiService.connectSocket();
        socketRef.current = socket;

        // Set up event listeners
        socket.on('member-joined', (data) => {
          setGroups(prevGroups => 
            prevGroups.map(group => {
              if (group.id === data.groupId) {
                const newMember: Friend = {
                  id: data.userId,
                  name: data.userName,
                  avatar: data.userAvatar || '👤',
                  aura: 0,
                  dailyComplete: false,
                };
                return {
                  ...group,
                  members: [...group.members, newMember],
                };
              }
              return group;
            })
          );
        });

        socket.on('member-left', (data) => {
          setGroups(prevGroups => 
            prevGroups.map(group => {
              if (group.id === data.groupId) {
                return {
                  ...group,
                  members: group.members.filter(member => member.id !== data.userId),
                };
              }
              return group;
            })
          );
        });

        socket.on('points-added', (data) => {
          // Update group stats or trigger refresh
          refreshGroups();
        });

      } catch (err) {
        console.error('Failed to initialize groups:', err);
        setError(err instanceof Error ? err.message : 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    return () => {
      if (socketRef.current) {
        apiService.disconnectSocket();
      }
    };
  }, []);

  // Refresh groups from server
  const refreshGroups = useCallback(async () => {
    if (!apiService.isAuthenticated()) return;

    try {
      const groupsData = await apiService.getUserGroups();
      setGroups(groupsData.map(convertToFriendGroup));
    } catch (err) {
      console.error('Failed to refresh groups:', err);
    }
  }, []);

  // Create a new group
  const createGroup = useCallback(async (name: string): Promise<FriendGroup> => {
    if (!apiService.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const group = await apiService.createGroup({ name });
      const friendGroup = convertToFriendGroup(group);
      
      setGroups(prev => [...prev, friendGroup]);
      setCurrentGroup(friendGroup);

      // Join socket room for real-time updates
      apiService.joinGroupRoom(group.id);

      return friendGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Join a group by code
  const joinGroup = useCallback(async (code: string): Promise<FriendGroup> => {
    if (!apiService.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const group = await apiService.joinGroup(code);
      const friendGroup = convertToFriendGroup(group);
      
      setGroups(prev => [...prev, friendGroup]);
      setCurrentGroup(friendGroup);

      // Join socket room for real-time updates
      apiService.joinGroupRoom(group.id);

      return friendGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join group';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Leave a group
  const leaveGroup = useCallback(async (groupId: string): Promise<void> => {
    if (!apiService.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      await apiService.leaveGroup(groupId);
      
      setGroups(prev => prev.filter(group => group.id !== groupId));
      
      if (currentGroup?.id === groupId) {
        setCurrentGroup(null);
      }

      // Leave socket room
      apiService.leaveGroupRoom(groupId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave group';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentGroup]);

  // Select a group
  const selectGroup = useCallback((group: FriendGroup | null) => {
    setCurrentGroup(group);
    
    if (group) {
      // Join socket room for the selected group
      apiService.joinGroupRoom(group.id);
    }
  }, []);

  // Add points to current group
  const addPointsToGroup = useCallback(async (points: number, reason?: string): Promise<void> => {
    if (!currentGroup || !apiService.isAuthenticated()) {
      throw new Error('No group selected or not authenticated');
    }

    try {
      await apiService.addPointsToGroup(currentGroup.id, points, reason);
      
      // Refresh groups to get updated stats
      await refreshGroups();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add points';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [currentGroup, refreshGroups]);

  // Check if user is already in a group with the given code
  const isAlreadyInGroup = useCallback((code: string): boolean => {
    return groups.some(group => group.code === code);
  }, [groups]);

  // Get group by code (for validation before joining)
  const getGroupByCode = useCallback(async (code: string): Promise<Group | null> => {
    try {
      return await apiService.getGroupByCode(code);
    } catch (err) {
      return null;
    }
  }, []);

  return {
    // State
    groups,
    currentGroup,
    loading,
    error,
    user,
    
    // Actions
    createGroup,
    joinGroup,
    leaveGroup,
    selectGroup,
    addPointsToGroup,
    refreshGroups,
    
    // Utilities
    isAlreadyInGroup,
    getGroupByCode,
    
    // Computed
    isAuthenticated: apiService.isAuthenticated(),
  };
};
