import apiClient from "../lib/apiClient";
import { ListContract } from "../types/types";

// Hàm format ngày từ ISO string sang định dạng dd/MM/yyyy
const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return isoString; // Trả về chuỗi gốc nếu có lỗi
  }
};

export async function fetchListContracts(userId?: string): Promise<ListContract[]> {
  try {
    const res: any = await apiClient.get(`/contracts/tenant/${userId}`);
    
    // Format dates trong response
    if (Array.isArray(res)) {
      return res.map((contract: ListContract) => ({
        ...contract,
        startDate: formatDate(contract.startDate),
        endDate: formatDate(contract.endDate)
      }));
    }
    
    return res || [];
  } catch (error) {
    console.error("fetchListContracts error:", error);
    return [];
  }
}

export async function fetchContractDetail(contractId: string): Promise<any> {
  try {
    const res: any = await apiClient.get(`/contracts/${contractId}`);
    return res;
  } catch (error) {
    console.error("fetchContractDetail error:", error);
    return null;
  }
}