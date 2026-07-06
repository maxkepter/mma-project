import axios from 'axios';
import Constants from 'expo-constants';
import { TokenStorage } from './token-storage';

// Get API URL from environment variables or use sensible defaults
const getBaseUrl = () => {
  // Check for explicit env var first (EXPO_PUBLIC_ prefix is required for Expo to expose vars)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Fallback: dynamically detect dev machine IP
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  const port = process.env.EXPO_API_PORT || '3000';
  return `http://${host}:${port}`;
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Event listener mechanism to notify AuthContext when auth fails catastrophically
type AuthFailureCallback = () => void;
let authFailureCallback: AuthFailureCallback | null = null;

export const registerAuthFailureListener = (callback: AuthFailureCallback) => {
  authFailureCallback = callback;
};

// Queue to hold pending requests while token is refreshing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token & Log
apiClient.interceptors.request.use(
  async (config) => {
    const token = await TokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle 401 Unauthorized (JWT expired) & Log
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`, {
      data: response.data,
    });
    return response;
  },
  async (error) => {
    console.error(`[API Error] ${error.response?.status || 'Network'} ${error.config?.url}`, {
      message: error.message,
      data: error.response?.data,
    });
    const originalRequest = error.config;

    // Avoid infinite loop if the refresh endpoint itself returns 401, or if request has already been retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request and wait for the refresh process to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await TokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call the refresh endpoint
        const response = await axios.post(`${getBaseUrl()}/auth/refresh`, {
          refreshToken,
        }, {
          headers: { 'Content-Type': 'application/json' },
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Save new tokens
        await TokenStorage.setAccessToken(newAccessToken);
        await TokenStorage.setRefreshToken(newRefreshToken);

        // Update authorization header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Resolve queued requests
        processQueue(null, newAccessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Catastrophic auth failure (Refresh Token expired, invalid or revoked)
        await TokenStorage.clear();
        if (authFailureCallback) {
          authFailureCallback();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
