import { Router } from "express";
import { getSchedule, saveSchedule, updateSchedule, deleteSchedule, getScheduleHistory } from "../controllers/scheduleController";
import { requireUserId } from "../middleware/requireUserId";
import { validateScheduleRequest } from "../middleware/validateSchedule";

export const buildScheduleRouter = () => {
  const router = Router();
  
  // All routes require authentication
  router.use(requireUserId);
  
  // GET /api/schedule - Get current schedule
  router.get("/", getSchedule);
  
  // GET /api/schedule/history - Get schedule history with pagination
  router.get("/history", getScheduleHistory);
  
  // POST /api/schedule - Create or update schedule (upsert)
  router.post("/", validateScheduleRequest, saveSchedule);
  
  // PUT /api/schedule - Update schedule (full update)
  router.put("/", validateScheduleRequest, saveSchedule);
  
  // PATCH /api/schedule - Partial update
  router.patch("/", updateSchedule);
  
  // DELETE /api/schedule - Delete schedule
  router.delete("/", deleteSchedule);
  
  return router;
};
