import { io, Socket } from 'socket.io-client';
import config from '../config';

// API Configuration
const API_BASE_URL = config.apiUrl;
const SOCKET_URL = config.socketUrl;

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  auraPoints: number;
  level: number;
  experience: number;
  preferences: {
    notifications: boolean;
    publicProfile: boolean;
    allowInvites: boolean;
    theme: string;
  };
}

export interface GroupMember {
  userId: {
    _id: string;
    displayNameOrFull: string;
    avatar?: string;
    level: number;
    totalAuraEarned: number;
  };
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  isActive: boolean;
  contributedPoints: number;
  lastActivity: string;
  displayName?: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  code: string;
  owner: {
    _id: string;
    displayNameOrFull: string;
    avatar?: string;
    level: number;
  };
  members: GroupMember[];
  settings: {
    isPublic: boolean;
    allowInvites: boolean;
    maxMembers: number;
    requireApproval: boolean;
  };
  stats: {
    totalPointsEarned: number;
    totalFarms: number;
    averagePointsPerMember: number;
    lastActivity: string;
  };
  createdAt: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

// API Service Class
class ApiService {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private socket: Socket | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.loadTokens();
  }

  // Token Management
  private loadTokens() {
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private saveTokens(tokens: AuthTokens) {
    this.token = tokens.token;
    this.refreshToken = tokens.refreshToken;
    localStorage.setItem('auth_token', tokens.token);
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }

  private clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  // HTTP Request Helper
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && this.refreshToken) {
          const refreshed = await this.refreshAuthToken();
          if (refreshed) {
            // Retry the original request
            return this.request(endpoint, options);
          }
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication Methods
  async register(userData: {
    shopifyCustomerId: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.request<{ user: User; token: string; refreshToken: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );

    if (response.success && response.data) {
      const tokens = {
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
      this.saveTokens(tokens);
      return { user: response.data.user, tokens };
    }

    throw new Error(response.message || 'Registration failed');
  }

  async refreshAuthToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        this.saveTokens({
          token: data.data.token,
          refreshToken: data.data.refreshToken,
        });
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    
    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.message || 'Failed to get user');
  }

  logout() {
    this.clearTokens();
    this.disconnectSocket();
  }

  // Group Methods
  async createGroup(groupData: {
    name: string;
    description?: string;
    settings?: any;
  }): Promise<Group> {
    const response = await this.request<{ group: Group }>('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });

    if (response.success && response.data) {
      return response.data.group;
    }

    throw new Error(response.message || 'Failed to create group');
  }

  async getUserGroups(): Promise<Group[]> {
    const response = await this.request<{ groups: Group[] }>('/groups/my-groups');
    
    if (response.success && response.data) {
      return response.data.groups;
    }

    throw new Error(response.message || 'Failed to get user groups');
  }

  async getGroupByCode(code: string): Promise<Group> {
    const response = await this.request<{ group: Group }>(`/groups/code/${code}`);
    
    if (response.success && response.data) {
      return response.data.group;
    }

    throw new Error(response.message || 'Group not found');
  }

  async joinGroup(code: string): Promise<Group> {
    const response = await this.request<{ group: Group }>(`/groups/join/${code}`, {
      method: 'POST',
    });

    if (response.success && response.data) {
      return response.data.group;
    }

    throw new Error(response.message || 'Failed to join group');
  }

  async leaveGroup(groupId: string): Promise<void> {
    const response = await this.request(`/groups/${groupId}/leave`, {
      method: 'POST',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to leave group');
    }
  }

  async getGroupDetails(groupId: string): Promise<Group> {
    const response = await this.request<{ group: Group }>(`/groups/${groupId}`);
    
    if (response.success && response.data) {
      return response.data.group;
    }

    throw new Error(response.message || 'Failed to get group details');
  }

  async addPointsToGroup(groupId: string, points: number, reason?: string): Promise<{ pointsAdded: number; totalPoints: number }> {
    const response = await this.request<{ pointsAdded: number; totalPoints: number }>(`/groups/${groupId}/points`, {
      method: 'POST',
      body: JSON.stringify({ points, reason }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to add points');
  }

  // Socket.IO Methods
  connectSocket(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: this.token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return this.socket;
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGroupRoom(groupId: string) {
    if (this.socket) {
      this.socket.emit('join-group', groupId);
    }
  }

  leaveGroupRoom(groupId: string) {
    if (this.socket) {
      this.socket.emit('leave-group', groupId);
    }
  }

  // Socket event listeners
  onGroupUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('group-updated', callback);
    }
  }

  onMemberJoined(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('member-joined', callback);
    }
  }

  onMemberLeft(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('member-left', callback);
    }
  }

  onPointsAdded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('points-added', callback);
    }
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getAuthToken(): string | null {
    return this.token;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
