import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { all_routes } from "../../feature-module/routes/all_routes";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={all_routes.login} replace />;
  }

  return <>{children}</>;
};
