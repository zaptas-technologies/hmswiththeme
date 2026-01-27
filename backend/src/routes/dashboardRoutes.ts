import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";
import { getAdminDashboard } from "../controllers/adminDashboardController";
import { getSuperAdminDashboard } from "../controllers/superAdminDashboardController";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";

export const buildDashboardRouter = () => {
  const router = Router();
  router.use(authMiddleware);
  router.get("/", getDashboard);
  router.get("/admin", getAdminDashboard);
  router.get("/super-admin", requireRole("SUPER_ADMIN"), getSuperAdminDashboard);
  return router;
};
