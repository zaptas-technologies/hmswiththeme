import { api } from "./dashboard";

export type DoctorLeaveStatus = "Applied" | "Approved" | "Rejected";

export interface DoctorLeave {
  _id?: string;
  id?: string;
  Doctor: string;
  Doctor_Id?: string;
  Date: string; // Format: "15 Apr 2026- 15 Apr 2025"
  From_Date?: string | Date;
  To_Date?: string | Date;
  Leave_Type: string;
  Day: string; // Format: "01 Day" or "02 Days"
  No_Of_Days?: number;
  Applied_On: string;
  Applied_On_Date?: string | Date;
  Status: DoctorLeaveStatus;
  Reason?: string;
  Department?: string;
  Designation?: string;
  [key: string]: any;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DoctorLeaveListResponse {
  data: DoctorLeave[];
  pagination: Pagination;
}

export const fetchDoctorLeaves = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
  doctor?: string;
  leaveType?: string;
  department?: string;
  designation?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<DoctorLeaveListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.doctor) queryParams.append("doctor", params.doctor);
  if (params?.leaveType) queryParams.append("leaveType", params.leaveType);
  if (params?.department) queryParams.append("department", params.department);
  if (params?.designation) queryParams.append("designation", params.designation);
  if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
  if (params?.dateTo) queryParams.append("dateTo", params.dateTo);

  const queryString = queryParams.toString();
  const url = `/doctor-leaves${queryString ? `?${queryString}` : ""}`;
  const { data } = await api.get<DoctorLeaveListResponse>(url);
  return data;
};

export const fetchDoctorLeaveById = async (id: string): Promise<DoctorLeave> => {
  const { data } = await api.get<DoctorLeave>(`/doctor-leaves/${id}`);
  return data;
};

export const createDoctorLeave = async (
  leaveData: Partial<DoctorLeave>
): Promise<DoctorLeave> => {
  if (!leaveData.id) {
    leaveData.id = Date.now().toString();
  }
  const { data } = await api.post<DoctorLeave>("/doctor-leaves", leaveData);
  return data;
};

export const updateDoctorLeave = async (
  id: string,
  leaveData: Partial<DoctorLeave>
): Promise<DoctorLeave> => {
  const { data } = await api.patch<DoctorLeave>(`/doctor-leaves/${id}`, leaveData);
  return data;
};

export const deleteDoctorLeave = async (id: string): Promise<void> => {
  await api.delete(`/doctor-leaves/${id}`);
};
