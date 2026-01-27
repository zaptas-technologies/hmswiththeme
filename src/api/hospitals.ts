import { api } from "./dashboard";

export interface HospitalAdmin {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface Hospital {
  _id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
  hospitalAdmin?: HospitalAdmin | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HospitalResponse {
  success: boolean;
  data: Hospital | Hospital[];
  count?: number;
  message?: string;
}

export interface HospitalRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  status?: "Active" | "Inactive";
  hospitalAdminEmail?: string;
  hospitalAdminName?: string;
  hospitalAdminPassword?: string;
  hospitalAdminPhone?: string;
}

export const fetchHospitals = async (): Promise<Hospital[]> => {
  const { data } = await api.get<HospitalResponse>("/hospitals");
  if (Array.isArray(data.data)) {
    return data.data;
  }
  return [data.data];
};

export const fetchHospitalById = async (id: string): Promise<Hospital> => {
  const { data } = await api.get<HospitalResponse>(`/hospitals/${id}`);
  return data.data as Hospital;
};

export const createHospital = async (hospitalData: HospitalRequest): Promise<Hospital> => {
  const { data } = await api.post<HospitalResponse>("/hospitals", hospitalData);
  return data.data as Hospital;
};

export const updateHospital = async (id: string, hospitalData: Partial<HospitalRequest>): Promise<Hospital> => {
  const { data } = await api.patch<HospitalResponse>(`/hospitals/${id}`, hospitalData);
  return data.data as Hospital;
};

export const deleteHospital = async (id: string): Promise<void> => {
  await api.delete(`/hospitals/${id}`);
};
