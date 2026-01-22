import { api, setAuthToken } from "./dashboard";

export interface TimeSlot {
  session: string;
  from: string; // HH:mm format
  to: string; // HH:mm format
}

export interface DaySchedule {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  timeSlots: TimeSlot[];
}

export interface ScheduleResponse {
  id?: string;
  location: string;
  fromDate: string | null;
  toDate: string | null;
  recursEvery: string;
  schedules: DaySchedule[];
}

export const fetchSchedule = async (token: string): Promise<ScheduleResponse> => {
  setAuthToken(token);
  const { data } = await api.get<ScheduleResponse>("/schedule");
  return data;
};

export const saveSchedule = async (
  token: string,
  scheduleData: Omit<ScheduleResponse, "id">
): Promise<ScheduleResponse> => {
  setAuthToken(token);
  const { data } = await api.post<ScheduleResponse>("/schedule", scheduleData);
  return data;
};
