import { api } from "./dashboard";

export interface Pharmacy {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  hospitalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PharmacyResponse {
  data?: Pharmacy[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PharmacyRequest {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

export const fetchPharmacies = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<PharmacyResponse | Pharmacy[]> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  
  const queryString = queryParams.toString();
  const url = `/pharmacies${queryString ? `?${queryString}` : ""}`;
  const { data } = await api.get<PharmacyResponse | Pharmacy[]>(url);
  
  return data;
};

export const fetchPharmacyById = async (id: string): Promise<Pharmacy> => {
  const { data } = await api.get<Pharmacy>(`/pharmacies/${id}`);
  return data;
};

export const createPharmacy = async (pharmacyData: PharmacyRequest): Promise<Pharmacy> => {
  const { id: _ignoredId, ...cleanPharmacyData } = pharmacyData;
  const { data } = await api.post<Pharmacy>("/pharmacies", cleanPharmacyData);
  return data;
};

export const updatePharmacy = async (id: string, pharmacyData: Partial<PharmacyRequest>): Promise<Pharmacy> => {
  const { data } = await api.get<Pharmacy>(`/pharmacies/${id}/update`, {
    params: { data: JSON.stringify(pharmacyData) },
  });
  return data;
};

export const deletePharmacy = async (id: string): Promise<void> => {
  await api.delete(`/pharmacies/${id}`);
};

export const impersonatePharmacy = async (id: string): Promise<{ token: string; user: Pharmacy; impersonated: boolean }> => {
  const { data } = await api.post<{ token: string; user: Pharmacy; impersonated: boolean }>(`/pharmacies/${id}/impersonate`);
  return data;
};

// Pharmacy Dashboard (for pharmacist role – prescriptions & consultations for hospital)
export interface PharmacyDashboardPrescription {
  id: string;
  _id: string;
  Prescription_ID?: string;
  Date?: string;
  Prescribed_On?: string;
  Patient: string;
  Patient_Image?: string;
  Doctor: string;
  Medicine?: string;
  Status: string;
  Dosage?: string;
  Frequency?: string;
  Duration?: string;
  Medications?: Array<{ medicine: string; dosage?: string; frequency?: string; duration?: string; inventoryId?: string }>;
  Appointment_ID?: string;
  consultationId?: string;
  Amount?: number;
  createdAt?: string;
}

export interface PharmacyDashboardConsultation {
  id: string;
  _id: string;
  Appointment_ID?: string;
  Patient: string;
  Doctor: string;
  Status: string;
  Medications?: Array<{ medicine: string; dosage?: string; frequency?: string; duration?: string; inventoryId?: string }>;
  Consultation_Date?: string;
  Completed_At?: string;
  createdAt?: string;
}

export interface PharmacyDashboardResponse {
  hospital: { id: string; name: string; city?: string; state?: string } | null;
  prescriptions: PharmacyDashboardPrescription[];
  consultations: PharmacyDashboardConsultation[];
}

export const fetchPharmacyDashboard = async (): Promise<PharmacyDashboardResponse> => {
  const { data } = await api.get<PharmacyDashboardResponse>("/pharmacies/dashboard");
  return data;
};

export const fulfillPrescription = async (
  prescriptionId: string,
  payload: { amountPaid: number; paymentMode?: string }
): Promise<PharmacyDashboardPrescription> => {
  const { data } = await api.post<PharmacyDashboardPrescription>(`/prescriptions/${prescriptionId}/fulfill`, payload);
  return data;
};
