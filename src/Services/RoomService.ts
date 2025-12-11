import apiClient from "../lib/apiClient";

export async function fetchRoomVip(page = 0, size = 6, userId?: string) {
  try {
    let url = `/rooms/allroom-vip?page=${page}&size=${size}`;
    if (userId) {
      url += `&userId=${userId}`;
    }
    // console.log("🌐 [fetchRoomVip] API URL:", url);
    const res = await apiClient.get(url);
    // console.log("✅ [fetchRoomVip] Full Response:", res);
    // console.log("✅ [fetchRoomVip] Response structure:", {
    //   hasData: !!res,
    //   isArray: Array.isArray(res),
    //   hasDataProp: res && "data" in res,
    //   dataLength: res?.data?.length || (Array.isArray(res) ? res.length : 0),
    //   keys: res ? Object.keys(res) : [],
    // });
    return res;
  } catch (error) {
    console.error("❌ [fetchRoomVip] Error:", error);
    throw error;
  }
}

export async function fetchRoomNormal(page = 0, size = 6, userId?: string) {
  try {
    let url = `/rooms/allroom-normal?page=${page}&size=${size}`;
    if (userId) {
      url += `&userId=${userId}`;
    }
    // console.log("🌐 [fetchRoomNormal] API URL:", url);
    const res = await apiClient.get(url);
    // console.log("✅ [fetchRoomNormal] Full Response:", res);
    // console.log("✅ [fetchRoomNormal] Response structure:", {
    //   hasData: !!res,
    //   isArray: Array.isArray(res),
    //   hasDataProp: res && "data" in res,
    //   dataLength: res?.data?.length || (Array.isArray(res) ? res.length : 0),
    //   keys: res ? Object.keys(res) : [],
    // });
    return res;
  } catch (error) {
    console.error("❌ [fetchRoomNormal] Error:", error);
    throw error;
  }
}

// Fetch VIP rooms with location (for guest users or explicit location search)
export async function fetchRoomVipWithLocation(
  page = 0,
  size = 6,
  latitude?: number,
  longitude?: number
) {
  try {
    let url = `/rooms/allroom-vip?page=${page}&size=${size}`;
    if (latitude !== undefined && longitude !== undefined) {
      url += `&latitude=${latitude}&longitude=${longitude}`;
    }
    const res = await apiClient.get(url);
    return res;
  } catch (error) {
    console.error("fetchRoomVipWithLocation error:", error);
    throw error;
  }
}

// Fetch Normal rooms with location (for guest users or explicit location search)
export async function fetchRoomNormalWithLocation(
  page = 0,
  size = 6,
  latitude?: number,
  longitude?: number
) {
  try {
    let url = `/rooms/allroom-normal?page=${page}&size=${size}`;
    if (latitude !== undefined && longitude !== undefined) {
      url += `&latitude=${latitude}&longitude=${longitude}`;
    }
    const res = await apiClient.get(url);
    return res;
  } catch (error) {
    console.error("fetchRoomNormalWithLocation error:", error);
    throw error;
  }
}

// Smart function - automatically chooses the right API based on user and location
export async function fetchRoomsSmart(
  page = 0,
  size = 6,
  roomType: "VIP" | "NORMAL" = "VIP",
  userId?: string,
  latitude?: number,
  longitude?: number
) {
  console.log("🔍 [fetchRoomsSmart] Called with params:", {
    page,
    size,
    roomType,
    userId,
    latitude,
    longitude,
  });

  try {
    // If user is logged in (has userId), use user-based endpoints
    if (userId) {
      console.log("👤 [fetchRoomsSmart] Using user-based endpoint");
      if (roomType === "VIP") {
        return await fetchRoomVip(page, size, userId);
      } else {
        return await fetchRoomNormal(page, size, userId);
      }
    }

    // If no userId but has location, use location-based endpoints
    if (latitude !== undefined && longitude !== undefined) {
      console.log("📍 [fetchRoomsSmart] Using location-based endpoint");
      if (roomType === "VIP") {
        return await fetchRoomVipWithLocation(page, size, latitude, longitude);
      } else {
        return await fetchRoomNormalWithLocation(
          page,
          size,
          latitude,
          longitude
        );
      }
    }

    // Fallback to basic endpoints
    console.log("🌐 [fetchRoomsSmart] Using basic endpoint");
    if (roomType === "VIP") {
      return await fetchRoomVip(page, size);
    } else {
      return await fetchRoomNormal(page, size);
    }
  } catch (error) {
    console.error("❌ [fetchRoomsSmart] Error:", error);
    throw error;
  }
}

// Filter rooms with various criteria
export async function filterRooms(
  page = 0,
  size = 6,
  filters: {
    provinceId?: string;
    districtId?: string;
    wardId?: string;
    minPrice?: string;
    maxPrice?: string;
    minArea?: string;
    maxArea?: string;
    listConvenientIds?: string[];
  }
) {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    if (filters.provinceId) params.append("provinceId", filters.provinceId);
    if (filters.districtId) params.append("districtId", filters.districtId);
    if (filters.wardId) params.append("wardId", filters.wardId);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.minArea) params.append("minArea", filters.minArea);
    if (filters.maxArea) params.append("maxArea", filters.maxArea);
    if (filters.listConvenientIds && filters.listConvenientIds.length > 0) {
      params.append("listConvenientIds", filters.listConvenientIds.join(","));
    }

    const res = await apiClient.get(`/rooms/filter?${params.toString()}`);
    return res;
  } catch (error) {
    console.error("filterRooms error:", error);
    throw error;
  }
}

// Get rooms in map area
export async function getRoomsInMap(lat: number, lng: number, radius: number) {
  try {
    const res = await apiClient.get(
      `/rooms/map?latitude=${lat}&longitude=${lng}&radius=${radius}`
    );
    return res;
  } catch (error) {
    console.error("getRoomsInMap error:", error);
    throw error;
  }
}

// Unified function to fetch rooms by location for both guest and logged-in users
export async function fetchRoomsByLocation(
  lat: number,
  lng: number,
  address: string,
  userId?: string
): Promise<{
  vipRooms: any;
  normalRooms: any;
  totalRooms: number;
} | null> {
  try {
    console.log("🌍 [fetchRoomsByLocation] Fetching rooms by location:");
    console.log("- Address:", address);
    console.log("- Coordinates:", { lat, lng });
    console.log("- User ID:", userId);

    // Fetch both VIP and Normal rooms in parallel
    const [vipResponse, normalResponse] = await Promise.all([
      fetchRoomVipWithLocation(0, 4, lat, lng),
      fetchRoomNormalWithLocation(0, 6, lat, lng),
    ]);

    console.log("✅ [fetchRoomsByLocation] VIP Response:", vipResponse);
    console.log("✅ [fetchRoomsByLocation] Normal Response:", normalResponse);

    if (vipResponse && normalResponse) {
      // Handle different response formats
      const vipData = Array.isArray(vipResponse)
        ? vipResponse
        : vipResponse.data || [];
      const normalData = Array.isArray(normalResponse)
        ? normalResponse
        : normalResponse.data || [];

      const vipTotal = (vipResponse as any).totalRecords || vipData.length || 0;
      const normalTotal =
        (normalResponse as any).totalRecords || normalData.length || 0;
      const totalRooms = vipTotal + normalTotal;

      console.log("📊 [fetchRoomsByLocation] Total rooms found:", totalRooms);

      return {
        vipRooms: vipResponse,
        normalRooms: normalResponse,
        totalRooms,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ [fetchRoomsByLocation] Error:", error);
    throw error;
  }
}

// Get room by ID
export async function getRoomById(id: string) {
  try {
    const res = await apiClient.get(`/rooms/${id}`);
    return res;
  } catch (error) {
    console.error("getRoomById error:", error);
    throw error;
  }
}

export async function fetchRoomInMap(lat = 0, lng = 0) {
  try {
    const res = await apiClient.get(`/rooms/rooms-in-map?lat=${lat}&lng=${lng}`);
    return res; 
  } catch (error) {
    console.error("fetchRoomInMap error:", error);
    throw error;
  }
}

export async function fetchRoomDetail(roomId: string) {
  try {
    const res = await apiClient.get(`/rooms/${roomId}`);
    return res; 
  } catch (error) {
    console.error("fetchRoomDetail error:", error);
    throw error;
  }
}
