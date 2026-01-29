import { Router } from "express";
import {
  getAppointmentForConsultation,
  saveConsultation,
} from "../controllers/consultationController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const buildConsultationRouter = () => {
  const router = Router();

  router.get("/appointment/:id", authMiddleware, getAppointmentForConsultation);
  router.post("/", authMiddleware, saveConsultation);

  return router;
};
