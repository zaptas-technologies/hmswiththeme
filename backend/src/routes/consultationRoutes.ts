import { Router } from "express";
import {
  getAppointmentForConsultation,
  saveConsultation,
  getConsultationsList,
  getConsultationById,
} from "../controllers/consultationController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const buildConsultationRouter = () => {
  const router = Router();

  router.get("/appointment/:id", authMiddleware, getAppointmentForConsultation);
  router.get("/", authMiddleware, getConsultationsList);
  router.get("/:id", authMiddleware, getConsultationById);
  router.post("/", authMiddleware, saveConsultation);

  return router;
};
