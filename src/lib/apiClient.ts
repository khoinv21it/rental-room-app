/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios, { type InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../Services/Constants";

const apiClient = Axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional external handler to perform logout/navigation when tokens invalid
let onLogoutHandler: (() => void) | null = null;
export const setOnLogoutHandler = (fn: (() => void) | null) => {
  onLogoutHandler = fn;
};

const AUTH_KEY = "auth-storage";

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

      config.headers.Accept = "application/json";
      return config;
    } catch (err) {
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config as
      | InternalAxiosRequestConfig
      | undefined;

    // Don't intercept login requests here
    if (originalRequest?.url === "/auth/login" || originalRequest?.url === "/auth/google-login") {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear auth and call logout handler (if provided)
      try {
        await AsyncStorage.removeItem(AUTH_KEY);
      } catch (e) {
        // ignore
      }
      if (onLogoutHandler) {
        try {
          onLogoutHandler();
        } catch (e) {
          /* ignore */
        }
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
