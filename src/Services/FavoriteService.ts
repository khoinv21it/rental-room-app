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
