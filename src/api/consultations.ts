import { api } from "./dashboard";

export interface ConsultationData {
  appointmentId: string;
  vitals?: {
    temperature?: string;
    pulse?: string;
    respiratoryRate?: string;
    spo2?: string;
    height?: string;
    weight?: string;
    bmi?: string;
    waist?: string;
  };
  complaints?: Array<{ complaint: string; duration?: string }>;
  diagnosis?: Array<{ diagnosis: string; type?: string }>;
  medications?: Array<{
    medicine: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    inventoryId?: string;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
    /** Required for medicine tracking */
    batchNumber?: string;
    expiry?: string;
  }>;
  advice?: Array<{ advice: string }>;
  investigations?: Array<{
    investigation: string;
    notes?: string;
  }>;
  followUp?: {
    nextConsultation?: string;
    emptyStomach?: string;
  };
  invoice?: Array<{
    item: string;
    quantity?: number;
    price?: number;
    total?: number;
  }>;
}

export interface AppointmentWithPatient {
  appointment: {
    _id?: string;
    id?: string;
    Date_Time: string;
    Patient: string;
    Phone: string;
    Patient_Image?: string;
    Doctor_Image?: string;
    Doctor: string;
    doctorId?: string;
    role?: string;
    Mode?: string;
    Status: string;
    Fees?: string | number;
    Department?: string;
    Reason?: string;
    Vitals?: any;
    Complaints?: any;
    Diagnosis?: any;
    Medications?: any;
    Advice?: any;
    Investigations?: any;
    FollowUp?: any;
    Invoice?: any;
    [key: string]: any;
  };
  patient: {
    _id?: string;
    id?: string;
    Patient: string;
    Phone: string;
    Email?: string;
    Age?: string;
    Gender?: string;
    Blood_Group?: string;
    Address?: string;
    [key: string]: any;
  } | null;
}

export const fetchAppointmentForConsultation = async (id: string): Promise<AppointmentWithPatient> => {
  const { data } = await api.get<AppointmentWithPatient>(`/consultations/appointment/${id}`);
  return data;
};

export const saveConsultation = async (
  appointmentId: string,
  consultationData: ConsultationData,
  completeAppointment: boolean = false
): Promise<{ message: string; appointment: any }> => {
  const { data } = await api.post<{ message: string; appointment: any }>("/consultations", {
    appointmentId,
    consultationData,
    completeAppointment,
  });
  return data;
};

/** Consultation row for doctor prescriptions list (from Consultation table). */
export interface ConsultationListItem {
  _id?: string;
  id?: string;
  Consultation_ID?: string;
  Prescription_ID?: string;
  Date?: string;
  Prescribed_On?: string;
  Patient?: string;
  Patient_Image?: string;
  Doctor?: string;
  Status?: string;
  Medications?: Array<{
    medicine: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    inventoryId?: string;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
  }>;
  Consultation_Date?: string;
  Completed_At?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConsultationListResponse {
  data: ConsultationListItem[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export const fetchConsultationsList = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  doctor?: string;
  status?: string;
  date?: string;
}): Promise<ConsultationListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.doctor) queryParams.append("doctor", params.doctor);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.date) queryParams.append("date", params.date);
  const qs = queryParams.toString();
  const { data } = await api.get<ConsultationListResponse>(`/consultations${qs ? `?${qs}` : ""}`);
  return data;
};

export const fetchConsultationById = async (id: string): Promise<ConsultationListItem & Record<string, any>> => {
  const { data } = await api.get<ConsultationListItem & Record<string, any>>(`/consultations/${id}`);
  return data;
};
