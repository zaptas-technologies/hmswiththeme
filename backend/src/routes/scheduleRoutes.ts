import { Router } from "express";
import { getSchedule, saveSchedule, updateSchedule, deleteSchedule, getScheduleHistory } from "../controllers/scheduleController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateScheduleRequest } from "../middleware/validateSchedule";
import { parseUpdateQuery } from "../middlewares/parseUpdateQuery";

export const buildScheduleRouter = () => {
  const router = Router();

  router.use(authMiddleware);

  router.get("/", getSchedule);
  router.get("/history", getScheduleHistory);
  router.post("/", validateScheduleRequest, saveSchedule);
  router.put("/", validateScheduleRequest, saveSchedule);
  router.get("/update", parseUpdateQuery, updateSchedule);
  router.delete("/", deleteSchedule);

  return router;
};
