
import { Route, Routes, Navigate } from "react-router";
import { authRoutes, publicRoutes } from "./router.link";
import AuthFeature from "../feathure-components/authFeature";
import Feature from "../feathure-components/feature";
import { ProtectedRoute } from "../../core/components/ProtectedRoute";
import { all_routes } from "./all_routes";

const ALLRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Public auth routes (login, register, forgot password, etc.) */}
        <Route element={<AuthFeature />}>
          {authRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={`auth-${idx}`} />
          ))}
        </Route>

        {/* Protected routes - require authentication (all app pages) */}
        <Route
          element={
            <ProtectedRoute>
              <Feature />
            </ProtectedRoute>
          }
        >
          {publicRoutes
            .filter((route) => route.path !== "/" && route.path !== "*")
            .map((route, idx) => (
              <Route path={route.path} element={route.element} key={`protected-${idx}`} />
            ))}
        </Route>

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to={all_routes.login} replace />} />
        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to={all_routes.login} replace />} />
      </Routes>
    </>
  );
};

export default ALLRoutes;
