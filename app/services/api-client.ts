import axios from 'axios';
import { Platform } from 'react-native';
import { TokenStorage } from './token-storage';

// Get API URL from environment variables or use sensible defaults
const getBaseUrl = () => {
  const port = process.env.EXPO_PUBLIC_API_PORT || '3000';

  // Explicit host override (provide host only, port is appended automatically)
  if (
    process.env.EXPO_PUBLIC_API_URL &&
    process.env.EXPO_PUBLIC_API_URL.length > 0
  ) {
    const host = process.env.EXPO_PUBLIC_API_URL;
    return `${host}:${port}`;
  }

  console.log(
    `[API Client] Using default base URL for platform ${Platform.OS} and port ${port}`,
  );

  // Android emulator reaches the host machine via 10.0.2.2 (not localhost)
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }

  // iOS simulator and web can reach the host via localhost
  // For physical iOS devices on the same LAN, set EXPO_PUBLIC_API_URL instead
  return `http://localhost:${port}`;
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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
    console.error(
      `[API Error] ${error.response?.status || 'Network'} ${error.config?.url}`,
      {
        message: error.message,
        data: error.response?.data,
      },
    );
    const originalRequest = error.config;

    // Avoid infinite loop if the refresh endpoint itself returns 401, or if request has already been retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      // For guests (no refresh token saved), there is nothing to refresh — surface
      // the 401 to the caller as-is. Triggering the auth-failure listener here would
      // flip a guest's session to "logged out" and force-render the LoginPrompt on
      // public screens they have legitimate access to.
      const refreshToken = await TokenStorage.getRefreshToken();
      if (!refreshToken) {
        return Promise.reject(error);
      }

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

        // Call the refresh endpoint
        const response = await axios.post(
          `${getBaseUrl()}/auth/refresh`,
          {
            refreshToken,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        // Save new tokens
        await TokenStorage.setAccessToken(newAccessToken);
        await TokenStorage.setRefreshToken(newRefreshToken);

        // Update authorization header
        apiClient.defaults.headers.common['Authorization'] =
          `Bearer ${newAccessToken}`;
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
