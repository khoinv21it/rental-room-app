import apiClient from "../lib/apiClient";

export async function fetchRoomVip(page = 0, size = 6) {
  try {
    const res = await apiClient.get(`/rooms/allroom-vip?page=${page}&size=${size}`);
    return res;
  } catch (error) {
    console.error("fetchRoomVip error:", error);
    throw error;
  }
}


export async function fetchRoomNormal(page = 0, size = 6) {
  try {
    const res = await apiClient.get(`/rooms/allroom-normal?page=${page}&size=${size}`);
    return res; 
  } catch (error) {
    console.error("fetchRoomNormal error:", error);
    throw error;
  }
}