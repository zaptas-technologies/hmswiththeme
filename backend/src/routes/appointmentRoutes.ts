import { Router } from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController";
import { requireUserId } from "../middleware/requireUserId";
 
export const buildAppointmentRouter = () => {
  const router = Router();
  router.get("/", getAllAppointments);
  router.get("/:id", getAppointmentById);
  router.post("/", requireUserId, createAppointment);
  router.patch("/:id", requireUserId, updateAppointment);
  router.delete("/:id", requireUserId, deleteAppointment);
  return router;
};

