import apiClient from "../lib/apiClient";

export async function getUserProfile(profileId: string ) {
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
            'Content-Type': 'multipart/form-data',
        },
    });
}