import apiClient from "../lib/apiClient";

export async function getUserProfile(profileId: string ) {
    return apiClient.get(`/profile/${profileId}`);

}
  