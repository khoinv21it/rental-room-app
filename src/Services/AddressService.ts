import apiClient from "../lib/apiClient";

export async function getProvinces()  {
    return await apiClient.get(`/provinces`);
   
}

export async function getDistricts(provinceId: string) {
    return await apiClient.get(`/districts/${provinceId}`);
}

export async function getWards(districtId: string) {
    return await apiClient.get(`/wards/${districtId}`);
}