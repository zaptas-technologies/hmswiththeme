import { Router } from "express";
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { parseUpdateQuery } from "../middlewares/parseUpdateQuery";

export const buildPatientRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllPatients);
  router.get("/:id", authMiddleware, getPatientById);
  router.post("/", authMiddleware, createPatient);
  router.get("/:id/update", authMiddleware, parseUpdateQuery, updatePatient);
  router.delete("/:id", authMiddleware, deletePatient);

  return router;
};
