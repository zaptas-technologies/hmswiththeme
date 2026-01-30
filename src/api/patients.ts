import { api } from "./dashboard";

export interface Patient {
  _id?: string;
  id?: string;
  Patient: string;
  Gender?: string;
  Patient_img?: string;
  Doctor_img?: string;
  Phone: string;
  Email?: string;
  Doctor?: string;
  Role?: string;
  Address?: string;
  Last_Visit?: string;
  Status: "Available" | "Unavailable";
  [key: string]: any;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PatientListResponse {
  data: Patient[];
  pagination: Pagination;
}

export const fetchPatients = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  phone?: string;
  status?: string;
}): Promise<PatientListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.phone) queryParams.append("phone", params.phone);
  if (params?.status) queryParams.append("status", params.status);

  const queryString = queryParams.toString();
  const url = `/patients${queryString ? `?${queryString}` : ""}`;
  const { data } = await api.get<PatientListResponse>(url);
  return data;
};

export const fetchPatientById = async (id: string): Promise<Patient> => {
  const { data } = await api.get<Patient>(`/patients/${id}`);
  return data;
};

export const createPatient = async (
  patientData: Partial<Patient>
): Promise<Patient> => {
  // Remove id field if present - backend uses MongoDB's _id
  const { id: _ignoredId, ...cleanPatientData } = patientData;
  const { data } = await api.post<Patient>("/patients", cleanPatientData);
  return data;
};

export const updatePatient = async (
  id: string,
  patientData: Partial<Patient>
): Promise<Patient> => {
  const { data } = await api.get<Patient>(`/patients/${id}/update`, {
    params: { data: JSON.stringify(patientData) },
  });
  return data;
};

export const deletePatient = async (id: string): Promise<void> => {
  await api.delete(`/patients/${id}`);
};
