import apiClient from "../lib/apiClient";
import useFavoriteStore from "../Stores/useFavoriteStore";

// Fetch a page of favorited rooms (returns content, page, totalPages)
export async function fetchFavoriteRooms(page = 0, size = 6) {
  try {
    const res = await apiClient.get(`/favorites?page=${page}&size=${size}`);
    // apiClient returns response.data already via interceptor, but here backend likely returns a paginated object
    return res; // expected: { content: Room[], page: number, totalPages: number }
  } catch (error) {
    console.error("fetchFavoriteRooms error:", error);
    throw error;
  }
}

export async function fetchAndUpdateFavorites() {
  const store = useFavoriteStore.getState();
  if (store.isLoading) return;
  store.setLoading(true);
  try {
    // Fetch first page with large size to get all IDs
    let page = 0;
    const pageSize = 100;
    const first: any = await apiClient.get(
      `/favorites?page=${page}&size=${pageSize}`
    );
    const totalPages = first?.totalPages ?? 1;
    let ids: string[] = (first?.content || [])
      .map((r: any) => r.id)
      .filter(Boolean);

    for (page = 1; page < totalPages; page++) {
      const p: any = await apiClient.get(
        `/favorites?page=${page}&size=${pageSize}`
      );
      ids = ids.concat(
        (p?.content || []).map((r: any) => r.id).filter(Boolean)
      );
    }

    store.setFavoriteRoomIds(ids);
  } catch (error) {
    console.error("fetchAndUpdateFavorites error:", error);
  } finally {
    store.setLoading(false);
  }
}

export async function addFavorite(roomId: string) {
  try {
    const res = await apiClient.post(`/favorites/rooms/${roomId}`);
    useFavoriteStore.getState().addFavorite(roomId);
    return true;
  } catch (error) {
    console.error("addFavorite error:", error);
    return false;
  }
}

export async function removeFavorite(roomId: string) {
  try {
    const res = await apiClient.delete(`/favorites/rooms/${roomId}`);
    useFavoriteStore.getState().removeFavorite(roomId);
    return true;
  } catch (error) {
    console.error("removeFavorite error:", error);
    return false;
  }
}

// Fetch all favorite IDs across all pages (useful to sync store)
export async function getAllFavoriteIds(): Promise<string[]> {
  try {
    const pageSize = 100;
    let page = 0;
    const first: any = await apiClient.get(
      `/favorites?page=${page}&size=${pageSize}`
    );
    const totalPages = first?.totalPages ?? 1;
    let ids: string[] = (first?.content || [])
      .map((r: any) => r.id)
      .filter(Boolean);

    for (page = 1; page < totalPages; page++) {
      const p: any = await apiClient.get(
        `/favorites?page=${page}&size=${pageSize}`
      );
      ids = ids.concat(
        (p?.content || []).map((r: any) => r.id).filter(Boolean)
      );
    }

    return ids;
  } catch (error) {
    console.error("getAllFavoriteIds error:", error);
    return [];
  }
}

// Get favorite count for a room (returns number or 0)
export async function getFavoriteCount(roomId?: string): Promise<number> {
  try {
    const res: any = await apiClient.get(`/favorites/rooms/${roomId}/count`);
    // backend may return number or object
    if (typeof res === "number") return res;
    if (res && typeof res.count === "number") return res.count;
    return 0;
  } catch (error) {
    console.error("getFavoriteCount error:", error);
    return 0;
  }
}

// Initialize favorites store if not already initialized
export async function initializeFavorites(): Promise<void> {
  try {
    const store = useFavoriteStore.getState();
    if (!store.isInitialized) {
      await fetchAndUpdateFavorites();
    }
  } catch (error) {
    console.error("initializeFavorites error:", error);
  }
}
