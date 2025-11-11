/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../lib/apiClient";

export interface UserProfile {
  // fill according to your backend
  id: string;
  fullName?: string;
  avatar?: string;
}

export interface LoggedInUser {
  id: string;
  username: string;
  isActive: number;
  roles: string[];
  userProfile: UserProfile;
}

export interface AuthState {
  access_token?: string | null;
  refresh_token?: string | null;
  loggedInUser?: LoggedInUser | null;
  loading: boolean;
  error: any;
  login: (opts: {
    username: string;
    password: string;
    onSuccess?: () => void;
    onError?: (err: any) => void;
  }) => Promise<void>;
  loginWithGoogle: (opts: {
    token: string;
    onSuccess?: () => void;
    onError?: (err: any) => void;
  }) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => void;
  logOut: () => Promise<void>;
}

const STORAGE_KEY = "auth-storage";

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        access_token: undefined,
        refresh_token: undefined,
        loggedInUser: undefined,
        loading: false,
        error: null,

        login: async (opts: {
          username: string;
          password: string;
          onSuccess?: () => void;
          onError?: (err: any) => void;
        }) => {
          const { username, password, onSuccess, onError } = opts;
          try {
            set({ loading: true, error: null });

            const response: any = await apiClient.post("/auth/login", {
              username,
              password,
            });
            console.log("Login response:", response);

            // adapt response fields if your backend differs
            set({
              access_token:
                response.accessToken ?? response.access_token ?? null,
              refresh_token:
                response.refreshToken ?? response.refresh_token ?? null,
              loggedInUser: response.userProfile
                ? {
                    id: response.id ?? "",
                    username: response.username ?? username,
                    isActive: response.isActive ?? 1,
                    roles: response.roles ?? [],
                    userProfile: response.userProfile,
                  }
                : undefined,
              loading: false,
              error: null,
            });

            // simple role check example
            const roles: string[] = response.roles ?? [];
            const allowedRoles = ["Administrators", "Landlords", "Users"];
            const hasAllowed = roles.some((r) => allowedRoles.includes(r));
            if (!hasAllowed) {
              set({
                access_token: undefined,
                refresh_token: undefined,
                loggedInUser: undefined,
                error: "No permission",
              });
              if (onError)
                onError("You do not have permission to access this area.");
              return Promise.reject(
                "You do not have permission to access this area."
              );
            }

            if (onSuccess) onSuccess();
          } catch (error: any) {
            // Log the full error for debugging
            console.log('Auth store error details:', {
              error,
              response: error?.response,
              data: error?.response?.data,
              status: error?.response?.status
            });

            // Map common HTTP errors to user-friendly messages
            let message = "Đăng nhập thất bại";
            if (error?.response) {
              const status = error.response.status;
              const data = error.response.data;
              
              // Always check errors array first since that's what the server is sending
              if (Array.isArray(data?.errors) && data.errors.length > 0) {
                // Use the error message directly from the server
                message = data.errors[0];
                console.log('Using error from server:', message);
              } 
            } else if (error?.message) {
              // Network or other errors
              message = error.message;
            }
            
            // Additional debug logging
            console.log('Final error message:', message);

            set({
              error: message,
              access_token: undefined,
              refresh_token: undefined,
              loggedInUser: undefined,
            });
            if (onError) onError(message);
          }
        },

        loginWithGoogle: async (opts: {
          token: string;
          onSuccess?: () => void;
          onError?: (err: any) => void;
        }) => {
          const { token, onSuccess, onError } = opts;
          try {
            set({ loading: true, error: null });

            const response: any = await apiClient.post("/auth/google-login", {
              token,
            });
            console.log("Google login response:", response);

            set({
              access_token: response.accessToken ?? response.access_token ?? null,
              refresh_token: response.refreshToken ?? response.refresh_token ?? null,
              loggedInUser: response.userProfile
                ? {
                    id: response.id ?? "",
                    username: response.username ?? "",
                    isActive: response.isActive ?? 1,
                    roles: response.roles ?? [],
                    userProfile: response.userProfile,
                  }
                : undefined,
              loading: false,
              error: null,
            });

            const roles: string[] = response.roles ?? [];
            const allowedRoles = ["Administrators", "Landlords", "Users"];
            const hasAllowed = roles.some((r) => allowedRoles.includes(r));
            if (!hasAllowed) {
              set({
                access_token: undefined,
                refresh_token: undefined,
                loggedInUser: undefined,
                error: "No permission",
              });
              if (onError) onError("You do not have permission to access this area.");
              return Promise.reject("You do not have permission to access this area.");
            }

            if (onSuccess) onSuccess();
          } catch (error: any) {
            console.log('Google login error details:', {
              error,
              response: error?.response,
              data: error?.response?.data,
              status: error?.response?.status
            });

            let message = "Google login failed";
            if (error?.response) {
              const data = error.response.data;
              if (Array.isArray(data?.errors) && data.errors.length > 0) {
                message = data.errors[0];
              } else if (data?.message) {
                message = data.message;
              }
            }

            console.log('Final Google login error message:', message);
            
            set({
              error: message,
              access_token: undefined,
              refresh_token: undefined,
              loggedInUser: undefined,
            });
            if (onError) onError(message);
          }
        },

        updateUserProfile: (profile: UserProfile) => {
          set((state) => ({
            loggedInUser: state.loggedInUser ? {
              ...state.loggedInUser,
              userProfile: profile
            } : state.loggedInUser
          }));
        },

        logOut: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          set({
            access_token: undefined,
            refresh_token: undefined,
            loggedInUser: undefined,
            error: null,
          });
        },
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  )
);

export default useAuthStore;
