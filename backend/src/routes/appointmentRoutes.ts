import { Router } from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController";
import { authMiddleware } from "../middlewares/authMiddleware";
 
export const buildAppointmentRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllAppointments);
  router.get("/:id", authMiddleware, getAppointmentById);
  router.post("/", authMiddleware, createAppointment);
  router.patch("/:id", authMiddleware, updateAppointment);
  router.delete("/:id", authMiddleware, deleteAppointment);
  return router;
};

