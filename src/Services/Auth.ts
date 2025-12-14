import apiClient from "../lib/apiClient";

export const changePassword = async (userId: string, password: string, newPassword: string) => {
return apiClient.patch(`/auth/change-password`, {
    userId,
    password,
    newPassword,
  });
};

export const registerUser = async (fullName: string, email: string, username: string, password: string) => {
  return apiClient.post(`/auth/register`, {
    fullName,
    email,
    username,
    password,
    accountType: 0
  });
};