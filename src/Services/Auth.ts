import apiClient from "../lib/apiClient";

export const changePassword = async (userId: string, password: string, newPassword: string) => {
return apiClient.patch(`/auth/change-password`, {
    userId,
    password,
    newPassword,
  });
};
