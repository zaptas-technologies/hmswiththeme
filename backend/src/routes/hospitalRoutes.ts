import { Router } from "express";
import {
  getAllHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
} from "../controllers/hospitalController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const buildHospitalRouter = () => {
  const router = Router();

  // Handle OPTIONS preflight requests for all routes
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

  router.use(authMiddleware);

  router.get("/", getAllHospitals);
  router.get("/:id", getHospitalById);
  router.post("/", createHospital);
  router.patch("/:id", updateHospital);
  router.delete("/:id", deleteHospital);

  return router;
};
