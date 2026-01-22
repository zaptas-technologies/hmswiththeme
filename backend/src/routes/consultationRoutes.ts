import { Router } from "express";
import {
  getAppointmentForConsultation,
  saveConsultation,
} from "../controllers/consultationController";
import { requireUserId } from "../middleware/requireUserId";

export const buildConsultationRouter = () => {
  const router = Router();

  // Handle OPTIONS preflight requests
  router.options("/appointment/:id", (req, res) => {
    const origin = req.headers.origin;
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, Accept, Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
    return res.sendStatus(204);
  });

  router.options("/", (req, res) => {
    const origin = req.headers.origin;
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, Accept, Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
    return res.sendStatus(204);
  });

  // GET /api/consultations/appointment/:id - Get appointment with patient details
  router.get("/appointment/:id", requireUserId, getAppointmentForConsultation);

  // POST /api/consultations - Save consultation data
  router.post("/", requireUserId, saveConsultation);

  return router;
};
