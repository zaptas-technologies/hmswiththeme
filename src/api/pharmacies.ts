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
  id?: string;
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

// Pharmacy Dashboard: data from Consultation table (pending = not dispensed, completed = dispensed)
export interface PharmacyDashboardConsultation {
  id: string;
  _id: string;
  Consultation_ID?: string;
  Appointment_ID?: string;
  Patient: string;
  Doctor: string;
  Status: string;
  Medications?: Array<{ medicine: string; dosage?: string; frequency?: string; duration?: string; quantity?: number; unitPrice?: number; inventoryId?: string; batchNumber?: string; expiry?: string }>;
  Consultation_Date?: string;
  Completed_At?: string;
  createdAt?: string;
  fulfilledBy?: {
    id: string;
    amountReceived: number;
    paymentMethod: string;
    dispensedAt: string;
  } | null;
}

export interface PharmacyDashboardStats {
  pendingCount: number;
  completedCount: number;
  completedTodayCount: number;
}

export interface PharmacyDashboardPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PharmacyDashboardResponse {
  hospital: { id: string; name: string; city?: string; state?: string } | null;
  stats: PharmacyDashboardStats;
  consultations: PharmacyDashboardConsultation[];
  pagination: PharmacyDashboardPagination;
}

export interface FetchPharmacyDashboardParams {
  page?: number;
  limit?: number;
  search?: string;
  tab?: "all" | "pending" | "completed";
}

/** Pharmacy dashboard: list from Consultation table only (pending = not dispensed, completed = dispensed). */
export const fetchPharmacyDashboard = async (
  params?: FetchPharmacyDashboardParams
): Promise<PharmacyDashboardResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page != null) queryParams.append("page", String(params.page));
  if (params?.limit != null) queryParams.append("limit", String(params.limit));
  if (params?.search != null && params.search !== "") queryParams.append("search", params.search);
  if (params?.tab != null) queryParams.append("tab", params.tab);
  const qs = queryParams.toString();
  const url = `/pharmacies/dashboard${qs ? `?${qs}` : ""}`;
  const { data } = await api.get<PharmacyDashboardResponse>(url);
  return data;
};

export interface ConsultationPriceLineItem {
  medicine: string;
  dosage?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  inventoryId?: string;
  /** Batch number (required for dispense) */
  batchNumber?: string | null;
  /** Expiry date (YYYY-MM-DD, required for dispense) */
  expiry?: string | null;
}

export interface ConsultationPriceBreakdown {
  lineItems: ConsultationPriceLineItem[];
  total: number;
}

export const fetchConsultationPriceBreakdown = async (consultationId: string): Promise<ConsultationPriceBreakdown> => {
  const { data } = await api.get<ConsultationPriceBreakdown>(`/pharmacies/consultations/${consultationId}/price-breakdown`);
  return data;
};

/** Prescription price breakdown (for pharmacy invoice page). Uses prescriptions API. */
export const fetchPrescriptionPriceBreakdown = async (prescriptionId: string): Promise<ConsultationPriceBreakdown> => {
  const { data } = await api.get<ConsultationPriceBreakdown>(`/prescriptions/${prescriptionId}/price-breakdown`);
  return data;
};

export interface FulfillConsultationPayload {
  amountReceived: number;
  paymentMode?: string;
  lineItems?: Array<{ medicine: string; dosage?: string; quantity: number; unitPrice: number; subtotal: number; inventoryId?: string; batchNumber?: string | null; expiry?: string | null }>;
}

export const fulfillConsultation = async (
  consultationId: string,
  payload: FulfillConsultationPayload
): Promise<{ id: string; consultationId: string; patientName: string; doctorName: string; amountReceived: number; paymentMethod: string; medications: ConsultationPriceLineItem[]; createdAt: string }> => {
  const { data } = await api.post(`/pharmacies/fulfill`, { consultationId, ...payload });
  return data;
};
