import { api } from "./dashboard";

export type AppointmentStatus =
  | "Checked Out"
  | "Checked In"
  | "Cancelled"
  | "Schedule"
  | "Scheduled"
  | "Confirmed"
  | string;

export interface Appointment {
  _id?: string;
  id?: string;
  Date_Time: string;
  Patient: string;
  Phone: string;
  Patient_Image?: string;
  Doctor_Image?: string;
  Doctor: string;
  role?: string;
  Mode?: string;
  Status: AppointmentStatus;
  [key: string]: any;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AppointmentListResponse {
  data: Appointment[];
  pagination: Pagination;
}

export const fetchAppointments = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  mode?: string;
  doctor?: string;
  patient?: string;
}): Promise<AppointmentListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.mode) queryParams.append("mode", params.mode);
  if (params?.doctor) queryParams.append("doctor", params.doctor);
  if (params?.patient) queryParams.append("patient", params.patient);

  const queryString = queryParams.toString();
  const url = `/appointments${queryString ? `?${queryString}` : ""}`;
  const { data } = await api.get<AppointmentListResponse>(url);
  return data;
};

export const fetchAppointmentById = async (id: string): Promise<Appointment> => {
  const { data } = await api.get<Appointment>(`/appointments/${id}`);
  return data;
};

export const createAppointment = async (
  appointmentData: Partial<Appointment>
): Promise<Appointment> => {
  if (!appointmentData.id) {
    appointmentData.id = Date.now().toString();
  }
  const { data } = await api.post<Appointment>("/appointments", appointmentData);
  return data;
};

export const updateAppointment = async (
  id: string,
  appointmentData: Partial<Appointment>
): Promise<Appointment> => {
  const { data } = await api.patch<Appointment>(`/appointments/${id}`, appointmentData);
  return data;
};

export const deleteAppointment = async (id: string): Promise<void> => {
  await api.delete(`/appointments/${id}`);
};

