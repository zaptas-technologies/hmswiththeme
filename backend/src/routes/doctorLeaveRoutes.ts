import { Router } from "express";
import {
  getAllDoctorLeaves,
  getDoctorLeaveById,
  createDoctorLeave,
  updateDoctorLeave,
  deleteDoctorLeave,
} from "../controllers/doctorLeaveController";
import { requireUserId } from "../middleware/requireUserId";

export const buildDoctorLeaveRouter = () => {
  const router = Router();

  // GET /api/doctor-leaves - Get all doctor leaves
  router.get("/", getAllDoctorLeaves);

  // GET /api/doctor-leaves/:id - Get doctor leave by ID
  router.get("/:id", getDoctorLeaveById);

  // POST /api/doctor-leaves - Create new doctor leave (requires authentication)
  router.post("/", requireUserId, createDoctorLeave);

  // PATCH /api/doctor-leaves/:id - Update doctor leave (requires authentication)
  router.patch("/:id", requireUserId, updateDoctorLeave);

  // DELETE /api/doctor-leaves/:id - Delete doctor leave (requires authentication)
  router.delete("/:id", requireUserId, deleteDoctorLeave);

  return router;
};
