import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

/** API origin (e.g. http://localhost:4000 or https://api.yourdomain.com). Use for building upload URLs from paths stored in DB. */
export const getApiOrigin = (): string => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "http://localhost:4000";
  }
};

/** Build display URL for doctor/upload image. DB stores path (e.g. /uploads/doctors/xxx.png); full URLs supported for legacy. */
export const getDoctorImageSrc = (img: string | undefined, defaultSrc = "assets/img/doctors/doctor-01.jpg"): string => {
  if (!img) return defaultSrc;
  if (img.startsWith("/uploads/")) return getApiOrigin() + img;
  if (/^https?:\/\//i.test(img)) return img;
  return img.startsWith("assets/") ? img : `assets/img/doctors/${img}`;
};

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
  revenue: {
    amount: number;
    hospitalRevenue: number;
    pharmacyRevenue: number;
    change: number;
    sparkline: number[];
  };
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

export type DoctorPerformanceItem = {
  id: string;
  name: string;
  role: string;
  img: string;
  department?: string;
  bookings: number;
  revenue: number;
};

export type PatientPerformanceItem = {
  id: string;
  name: string;
  phone?: string;
  img?: string;
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
  | "allAppointments"
  | "doctorsList"
  | "patientsList";

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
  /** Revenue from appointments (consultation fees) for this branch */
  hospitalRevenue: number;
  /** Revenue from pharmacy dispenses for this branch */
  pharmacyRevenue: number;
};

export type SuperAdminDashboardResponse = {
  generatedAt: string;
  totals: {
    branches: number;
    hospitalAdmins: number;
    doctors: number;
    patients: number;
    appointments: number;
    /** Total revenue (hospital + pharmacy) */
    revenue: number;
    /** Revenue from appointments (consultation fees) */
    hospitalRevenue: number;
    /** Revenue from pharmacy dispenses */
    pharmacyRevenue: number;
  };
  branches: SuperAdminBranchRow[];
};

export const fetchSuperAdminDashboard = async (): Promise<SuperAdminDashboardResponse> => {
  const { data } = await api.get<SuperAdminDashboardResponse>("/dashboard/super-admin");
  return data;
};

// ---- Reports & Transactions (hospital_admin + super_admin) ----
export type TransactionType = "hospital" | "pharmacy";
export type TransactionItem = {
  id: string;
  type: TransactionType;
  source: string;
  reference: string;
  amount: number;
  date: string;
  patientName?: string;
  paymentMethod?: string;
  createdAt: string;
};

export type TransactionsResponse = {
  list: TransactionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TransactionsFilters = {
  hospitalId?: string;
  period?: DashboardPeriod;
  dateFrom?: string;
  dateTo?: string;
  type?: "all" | "hospital" | "pharmacy";
  page?: number;
  limit?: number;
};

export const fetchTransactions = async (
  filters?: TransactionsFilters
): Promise<TransactionsResponse> => {
  const params = new URLSearchParams();
  if (filters?.hospitalId) params.set("hospitalId", filters.hospitalId);
  if (filters?.period) params.set("period", filters.period);
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  if (filters?.type) params.set("type", filters.type ?? "all");
  if (filters?.page != null) params.set("page", String(filters.page));
  if (filters?.limit != null) params.set("limit", String(filters.limit));
  const { data } = await api.get<TransactionsResponse>(`/dashboard/transactions?${params.toString()}`);
  return data;
};

export type ReportsSummaryResponse = {
  period: string;
  dateFrom?: string;
  dateTo?: string;
  appointmentStatistics: {
    all: number;
    completed: number;
    cancelled: number;
    scheduled: number;
    reschedule: number;
  };
  revenue: { hospitalRevenue: number; pharmacyRevenue: number; total: number };
  topDepartments: Array<{ name: string; count: number; revenue: number }>;
};

export type ReportsFilters = {
  hospitalId?: string;
  period?: DashboardPeriod;
  dateFrom?: string;
  dateTo?: string;
};

export const fetchReports = async (
  filters?: ReportsFilters
): Promise<ReportsSummaryResponse> => {
  const params = new URLSearchParams();
  if (filters?.hospitalId) params.set("hospitalId", filters.hospitalId);
  if (filters?.period) params.set("period", filters.period ?? "last30days");
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  const { data } = await api.get<ReportsSummaryResponse>(`/dashboard/reports?${params.toString()}`);
  return data;
};

export type InventoryReportBatchEntry = {
  grn: string;
  date: string;
  qty: number;
  batch: string;
  expiry: string;
};

export type InventoryReportOutLine = {
  batch: string;
  expiry: string;
  quantity: number;
  value: number;
};

export type InventoryReportRow = {
  itemName: string;
  quantity: number;
  value: number;
  batches?: InventoryReportBatchEntry[];
};

export type InventoryReportResponse = {
  period: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  in: InventoryReportRow[];
  out: Array<{
    itemName: string;
    quantity: number;
    value: number;
    lines?: InventoryReportOutLine[];
  }>;
  summary: Array<{
    itemName: string;
    inQuantity: number;
    inValue: number;
    outQuantity: number;
    outValue: number;
    inBatches?: InventoryReportBatchEntry[];
    outLines?: InventoryReportOutLine[];
  }>;
};

export type InventoryReportFilters = {
  hospitalId?: string;
  period?: DashboardPeriod;
  dateFrom?: string;
  dateTo?: string;
  /** Filter by medicine name - shows all in/out for that medicine with batch and expiry */
  search?: string;
};

export const fetchInventoryReport = async (
  filters?: InventoryReportFilters
): Promise<InventoryReportResponse> => {
  const params = new URLSearchParams();
  if (filters?.hospitalId) params.set("hospitalId", filters.hospitalId);
  if (filters?.period) params.set("period", filters.period ?? "last30days");
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  if (filters?.search) params.set("search", filters.search.trim());
  const { data } = await api.get<InventoryReportResponse>(`/dashboard/inventory-report?${params.toString()}`);
  return data;
};