import { Router } from "express";
import {
  getAllPharmacies,
  getPharmacyById,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
  impersonatePharmacy,
} from "../controllers/pharmacyController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const buildPharmacyRouter = () => {
  const router = Router();

  // Handle OPTIONS preflight requests
  router.options("/", (req, res) => {
    const origin = req.headers.origin;
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, Accept, Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
    return res.sendStatus(204);
  });

  router.options("/:id", (req, res) => {
    const origin = req.headers.origin;
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, Accept, Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
    return res.sendStatus(204);
  });

  router.options("/:id/impersonate", (req, res) => {
    const origin = req.headers.origin;
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, Accept, Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
    return res.sendStatus(204);
  });

  router.get("/", authMiddleware, getAllPharmacies);
  router.get("/:id", authMiddleware, getPharmacyById);
  router.post("/", authMiddleware, createPharmacy);
  router.patch("/:id", authMiddleware, updatePharmacy);
  router.delete("/:id", authMiddleware, deletePharmacy);
  router.post("/:id/impersonate", authMiddleware, impersonatePharmacy);

  return router;
};
