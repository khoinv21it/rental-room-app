import apiClient from "../lib/apiClient";
import { RequestBooking } from "../types/types";

// Helper function to get auth token and user info
async function getAuthData() {
  const { default: useAuthStore } = await import("../Stores/useAuthStore");
  const state = useAuthStore.getState();
  const token = state.access_token;
  const user = state.loggedInUser;
  if (!token || !user) {
    throw new Error("No authentication token or user available");
  }
  return { token, user };
}

export const creatBooking = async (
  booking: RequestBooking,
  userId?: string
) => {
  return apiClient.post(`bookings/user/${userId}`, booking);
};

export const updateBookingStatus = async (
  bookingId: string,
  statusData: {
    status?: string;
    paymentStatus?: string;
    [key: string]: any;
  }
) => {
  const { user } = await getAuthData();
  const requestBody = {
    ...statusData,
    actorId: user.id,
    actorRole: user.roles?.[0] || "Users",
  };
  return apiClient.patch(`bookings/${bookingId}/status`, requestBody);
};

export const getLandlordPaymentInfo = async (bookingId: string) => {
  return apiClient.get(`bookings/${bookingId}/landlord-payment-info`);
};

export const userFetchBookings = async (
  userId: string,
  page: number = 0,
  size: number = 5,
  sortField?: string,
  sortOrder?: string
) => {
  const params: any = { page, size };
  if (sortField) params.sortField = sortField;
  if (sortOrder) params.sortOrder = sortOrder;

  return apiClient.get(`bookings/user/${userId}/paging`, { params });
};

export const uploadBillTransferImage = async (
  bookingId: string,
  imageUri: string
) => {
  const { token } = await getAuthData();

  const formData = new FormData();
  const filename = imageUri.split("/").pop() || "bill-transfer.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("file", {
    uri: imageUri,
    name: filename,
    type: type,
  } as any);

  const response = await fetch(
    `${apiClient.defaults.baseURL}/bookings/${bookingId}/upload-bill-transfer`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData?.error ||
        errorData?.message ||
        "Failed to upload bill transfer image"
    );
  }

  return response.json();
};
