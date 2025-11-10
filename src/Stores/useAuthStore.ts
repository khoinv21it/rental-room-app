/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../lib/apiClient";

export interface UserProfile {
  // fill according to your backend
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
            // Map common HTTP errors to user-friendly messages
            let message = "Đăng nhập thất bại";
            if (error?.response) {
              const status = error.response.status;
              const data = error.response.data;
              if (status === 401) {
                message = "Sai tên đăng nhập hoặc mật khẩu.";
              } else if (status === 403) {
                message = data?.message ?? "Bạn không có quyền truy cập.";
              } else if (status === 404) {
                message = "Tài khoản không tồn tại.";
              } else if (status === 422) {
                message = data?.message ?? "Dữ liệu gửi lên không hợp lệ.";
              } else {
                message = data?.message ?? error.message ?? message;
              }
            } else {
              message = error?.message ?? String(error) ?? message;
            }

            set({
              error: message,
              access_token: undefined,
              refresh_token: undefined,
              loggedInUser: undefined,
            });
            if (onError) onError(message);
          }
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
