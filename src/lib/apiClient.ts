/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios, { type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from "../Services/Constants";

const apiClient = Axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional external handler to perform logout/navigation when tokens invalid
let onLogoutHandler: (() => void) | null = null;
export const setOnLogoutHandler = (fn: (() => void) | null) => {
  onLogoutHandler = fn;
};

const AUTH_KEY = 'auth-storage';

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      const authStorage = raw ? JSON.parse(raw) : null;
      const access_token = authStorage?.state?.access_token;

      if (!config.headers) {
        config.headers = new Axios.AxiosHeaders();
      }

      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }

      config.headers.Accept = 'application/json';
      return config;
    } catch (err) {
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

const refreshToken = async (): Promise<string | null> => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    const storage = raw ? JSON.parse(raw) : null;

    const refresh_token = storage?.state?.refresh_token;
    if (!refresh_token) {
      console.error('No refresh token available');
      return null;
    }

    // New axios instance to avoid interceptors
    const refreshApiClient = Axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    const response: any = await refreshApiClient.post('/auth/refresh-token', { refresh_token });

    if (!response || !response.data || !response.data.access_token) {
      console.error('Invalid refresh token response');
      return null;
    }

    await AsyncStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        state: {
          ...storage.state,
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
        },
      })
    );

    return response.data.access_token;
  } catch (error: any) {
    console.error('Failed to refresh token:', error);
    // If refresh token is invalid (401/403), clear storage and call logout handler
    if (error.response?.status === 401 || error.response?.status === 403) {
      await AsyncStorage.removeItem(AUTH_KEY);
      if (onLogoutHandler) onLogoutHandler();
    }
    return null;
  }
};

// Queue to hold requests while refreshing token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      resolve(apiClient(config));
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't attempt to refresh for auth endpoints
    if (originalRequest?.url === '/auth/login' || originalRequest?.url === '/auth/refresh-token') {
      return Promise.reject(error);
    }

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshToken();

        if (newAccessToken) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          processQueue(error, null);
          await AsyncStorage.removeItem(AUTH_KEY);
          if (onLogoutHandler) onLogoutHandler();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.removeItem(AUTH_KEY);
        if (onLogoutHandler) onLogoutHandler();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
