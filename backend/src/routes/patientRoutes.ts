import { Router } from "express";
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController";
import { requireUserId } from "../middleware/requireUserId";

export const buildPatientRouter = () => {
  const router = Router();

  // GET /api/patients - Get all patients
  router.get("/", getAllPatients);

  // GET /api/patients/:id - Get patient by ID
  router.get("/:id", getPatientById);

  // POST /api/patients - Create new patient (requires authentication)
  router.post("/", requireUserId, createPatient);

  // PATCH /api/patients/:id - Update patient (requires authentication)
  router.patch("/:id", requireUserId, updatePatient);

  // DELETE /api/patients/:id - Delete patient (requires authentication)
  router.delete("/:id", requireUserId, deletePatient);

  return router;
};
