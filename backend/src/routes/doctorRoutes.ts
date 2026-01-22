import { Router } from "express";
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController";
import { requireUserId } from "../middleware/requireUserId";

export const buildDoctorRouter = () => {
  const router = Router();

  // GET /api/doctors - Get all doctors (public or authenticated based on your needs)
  router.get("/", getAllDoctors);

  // GET /api/doctors/:id - Get doctor by ID
  router.get("/:id", getDoctorById);

  // POST /api/doctors - Create new doctor (requires authentication)
  router.post("/", requireUserId, createDoctor);

  // PATCH /api/doctors/:id - Update doctor (requires authentication)
  router.patch("/:id", requireUserId, updateDoctor);

  // DELETE /api/doctors/:id - Delete doctor (requires authentication)
  router.delete("/:id", requireUserId, deleteDoctor);

  return router;
};
