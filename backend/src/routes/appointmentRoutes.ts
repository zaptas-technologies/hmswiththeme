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
import { parseUpdateQuery } from "../middlewares/parseUpdateQuery";

export const buildAppointmentRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllAppointments);
  router.get("/available-slots", authMiddleware, getAvailableSlots);
  router.get("/:id", authMiddleware, getAppointmentById);
  router.post("/", authMiddleware, createAppointment);
  router.get("/:id/update", authMiddleware, parseUpdateQuery, updateAppointment);
  router.delete("/:id", authMiddleware, deleteAppointment);
  return router;
};

