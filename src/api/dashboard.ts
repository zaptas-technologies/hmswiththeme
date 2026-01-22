import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Set auth token for requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export type HeroCard = {
  id: string;
  title: string;
  value: number;
  deltaPct: number;
  deltaDirection: "up" | "down";
  badgeTone: "success" | "danger" | "warning" | "info";
  spark: { data: number[]; color?: string };
  changeSummary?: string;
};

export type Upcoming = {
  patientName: string;
  patientCode: string;
  visitType: string;
  department: string;
  mode: string;
  datetime: string;
  avatar: string;
};

export type Availability = { day: string; window: string | null };

export type AppointmentTrend = {
  categories: string[];
  total: number[];
  completed: number[];
};

export type Tile = {
  id: string;
  label: string;
  value: number;
  trend: string;
  tone: "success" | "danger" | "warning" | "info";
};

export type AppointmentStats = {
  completed: number;
  pending: number;
  cancelled: number;
};

export type RecentAppointment = {
  id: string;
  patient: { name: string; phone: string; avatar: string };
  datetime: string;
  mode: string;
  status: string;
  fee: number;
};

export type TopPatient = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  appointments: number;
};

export type DashboardResponse = {
  meta: { doctorId: string; generatedAt: string; currency: string };
  heroCards: HeroCard[];
  upcoming: Upcoming;
  availability: Availability[];
  appointmentTrend: AppointmentTrend;
  tiles: Tile[];
  appointmentStats: AppointmentStats;
  recentAppointments: RecentAppointment[];
  topPatients: TopPatient[];
};

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  const { data } = await api.get<DashboardResponse>("/dashboard");
  return data;
};
