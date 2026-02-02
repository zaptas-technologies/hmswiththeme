import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";
import { getAdminDashboard } from "../controllers/adminDashboardController";
import { getSuperAdminDashboard } from "../controllers/superAdminDashboardController";
import {
  getTransactions,
  getReports,
  getInventoryReportHandler,
} from "../controllers/reportsAndTransactionsController";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware";

export const buildDashboardRouter = () => {
  const router = Router();
  router.use(authMiddleware);
  router.get("/", getDashboard);
  router.get("/admin", getAdminDashboard);
  router.get("/super-admin", requireRole("SUPER_ADMIN"), getSuperAdminDashboard);
  router.get("/transactions", getTransactions);
  router.get("/reports", getReports);
  router.get("/inventory-report", getInventoryReportHandler);
  return router;
};
