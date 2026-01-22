import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";
import { requireUserId } from "../middleware/requireUserId";

export const buildDashboardRouter = () => {
  const router = Router();
  router.use(requireUserId);
  router.get("/", getDashboard);
  return router;
};
