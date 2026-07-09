import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient, { registerAuthFailureListener } from '../services/api-client';
import { TokenStorage } from '../services/token-storage';

interface UserProfile {
  sub: string;
  username: string;
  displayName: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, displayName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved credentials from SecureStore on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = await TokenStorage.getAccessToken();
        const profile = await TokenStorage.getUserProfile();

        if (accessToken && profile) {
          try {
            // Verify token validity with server. 
            // If it's expired, apiClient will automatically try to refresh it.
            // If refresh fails, apiClient triggers authFailureCallback which clears everything.
            await apiClient.get('/auth/me');
            setIsAuthenticated(true);
            setUser(profile);
          } catch (error) {
            console.error('Failed to verify auth session on server', error);
          }
        }
      } catch (error) {
        console.error('Failed to restore auth session', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Register a callback for when token refreshing fails catastrophically
    registerAuthFailureListener(() => {
      setIsAuthenticated(false);
      setUser(null);
    });
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { accessToken, refreshToken, user: profile } = response.data;

      await TokenStorage.setAccessToken(accessToken);
      await TokenStorage.setRefreshToken(refreshToken);
      await TokenStorage.setUserProfile(profile);

      setUser(profile);
      setIsAuthenticated(true);
    } catch (error: any) {
      // Handle network errors (server not running)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Không thể kết nối đến server. Vui lòng đảm bảo server đang chạy.');
      }
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      throw new Error(message);
    }
  };

  const register = async (username: string, email: string, displayName: string, password: string) => {
    try {
      await apiClient.post('/auth/register', { username, email, displayName, password });
    } catch (error: any) {
      // Handle network errors (server not running)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Không thể kết nối đến server. Vui lòng đảm bảo server đang chạy.');
      }
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint in a fire-and-forget style
      // because we want to clear the storage even if the API call fails or is unauthorized
      apiClient.post('/auth/logout').catch((err) => {
        console.warn('Backend logout failed', err);
      });
    } finally {
      await TokenStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
