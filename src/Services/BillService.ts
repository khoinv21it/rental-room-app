import apiClient from "../lib/apiClient";
import { Bill } from "../types/types";
import { API_URL } from "./Constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const fetchBillDetails = async (
  contractId: string
): Promise<Bill[] | null> => {
  try {
    const res: any = await apiClient.get(`/bills/contract/${contractId}`);
    return res;
  } catch (error) {
    console.error("fetchBillDetails error:", error);
    return null;
  }
}

export const downloadBillProof = async (billId: string): Promise<string | null> => {
  try {
    // Get the access token to append to URL for authentication
    const authStorage = await AsyncStorage.getItem("auth-storage");
    const token = authStorage ? JSON.parse(authStorage)?.state?.access_token : null;
    
    // Construct the PDF download URL
    let pdfUrl = `${API_URL}/bills/${billId}/download`;
    
    // Add token as query parameter if available (for authentication in browser)
    if (token) {
      pdfUrl += `?token=${encodeURIComponent(token)}`;
    }
    
    return pdfUrl;
  }
  catch (error) {
    console.error("downloadBillProof error:", error);
    return null;
  }
}