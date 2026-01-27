import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { login as loginApi, getCurrentUser, type User, type UserRole, type LoginRequest } from "../../api/auth";
import { setAuthToken } from "../../api/dashboard";
import { all_routes } from "../../feature-module/routes/all_routes";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  // Keep doctor for backward compatibility
  doctor: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const DOCTOR_KEY = "auth_doctor"; // Keep for backward compatibility

// Map user roles to their respective dashboard routes
const getDashboardRouteByRole = (role: UserRole): string => {
  switch (role) {
    case "doctor":
      return all_routes.doctordashboard || "/";
    case "patient":
      return all_routes.patientdashboard || "/";
    case "super_admin":
      return all_routes.superAdminDashboard || "/";
    case "admin":
      return all_routes.dashboard || "/";
    case "hospital_admin":
      return all_routes.dashboard || "/";
    case "receptionist":
    case "nurse":
    case "pharmacist":
    case "lab_technician":
    case "accountant":
    default:
      // If no specific dashboard route exists, navigate to root
      return "/";
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Try to get user from new key first, fallback to old doctor key for backward compatibility
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    const storedDoctor = localStorage.getItem(DOCTOR_KEY);
    if (storedDoctor) {
      const doctor = JSON.parse(storedDoctor);
      return { ...doctor, role: doctor.role || "doctor" };
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          setAuthToken(storedToken);
          const { user: currentUser } = await getCurrentUser(storedToken);
          if (currentUser) {
            setUser(currentUser);
            localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            // Also update doctor key for backward compatibility
            if (currentUser.role === "doctor") {
              localStorage.setItem(DOCTOR_KEY, JSON.stringify(currentUser));
            }
          }
          setToken(storedToken);
        } catch (err) {
          // Token invalid, clear storage
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(DOCTOR_KEY);
          setToken(null);
          setUser(null);
          setAuthToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await loginApi(credentials);
      const newToken = response.token;
      // Handle both new format (user) and old format (doctor) for backward compatibility
      const newUser = response.user || (response.doctor ? { ...response.doctor, role: (response.doctor as any).role || "doctor" } : null);
      
      if (!newUser) {
        throw new Error("Invalid login response: no user data");
      }

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      // Also save to doctor key for backward compatibility if it's a doctor
      if (newUser.role === "doctor") {
        localStorage.setItem(DOCTOR_KEY, JSON.stringify(newUser));
      }
      
      setAuthToken(newToken);
      setToken(newToken);
      setUser(newUser);
      
      // Navigate to appropriate dashboard based on user role
      const dashboardRoute = getDashboardRouteByRole(newUser.role);
      navigate(dashboardRoute);
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(DOCTOR_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
    navigate(all_routes.login);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        doctor: user, // Keep doctor for backward compatibility
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
