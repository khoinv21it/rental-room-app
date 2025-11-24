import apiClient from "../lib/apiClient";
import {
  PaginatedResponse,
  RequirementDetail,
  RequirementRequestRoomDto,
  UpdateRequestRoomDto,
} from "../types/types";

// Helper functions to convert between status formats
export const getStatusNumber = (status: string): 0 | 1 | 2 => {
  switch (status) {
    case "pending":
      return 0;
    case "approved":
    case "in-progress":
      return 1;
    case "rejected":
    case "resolved":
      return 2;
    default:
      return 0;
  }
};

export const getStatusString = (status: 0 | 1 | 2): string => {
  switch (status) {
    case 0:
      return "pending";
    case 1:
      return "approved";
    case 2:
      return "rejected";
    default:
      return "pending";
  }
};

export const getStatusColor = (status: 0 | 1 | 2): string => {
  switch (status) {
    case 0:
      return "#FF9800"; // Orange for not processed
    case 1:
      return "#4CAF50"; // Green for completed
    case 2:
      return "#F44336"; // Red for rejected
    default:
      return "#999";
  }
};

export const getStatusText = (status: 0 | 1 | 2): string => {
  switch (status) {
    case 0:
      return "Not Processed";
    case 1:
      return "Completed";
    case 2:
      return "Rejected";
    default:
      return "Unknown";
  }
};

export async function getRequestsByUser(
  userId: string,
  page = 0,
  size = 10
): Promise<PaginatedResponse<RequirementDetail>> {
  try {
    const response: any = await apiClient.get(
      `/requirements/user/${userId}/requests`,
      {
        params: { page, size },
      }
    );

    const normalized: PaginatedResponse<RequirementDetail> = {
      data: response.data || [],
      page: response.pageNumber ?? page,
      size: response.pageSize ?? size,
      totalElements: response.totalRecords ?? 0,
      totalPages: response.totalPages ?? 1,
      totalRecords: response.totalRecords ?? 0,
    };

    return normalized;
  } catch (error: any) {
    console.error("Error fetching user requests:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch requests"
    );
  }
}

export async function updateRequirement(
  requirementId: string,
  data: Partial<UpdateRequestRoomDto>
): Promise<RequirementDetail> {
  try {
    console.log("updateRequirement called with:", { requirementId, data });

    const updateData = {
      id: requirementId,
      description: data.description,
    };

    console.log("Sending JSON update (no image):", updateData);
    const response: any = await apiClient.patch(
      `/requirements/update`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("updateRequirement response:", response);
    return response as RequirementDetail;
  } catch (error: any) {
    console.error("Error updating requirement:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message ||
        "Failed to update requirement"
    );
  }
}

export async function updateRequirementWithImage(
  requirementId: string,
  description: string,
  imageUri?: string
): Promise<RequirementDetail> {
  try {
    const formData = new FormData();

    // Add JSON data as a blob-like object with proper content type
    const updateData: UpdateRequestRoomDto = {
      id: requirementId,
      description: description,
    };

    const jsonString = JSON.stringify(updateData);

    // Create a blob-like object for React Native
    formData.append("data", {
      string: jsonString,
      type: "application/json",
    } as any);

    // Add image if provided
    if (imageUri) {
      const filename = imageUri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      // React Native FormData format
      formData.append("image", {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);
    }

    console.log("Sending update request:", {
      requirementId,
      description,
      hasImage: !!imageUri,
    });
    console.log("JSON payload:", jsonString);

    const token = await getAuthToken();

    const response = await fetch(
      `${apiClient.defaults.baseURL}/requirements/${requirementId}/update-with-image`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - let the browser set it with boundary for multipart/form-data
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          errorData.errors?.[0] ||
          "Failed to update requirement"
      );
    }

    const result = await response.json();
    console.log("Update response:", result);
    return result as RequirementDetail;
  } catch (error: any) {
    console.error("Error updating requirement with image:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to update requirement"
    );
  }
}

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  const { default: useAuthStore } = await import("../Stores/useAuthStore");
  const token = useAuthStore.getState().access_token;
  if (!token) {
    throw new Error("No authentication token available");
  }
  return token;
}

export async function getRequirementsByStatus(
  userId: string,
  status: 0 | 1 | 2,
  page = 0,
  size = 10
): Promise<PaginatedResponse<RequirementDetail>> {
  try {
    console.log("Fetching requirements with status:", {
      userId,
      status,
      page,
      size,
    });

    const response: any = await apiClient.get(
      `/requirements/user/${userId}/requests`,
      {
        params: { page, size, status },
      }
    );

    console.log("Requirements response:", {
      totalRecords: response.totalRecords,
      dataLength: response.data?.length,
      status: status,
    });

    const normalized: PaginatedResponse<RequirementDetail> = {
      data: response.data || [],
      page: response.pageNumber ?? page,
      size: response.pageSize ?? size,
      totalElements: response.totalRecords ?? 0,
      totalPages: response.totalPages ?? 1,
      totalRecords: response.totalRecords ?? 0,
    };

    return normalized;
  } catch (error: any) {
    console.error("Error fetching requirements by status:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch requirements"
    );
  }
}

export async function createRequest(
  data: RequirementRequestRoomDto,
  imageUri?: string
): Promise<RequirementDetail> {
  try {
    const formData = new FormData();

    // Add JSON data as a blob-like object with proper content type
    const jsonString = JSON.stringify(data);

    // Create a blob-like object for React Native
    formData.append("data", {
      string: jsonString,
      type: "application/json",
    } as any);

    // Add image if provided
    if (imageUri) {
      const filename = imageUri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      // React Native FormData format
      formData.append("image", {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);
    }

    console.log("Creating request:", {
      data,
      hasImage: !!imageUri,
    });
    console.log("JSON payload:", jsonString);

    const token = await getAuthToken();

    const response = await fetch(
      `${apiClient.defaults.baseURL}/requirements/request-room-with-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - let the browser set it with boundary for multipart/form-data
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      let errorMsg =
        errorData?.message ||
        errorData?.error ||
        errorData?.errors?.[0] ||
        "Failed to create request";
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg[0];
      }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    console.log("Create request response:", result);
    return result as RequirementDetail;
  } catch (error: any) {
    console.error("Error creating request:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to create request"
    );
  }
}

export type { RequirementDetail };
