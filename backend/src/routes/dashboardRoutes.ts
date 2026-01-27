import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";
import { getAdminDashboard } from "../controllers/adminDashboardController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const buildDashboardRouter = () => {
  const router = Router();
  router.use(authMiddleware);
  router.get("/", getDashboard);
  router.get("/admin", getAdminDashboard);
  return router;
};
