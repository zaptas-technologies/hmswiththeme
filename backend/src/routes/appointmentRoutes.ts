import { Router } from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableSlots,
} from "../controllers/appointmentController";
import { authMiddleware } from "../middlewares/authMiddleware";
 
export const buildAppointmentRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllAppointments);
  router.get("/available-slots", authMiddleware, getAvailableSlots); // Must be before /:id route
  router.get("/:id", authMiddleware, getAppointmentById);
  router.post("/", authMiddleware, createAppointment);
  router.patch("/:id", authMiddleware, updateAppointment);
  router.delete("/:id", authMiddleware, deleteAppointment);
  return router;
};

