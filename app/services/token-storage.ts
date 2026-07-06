import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_profile';

// Web-compatible storage abstraction
// On native (iOS/Android): use expo-secure-store (encrypted)
// On web: use localStorage (not secure, but functional for development)
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await storage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading access token', error);
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      await storage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error writing access token', error);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await storage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading refresh token', error);
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await storage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error writing refresh token', error);
    }
  },

  async getUserProfile(): Promise<any | null> {
    try {
      const userStr = await storage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error reading user profile', error);
      return null;
    }
  },

  async setUserProfile(user: any): Promise<void> {
    try {
      await storage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error writing user profile', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await storage.removeItem(ACCESS_TOKEN_KEY);
      await storage.removeItem(REFRESH_TOKEN_KEY);
      await storage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing secure storage', error);
    }
  },
};
