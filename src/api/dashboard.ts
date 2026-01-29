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
  appointmentId?: string;
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

// Admin Dashboard Types
export type AdminStats = {
  doctors: { count: number; change: number; sparkline: number[] };
  patients: { count: number; change: number; sparkline: number[] };
  appointments: { count: number; change: number; sparkline: number[] };
  revenue: { amount: number; change: number; sparkline: number[] };
};

export type AppointmentStatistics = {
  all: number;
  cancelled: number;
  reschedule: number;
  completed: number;
};

export type PopularDoctor = {
  name: string;
  role: string;
  img: string;
  bookings: number;
};

export type RecentAppointmentItem = {
  id: string;
  doctor: string;
  doctorImg: string;
  patient: string;
  patientImg: string;
  dateTime: string;
  mode: string;
  status: string;
};

export type TopDepartment = {
  name: string;
  count: number;
};

export type ScheduleStats = {
  available: number;
  unavailable: number;
  leave: number;
};

export type IncomeByTreatment = {
  department: string;
  appointments: number;
  revenue: number;
};

export type TopPatientItem = {
  name: string;
  phone: string;
  img: string;
  appointments: number;
  totalPaid: number;
};

export type RecentTransaction = {
  id: string;
  type: string;
  invoice: string;
  amount: number;
  date: string;
};

export type LeaveRequest = {
  id: string;
  doctorName: string;
  doctorImg: string;
  days: number;
  reason: string;
  startDate: string;
  endDate: string;
};

export type ScheduledDoctor = {
  id: string;
  name: string;
  role: string;
  img: string;
  department: string;
};

export type HospitalInfo = {
  id: string;
  name: string;
  city?: string;
  state?: string;
};

export type AdminDashboardResponse = {
  hospital?: HospitalInfo | null;
  stats: AdminStats;
  appointmentStatistics: AppointmentStatistics;
  popularDoctors: PopularDoctor[];
  recentAppointments: RecentAppointmentItem[];
  topDepartments: TopDepartment[];
  scheduleStats: ScheduleStats;
  scheduledDoctors: ScheduledDoctor[];
  incomeByTreatment: IncomeByTreatment[];
  topPatients: TopPatientItem[];
  recentTransactions: RecentTransaction[];
  leaveRequests: LeaveRequest[];
  appointmentTrend: AppointmentTrend;
};

export type DashboardPeriod =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "last6months"
  | "all"
  // backward compatible
  | "weekly"
  | "monthly"
  | "yearly";
export type LeavePeriod = "today" | "week" | "month";
export type AppointmentTypeFilter = "all" | "in-person" | "online";

export type AdminDashboardFilters = {
  period?: DashboardPeriod;
  dateFrom?: string;
  dateTo?: string;
  leavePeriod?: LeavePeriod;
  limit?: number;
  type?: AppointmentTypeFilter;
};

export type DashboardSectionName =
  | "stats"
  | "appointmentStatistics"
  | "popularDoctors"
  | "recentAppointments"
  | "topDepartments"
  | "scheduleStats"
  | "scheduledDoctors"
  | "incomeByTreatment"
  | "topPatients"
  | "recentTransactions"
  | "leaveRequests"
  | "appointmentTrend"
  | "allAppointments";

export const fetchAdminDashboard = async (
  filters?: AdminDashboardFilters
): Promise<AdminDashboardResponse> => {
  const params = new URLSearchParams();
  if (filters?.period) params.set("period", filters.period);
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  if (filters?.leavePeriod) params.set("leavePeriod", filters.leavePeriod);
  if (filters?.limit != null) params.set("limit", String(filters.limit));
  if (filters?.type) params.set("type", filters.type);
  const qs = params.toString();
  const url = qs ? `/dashboard/admin?${qs}` : "/dashboard/admin";
  const { data } = await api.get<AdminDashboardResponse>(url);
  return data;
};

/** Fetch only one section; updates only that part of the dashboard. */
export const fetchAdminDashboardSection = async <K extends DashboardSectionName>(
  section: K,
  filters?: AdminDashboardFilters
): Promise<Record<K, K extends "allAppointments" ? RecentAppointmentItem[] : AdminDashboardResponse[K extends keyof AdminDashboardResponse ? K : never]>> => {
  const params = new URLSearchParams();
  params.set("section", section);
  if (filters?.period) params.set("period", filters.period);
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  if (filters?.leavePeriod) params.set("leavePeriod", filters.leavePeriod);
  if (filters?.limit != null) params.set("limit", String(filters.limit));
  if (filters?.type) params.set("type", filters.type);
  const { data } = await api.get(`/dashboard/admin?${params.toString()}`);
  return data as any;
};

// Super Admin Dashboard Types
export type SuperAdminBranchRow = {
  hospitalId: string;
  name: string;
  city?: string;
  state?: string;
  status?: string;
  admin?: { id: string; name: string; email: string; phone?: string } | null;
  counts: { doctors: number; patients: number; appointments: number };
};

export type SuperAdminDashboardResponse = {
  generatedAt: string;
  totals: {
    branches: number;
    hospitalAdmins: number;
    doctors: number;
    patients: number;
    appointments: number;
    revenue: number;
  };
  branches: SuperAdminBranchRow[];
};

export const fetchSuperAdminDashboard = async (): Promise<SuperAdminDashboardResponse> => {
  const { data } = await api.get<SuperAdminDashboardResponse>("/dashboard/super-admin");
  return data;
};