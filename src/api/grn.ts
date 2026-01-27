import { api } from "./dashboard";

export interface GRNItem {
  inventoryId?: string;
  Item_Name: string;
  Item_Code?: string;
  Batch_Number?: string;
  Expiry_Date: Date | string;
  Quantity: number;
  Unit?: string;
  Unit_Price: number;
  Total_Price: number;
}

export interface GRN {
  _id?: string;
  id?: string;
  GRN_Number: string;
  GRN_Date: Date | string;
  Supplier: string;
  Supplier_Invoice?: string;
  Items: GRNItem[];
  Total_Amount: number;
  Status: "Draft" | "Received" | "Cancelled";
  Received_By?: string;
  Notes?: string;
  hospital?: string;
  user?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface GRNListResponse {
  data: GRN[];
  pagination: Pagination;
}

export const fetchGRN = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  supplier?: string;
  hospitalId?: string;
}): Promise<GRNListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.supplier) queryParams.append("supplier", params.supplier);
  if (params?.hospitalId) queryParams.append("hospitalId", params.hospitalId);

  const queryString = queryParams.toString();
  const url = `/grn${queryString ? `?${queryString}` : ""}`;
  const { data } = await api.get<GRNListResponse>(url);
  return data;
};

export const fetchGRNById = async (id: string): Promise<GRN> => {
  const { data } = await api.get<GRN>(`/grn/${id}`);
  return data;
};

export const createGRN = async (
  grnData: Partial<GRN>
): Promise<GRN> => {
  if (!grnData.id) {
    grnData.id = Date.now().toString();
  }
  if (!grnData.GRN_Number) {
    grnData.GRN_Number = `GRN-${Date.now()}`;
  }
  const { data } = await api.post<GRN>("/grn", grnData);
  return data;
};

export const updateGRN = async (
  id: string,
  grnData: Partial<GRN>
): Promise<GRN> => {
  const { data } = await api.patch<GRN>(`/grn/${id}`, grnData);
  return data;
};

export const deleteGRN = async (id: string): Promise<void> => {
  await api.delete(`/grn/${id}`);
};
