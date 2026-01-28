import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const authApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export interface LoginRequest {
  email: string;
  password: string;
}

export type UserRole = 
  | "doctor" 
  | "receptionist" 
  | "admin" 
  | "super_admin" 
  | "hospital_admin"
  | "nurse"
  | "patient"
  | "pharmacist"
  | "lab_technician"
  | "accountant";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  specialization?: string;
  avatar?: string;
  role: UserRole;
  hospitalId?: string;
}

// Keep Doctor interface for backward compatibility
export interface Doctor extends User {
  role: "doctor";
}

export interface AuthResponse {
  token: string;
  user: User;
  // Keep doctor field for backward compatibility
  doctor?: Doctor;
}

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const { data } = await authApi.post<AuthResponse>("/auth/login", credentials);
  // Handle backward compatibility: if response has doctor but no user, convert it
  if (data.doctor && !data.user) {
    return {
      ...data,
      user: {
        ...data.doctor,
        role: (data.doctor as any).role || "doctor",
      },
    };
  }
  return data;
};

export const register = async (userData: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  specialization?: string;
}): Promise<AuthResponse> => {
  const { data } = await authApi.post<AuthResponse>("/auth/register", userData);
  return data;
};

export const getCurrentUser = async (token: string): Promise<{ user: User; doctor?: Doctor }> => {
  const { data } = await authApi.get<{ user?: User; doctor?: Doctor }>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Handle backward compatibility: if response has doctor but no user, convert it
  if (data.doctor && !data.user) {
    return {
      user: {
        ...data.doctor,
        role: (data.doctor as any).role || "doctor",
      },
      doctor: data.doctor as Doctor,
    };
  }
  return data as { user: User; doctor?: Doctor };
};
