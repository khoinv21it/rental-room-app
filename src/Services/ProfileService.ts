import apiClient from "../lib/apiClient";

export async function getUserProfile(profileId: string) {
  return apiClient.get(`/profile/${profileId}`);
}

export async function updateUserProfile(profileData: any) {
  const formData = new FormData();

  // Append profile data as JSON string
  formData.append("profile", JSON.stringify(profileData.profile));

  // Append avatar file if exists
  if (profileData.avatar) {
    formData.append("avatar", profileData.avatar as any);
  }

  return apiClient.patch(`/profile/update`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// Get user search preferences (matching address)
export async function getUserPreferences(userId: string) {
  try {
    const res = await apiClient.get(`/profile/${userId}/preferences`);
    return res;
  } catch (error) {
    console.error("getUserPreferences error:", error);
    return null;
  }
}

// Update user search preferences
export async function updateUserPreferences(
  userId: string,
  preferences: {
    provinceId?: string;
    districtId?: string;
    wardId?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    latitude?: number;
    longitude?: number;
    searchAddress?: string;
  }
) {
  try {
    console.log(
      "🔄 [updateUserPreferences] Updating preferences for user:",
      userId
    );
    console.log("🔄 [updateUserPreferences] Preferences:", preferences);

    const res = await apiClient.post(
      `/profile/${userId}/preferences`,
      preferences
    );

    console.log(
      "✅ [updateUserPreferences] Preferences updated successfully:",
      res
    );
    return res;
  } catch (error) {
    console.error("❌ [updateUserPreferences] Error:", error);
    throw error;
  }
}

// Get email notifications setting for a user
export async function getEmailNotifications(userId: string) {
  try {
    console.log("📧 [getEmailNotifications] Fetching for userId:", userId);

    const res = await apiClient.get(
      `/profile/email-notifications?userId=${userId}`
    );

    console.log("📧 [getEmailNotifications] Raw response:", res);

    let raw: any;

    // check
    if (
      typeof res === "boolean" ||
      typeof res === "number" ||
      typeof res === "string"
    ) {
      raw = res;
    }
    // Check if response has data property
    else if ((res as any)?.data !== undefined) {
      const data = (res as any).data;
      if (data?.emailNotifications !== undefined) {
        raw = data.emailNotifications;
      }
      else if (
        typeof data === "boolean" ||
        typeof data === "number" ||
        typeof data === "string"
      ) {
        raw = data;
      }
      else if (data?.enabled !== undefined) {
        raw = data.enabled;
      }
    }
    else if ((res as any)?.emailNotifications !== undefined) {
      raw = (res as any).emailNotifications;
    }

    // Normalize various backend representations: boolean, number (1/0), string
    let emailNotifications = false;
    if (typeof raw === "boolean") {
      emailNotifications = raw;
    } else if (typeof raw === "number") {
      emailNotifications = raw === 1;
    } else if (typeof raw === "string") {
      const normalized = raw.trim().toLowerCase();
      emailNotifications =
        normalized === "1" ||
        normalized === "true" ||
        normalized === "yes" ||
        normalized === "on";
    } else if (raw == null || raw === undefined) {
      emailNotifications = false;
    } else {
      // Fallback: convert truthy values to boolean
      emailNotifications = Boolean(raw);
    }

    console.log(
      "✅ [getEmailNotifications] Converted to boolean:",
      emailNotifications
    );

    return { emailNotifications };
  } catch (error) {
    console.error("❌ [getEmailNotifications] Error:", error);
    // Return default value on error
    return { emailNotifications: false };
  }
}

// Set email notifications setting for a user
export async function setEmailNotifications(userId: string, enabled: boolean) {
  try {
    const res = await apiClient.patch(
      `/profile/${userId}/email-notifications`,
      { enabled }
    );

    console.log("✅ [setEmailNotifications] Raw response:", res);

    let updatedValue = enabled; // Default to requested value

    if (typeof res === "boolean") {
      updatedValue = res;
    } else if ((res as any)?.data !== undefined) {
      const data = (res as any).data;
      if (data?.emailNotifications !== undefined) {
        updatedValue = Boolean(data.emailNotifications);
      } else if (data?.enabled !== undefined) {
        updatedValue = Boolean(data.enabled);
      } else if (typeof data === "boolean") {
        updatedValue = data;
      }
    } else if ((res as any)?.emailNotifications !== undefined) {
      updatedValue = Boolean((res as any).emailNotifications);
    } else if ((res as any)?.enabled !== undefined) {
      updatedValue = Boolean((res as any).enabled);
    }

    console.log("✅ [setEmailNotifications] Confirmed value:", updatedValue);

    return { emailNotifications: updatedValue };
  } catch (error) {
    console.error("❌ [setEmailNotifications] Error:", error);
    throw error;
  }
}
