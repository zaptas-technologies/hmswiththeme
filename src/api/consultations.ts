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
