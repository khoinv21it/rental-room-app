import apiClient from "../lib/apiClient";
import { RequestBooking } from "../types/types";

export const creatBooking = async (booking: RequestBooking, userId?: string) => {
    return apiClient.post(`bookings/user/${userId}`, booking);
};