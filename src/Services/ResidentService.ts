import apiClient from "../lib/apiClient";

// Get list of residents for the tenant

export async function getByTenant(tenantId: string): Promise<any[]> {
  try {
    console.log("Fetching residents for tenant:", tenantId);
    const response: any = await apiClient.get(
      `/temporary-residences/tenant/${tenantId}`
    );
    console.log("Residents fetched:", response?.length || 0);
    return response || [];
  } catch (error: any) {
    console.error("Error fetching residents by tenant:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch residents by tenant"
    );
  }
}

/**
 * Get specific resident by ID
 * returns Resident details
 */
export async function getById(residentId: string): Promise<any> {
  try {
    console.log("Fetching resident by ID:", residentId);
    const response: any = await apiClient.get(
      `/temporary-residences/${residentId}`
    );
    console.log("Resident detail response:", response);
    return response;
  } catch (error: any) {
    console.error("Error fetching resident by ID:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch resident"
    );
  }
}

export async function createResident(
  contractId: string,
  residentData: any,
  frontImageUri?: string,
  backImageUri?: string
): Promise<any> {
  try {
    const formData = new FormData();

    // Prepare resident data
    const dataToSend = {
      fullName: residentData.fullName,
      idNumber: residentData.idNumber,
      relationship: residentData.relationship,
      startDate: residentData.startDate,
      endDate: residentData.endDate,
      note: residentData.note || "",
      status: residentData.status || "PENDING",
      contractId: contractId,
    };

    console.log("Creating resident with data:", dataToSend);

    // Add JSON data as a blob-like object with proper content type
    const jsonString = JSON.stringify(dataToSend);

    // Create a blob-like object for React Native
    formData.append("data", {
      string: jsonString,
      type: "application/json",
    } as any);

    // Add front image if provided
    if (frontImageUri) {
      const frontFilename = frontImageUri.split("/").pop() || "front_image.jpg";
      const frontMatch = /\.(\w+)$/.exec(frontFilename);
      const frontType = frontMatch ? `image/${frontMatch[1]}` : "image/jpeg";

      formData.append("frontImage", {
        uri: frontImageUri,
        name: frontFilename,
        type: frontType,
      } as any);
    }

    // Add back image if provided
    if (backImageUri) {
      const backFilename = backImageUri.split("/").pop() || "back_image.jpg";
      const backMatch = /\.(\w+)$/.exec(backFilename);
      const backType = backMatch ? `image/${backMatch[1]}` : "image/jpeg";

      formData.append("backImage", {
        uri: backImageUri,
        name: backFilename,
        type: backType,
      } as any);
    }

    const response: any = await apiClient.post(
      `/temporary-residences`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Resident created successfully:", response);
    return response;
  } catch (error: any) {
    console.error("Error creating resident:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to create resident"
    );
  }
}

export async function updateResident(
  residentId: string,
  contractId: string,
  residentData: any,
  frontImageUri?: string,
  backImageUri?: string
): Promise<any> {
  try {
    const formData = new FormData();

    // Prepare resident data
    const dataToSend = {
      fullName: residentData.fullName,
      idNumber: residentData.idNumber,
      relationship: residentData.relationship,
      startDate: residentData.startDate,
      endDate: residentData.endDate,
      note: residentData.note || "",
      status: residentData.status || "PENDING",
      contractId: contractId,
    };

    console.log("Updating resident with data:", dataToSend);

    // Add JSON data as a blob-like object with proper content type
    const jsonString = JSON.stringify(dataToSend);

    // Create a blob-like object for React Native
    formData.append("data", {
      string: jsonString,
      type: "application/json",
    } as any);

    // Add front image if provided
    if (frontImageUri) {
      const frontFilename = frontImageUri.split("/").pop() || "front_image.jpg";
      const frontMatch = /\.(\w+)$/.exec(frontFilename);
      const frontType = frontMatch ? `image/${frontMatch[1]}` : "image/jpeg";

      formData.append("frontImage", {
        uri: frontImageUri,
        name: frontFilename,
        type: frontType,
      } as any);
    }

    // Add back image if provided
    if (backImageUri) {
      const backFilename = backImageUri.split("/").pop() || "back_image.jpg";
      const backMatch = /\.(\w+)$/.exec(backFilename);
      const backType = backMatch ? `image/${backMatch[1]}` : "image/jpeg";

      formData.append("backImage", {
        uri: backImageUri,
        name: backFilename,
        type: backType,
      } as any);
    }

    const response: any = await apiClient.put(
      `/temporary-residences/${residentId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Resident updated successfully:", response);
    return response;
  } catch (error: any) {
    console.error("Error updating resident:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to update resident"
    );
  }
}

export async function deleteResident(residentId: string): Promise<void> {
  try {
    console.log("Deleting resident:", residentId);
    await apiClient.delete(`/temporary-residences/${residentId}`);
    console.log("Resident deleted successfully");
  } catch (error: any) {
    console.error("Error deleting resident:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to delete resident"
    );
  }
}

export async function fileToBase64(imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting file to base64:", error);
    throw new Error("Failed to convert image to base64");
  }
}
