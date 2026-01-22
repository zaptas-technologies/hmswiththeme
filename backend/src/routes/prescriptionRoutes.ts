import { Router } from "express";
import {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from "../controllers/prescriptionController";
import { requireUserId } from "../middleware/requireUserId";

export const buildPrescriptionRouter = () => {
  const router = Router();

  // Handle OPTIONS preflight requests for all routes - must be before other routes
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

  // GET /api/prescriptions - Get all prescriptions (with filtering)
  router.get("/", getAllPrescriptions);

  // GET /api/prescriptions/:id - Get prescription by ID
  router.get("/:id", getPrescriptionById);

  // POST /api/prescriptions - Create new prescription (requires authentication)
  router.post("/", requireUserId, createPrescription);

  // PATCH /api/prescriptions/:id - Update prescription (requires authentication)
  router.patch("/:id", requireUserId, updatePrescription);

  // DELETE /api/prescriptions/:id - Delete prescription (requires authentication)
  router.delete("/:id", requireUserId, deletePrescription);

  return router;
};
