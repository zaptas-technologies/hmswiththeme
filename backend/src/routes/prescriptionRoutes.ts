import { Router } from "express";
import {
  getAllPrescriptions,
  getPrescriptionById,
  getPrescriptionPriceBreakdown,
  createPrescription,
  updatePrescription,
  deletePrescription,
  fulfillPrescription,
} from "../controllers/prescriptionController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { parseUpdateQuery } from "../middlewares/parseUpdateQuery";

export const buildPrescriptionRouter = () => {
  const router = Router();

  router.get("/", authMiddleware, getAllPrescriptions);
  router.get("/:id/price-breakdown", authMiddleware, getPrescriptionPriceBreakdown);
  router.get("/:id", authMiddleware, getPrescriptionById);
  router.post("/", authMiddleware, createPrescription);
  router.post("/:id/fulfill", authMiddleware, fulfillPrescription);
  router.get("/:id/update", authMiddleware, parseUpdateQuery, updatePrescription);
  router.delete("/:id", authMiddleware, deletePrescription);

  return router;
};
