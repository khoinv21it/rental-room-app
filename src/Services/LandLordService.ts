import apiClient from "../lib/apiClient";

export async function getLandlordByRoomId(roomId: string ) {
    return apiClient.get(`/rooms/landlord-room/${roomId}`);

}