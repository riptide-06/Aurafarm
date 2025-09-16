import { useState, useEffect, useCallback } from 'react';
import { apiService, User, AuthTokens } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      if (!apiService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to get current user:', err);
        // Token might be invalid, clear it
        apiService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Register/Login with Shopify customer data
  const authenticate = useCallback(async (userData: {
    shopifyCustomerId: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
  }): Promise<User> => {
    try {
      setLoading(true);
      setError(null);

      const { user: userData, tokens } = await apiService.register(userData);
      setUser(userData);
      
      return userData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    apiService.logout();
    setUser(null);
    setError(null);
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!apiService.isAuthenticated()) {
      return;
    }

    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      logout();
    }
  }, [logout]);

  return {
    // State
    user,
    loading,
    error,
    
    // Actions
    authenticate,
    logout,
    refreshUser,
    
    // Computed
    isAuthenticated: !!user && apiService.isAuthenticated(),
  };
};
