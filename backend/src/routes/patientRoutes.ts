import { Router } from "express";
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const buildPatientRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllPatients);
  router.get("/:id", authMiddleware, getPatientById);
  router.post("/", authMiddleware, createPatient);
  router.patch("/:id", authMiddleware, updatePatient);
  router.delete("/:id", authMiddleware, deletePatient);

  return router;
};
