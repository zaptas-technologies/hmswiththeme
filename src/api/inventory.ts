import { api } from "./dashboard";

export interface Inventory {
  _id?: string;
  id?: string;
  Item_Name: string;
  Item_Code?: string;
  Category?: string;
  Manufacturer?: string;
  Batch_Number?: string;
  Expiry_Date: Date | string;
  Quantity: number;
  Unit?: string;
  Unit_Price?: number;
  Total_Value?: number;
  Location?: string;
  Supplier?: string;
  Status: "Available" | "Low Stock" | "Out of Stock" | "Expired";
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

export interface InventoryListResponse {
  data: Inventory[];
  pagination: Pagination;
}

export const fetchInventory = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  category?: string;
  hospitalId?: string;
}): Promise<InventoryListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.category) queryParams.append("category", params.category);
  if (params?.hospitalId) queryParams.append("hospitalId", params.hospitalId);

  const queryString = queryParams.toString();
  const url = `/inventory${queryString ? `?${queryString}` : ""}`;
  const { data } = await api.get<InventoryListResponse>(url);
  return data;
};

export const fetchInventoryById = async (id: string): Promise<Inventory> => {
  const { data } = await api.get<Inventory>(`/inventory/${id}`);
  return data;
};

export const createInventory = async (
  inventoryData: Partial<Inventory>
): Promise<Inventory> => {
  // Remove id field if present - backend uses MongoDB's _id
  const { id: _ignoredId, ...cleanInventoryData } = inventoryData;
  const { data } = await api.post<Inventory>("/inventory", cleanInventoryData);
  return data;
};

export const updateInventory = async (
  id: string,
  inventoryData: Partial<Inventory>
): Promise<Inventory> => {
  const { data } = await api.patch<Inventory>(`/inventory/${id}`, inventoryData);
  return data;
};

export const deleteInventory = async (id: string): Promise<void> => {
  await api.delete(`/inventory/${id}`);
};

export interface MedicineSearchResult {
  inventoryId?: string;
  value: string;
  label: string;
  code: string;
  category: string;
  manufacturer: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  status: string;
  expiryDate?: string;
  batchNumber?: string;
  details: {
    inventoryId?: string;
    code: string;
    category: string;
    manufacturer: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    status: string;
    expiryDate?: string;
    batchNumber?: string;
  };
}

export interface MedicineSearchResponse {
  data: MedicineSearchResult[];
  count: number;
}

export const searchMedicines = async (
  search: string,
  limit: number = 20,
  hospitalId?: string
): Promise<MedicineSearchResponse> => {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (limit) queryParams.append("limit", limit.toString());
  if (hospitalId) queryParams.append("hospitalId", hospitalId);

  const queryString = queryParams.toString();
  const url = `/inventory/search/medicines${queryString ? `?${queryString}` : ""}`;
  const { data } = await api.get<MedicineSearchResponse>(url);
  return data;
};
