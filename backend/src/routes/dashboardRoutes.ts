import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";
import { getAdminDashboard } from "../controllers/adminDashboardController";
import { requireUserId } from "../middleware/requireUserId";

export const buildDashboardRouter = () => {
  const router = Router();
  router.use(requireUserId);
  router.get("/", getDashboard);
  router.get("/admin", getAdminDashboard);
  return router;
};
