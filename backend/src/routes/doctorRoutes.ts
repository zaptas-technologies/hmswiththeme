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

  // Handle OPTIONS preflight requests for all routes - must be before other routes
  // Handle both root and ID routes
  router.options("/", (req, res) => {
    const origin = req.headers.origin;
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, Accept, Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400"); // 24 hours
    return res.sendStatus(204);
  });

  router.options("/:id", (req, res) => {
    const origin = req.headers.origin;
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, Accept, Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400"); // 24 hours
    return res.sendStatus(204);
  });

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
