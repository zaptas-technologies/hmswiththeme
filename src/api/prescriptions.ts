import { api } from "./dashboard";

export interface Prescription {
  _id?: string;
  id?: string;
  Prescription_ID?: string;
  Date?: string;
  Prescribed_On?: string;
  Patient?: string;
  Patient_Image?: string;
  img?: string;
  phone_number?: string;
  Doctor?: string;
  Medicine?: string;
  Status?: string;
  Amount?: string | number;
  [key: string]: any;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PrescriptionListResponse {
  data: Prescription[];
  pagination: Pagination;
}

export const fetchPrescriptions = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  doctor?: string;
  patient?: string;
  status?: string;
  date?: string;
}): Promise<PrescriptionListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.doctor) queryParams.append("doctor", params.doctor);
  if (params?.patient) queryParams.append("patient", params.patient);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.date) queryParams.append("date", params.date);

  const queryString = queryParams.toString();
  const url = `/prescriptions${queryString ? `?${queryString}` : ""}`;
  
  try {
    const { data } = await api.get<PrescriptionListResponse>(url);
    return data;
  } catch (error: any) {
    // If endpoint doesn't exist, return empty data for development
    if (error?.response?.status === 404) {
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
        },
      };
    }
    throw error;
  }
};

export const fetchPrescriptionById = async (id: string): Promise<Prescription> => {
  const { data } = await api.get<Prescription>(`/prescriptions/${id}`);
  return data;
};

export const createPrescription = async (
  prescriptionData: Partial<Prescription>
): Promise<Prescription> => {
  if (!prescriptionData.id && !prescriptionData.Prescription_ID) {
    prescriptionData.Prescription_ID = `#PRE${Date.now().toString().slice(-4)}`;
  }
  const { data } = await api.post<Prescription>("/prescriptions", prescriptionData);
  return data;
};

export const updatePrescription = async (
  id: string,
  prescriptionData: Partial<Prescription>
): Promise<Prescription> => {
  const { data } = await api.patch<Prescription>(`/prescriptions/${id}`, prescriptionData);
  return data;
};

export const deletePrescription = async (id: string): Promise<void> => {
  await api.delete(`/prescriptions/${id}`);
};
