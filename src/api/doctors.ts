import { api } from "./dashboard";

export interface TimeSlot {
  session: string;
  from: string; // HH:mm format
  to: string; // HH:mm format
}

export interface DaySchedule {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  timeSlots: TimeSlot[];
}

export interface Education {
  degree: string;
  university: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export interface Award {
  name: string;
  from: string; // YYYY-MM-DD
}

export interface Doctor {
  _id?: string;
  id?: string;
  Name_Designation: string;
  img?: string;
  role?: string;
  Department?: string;
  Phone: string;
  Email: string;
  Fees?: string;
  Status: "Available" | "Unavailable";
  
  // Extended fields from form
  username?: string;
  dob?: string;
  yearOfExperience?: string;
  medicalLicenseNumber?: string;
  languageSpoken?: string[];
  bio?: string;
  featureOnWebsite?: boolean;
  bloodGroup?: string;
  gender?: string;
  
  // Address
  address1?: string;
  address2?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  
  // Schedule
  schedules?: DaySchedule[];
  
  // Schedule metadata for DoctorSchedule model
  scheduleLocation?: string;
  scheduleFromDate?: string; // ISO date string
  scheduleToDate?: string; // ISO date string
  scheduleRecursEvery?: string; // e.g., "1 Week", "1 Month"
  
  // Appointment info
  appointmentType?: string;
  acceptBookingsInAdvance?: string; // days
  appointmentDuration?: string; // minutes
  consultationCharge?: string;
  maxBookingsPerSlot?: string;
  displayOnBookingPage?: boolean;
  
  // Education, Awards, Certifications
  education?: Education[];
  awards?: Award[];
  certifications?: Award[];
  
  // Additional fields
  [key: string]: any;
}

export interface DoctorResponse {
  data?: Doctor[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const fetchDoctors = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<DoctorResponse | Doctor[]> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  
  const queryString = queryParams.toString();
  const url = `/doctors${queryString ? `?${queryString}` : ""}`;
  const { data } = await api.get<DoctorResponse | Doctor[]>(url);
  
  // Backend returns paginated response, so return as-is
  return data;
};

export const fetchDoctorById = async (id: string): Promise<Doctor> => {
  const { data } = await api.get<Doctor>(`/doctors/${id}`);
  return data;
};

export const createDoctor = async (doctorData: Partial<Doctor>): Promise<Doctor> => {
  // Remove id field if present - backend uses MongoDB's _id
  const { id: _ignoredId, ...cleanDoctorData } = doctorData;
  const { data } = await api.post<Doctor>("/doctors", cleanDoctorData);
  return data;
};

export const updateDoctor = async (id: string, doctorData: Partial<Doctor>): Promise<Doctor> => {
  const { data } = await api.patch<Doctor>(`/doctors/${id}`, doctorData);
  return data;
};

export const deleteDoctor = async (id: string): Promise<void> => {
  await api.delete(`/doctors/${id}`);
};
