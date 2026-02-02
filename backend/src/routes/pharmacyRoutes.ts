import { Router } from "express";
import {
  getAllPharmacies,
  getPharmacyById,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
  impersonatePharmacy,
  getPharmacyDashboard,
  getConsultationPriceBreakdown,
  fulfillConsultation,
} from "../controllers/pharmacyController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { parseUpdateQuery } from "../middlewares/parseUpdateQuery";

export const buildPharmacyRouter = () => {
  const router = Router();

  router.get("/", authMiddleware, getAllPharmacies);
  router.get("/dashboard", authMiddleware, getPharmacyDashboard);
  router.get("/consultations/:id/price-breakdown", authMiddleware, getConsultationPriceBreakdown);
  router.post("/fulfill", authMiddleware, fulfillConsultation);
  router.get("/:id", authMiddleware, getPharmacyById);
  router.post("/", authMiddleware, createPharmacy);
  router.get("/:id/update", authMiddleware, parseUpdateQuery, updatePharmacy);
  router.delete("/:id", authMiddleware, deletePharmacy);
  router.post("/:id/impersonate", authMiddleware, impersonatePharmacy);

  return router;
};
