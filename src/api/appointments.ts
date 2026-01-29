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
  doctorId?: string; // Doctor's _id for dashboard sync
  role?: string;
  Mode?: string;
  Status: AppointmentStatus;
  Fees?: string | number; // Fee for dashboard sync
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
  // Remove id field if present - backend uses MongoDB's _id
  const { id: _ignoredId, ...cleanAppointmentData } = appointmentData;
  const { data } = await api.post<Appointment>("/appointments", cleanAppointmentData);
  return data;
};

export const updateAppointment = async (
  id: string,
  appointmentData: Partial<Appointment>
): Promise<Appointment> => {
  const { data } = await api.get<Appointment>(`/appointments/${id}/update`, {
    params: { data: JSON.stringify(appointmentData) },
  });
  return data;
};

export const deleteAppointment = async (id: string): Promise<void> => {
  await api.delete(`/appointments/${id}`);
};

export interface AvailableSlot {
  time: string; // HH:mm format
  display: string; // "HH:mm - HH:mm" format
  // When returned from /available-slots, this can be used to
  // visually differentiate already-booked vs free slots.
  isBooked?: boolean;
}

export interface SlotSuggestion {
  date: string; // YYYY-MM-DD format
  day: string;
  timeSlots: Array<{ from: string; to: string }>;
}

export interface AvailableSlotsResponse {
  availableSlots: AvailableSlot[];
  // Slots that are already booked (for clear UX)
  bookedSlots?: AvailableSlot[];
  // Full timeline of slots for the day (both booked & available)
  slots?: AvailableSlot[];
  suggestions: SlotSuggestion[];
  slotDurationMinutes: number;
  daySchedule?: {
    day: string;
    timeSlots: Array<{ from: string; to: string }>;
  };
  message?: string;
}

export const fetchAvailableSlots = async (params: {
  doctorId: string;
  date: string; // YYYY-MM-DD format
  hospitalId?: string;
}): Promise<AvailableSlotsResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append("doctorId", params.doctorId);
  queryParams.append("date", params.date);
  if (params.hospitalId) {
    queryParams.append("hospitalId", params.hospitalId);
  }

  const { data } = await api.get<AvailableSlotsResponse>(
    `/appointments/available-slots?${queryParams.toString()}`
  );
  return data;
};

