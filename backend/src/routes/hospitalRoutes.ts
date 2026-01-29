import { Router } from "express";
import {
  getAllHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
} from "../controllers/hospitalController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { parseUpdateQuery } from "../middlewares/parseUpdateQuery";

export const buildHospitalRouter = () => {
  const router = Router();

  router.use(authMiddleware);

  router.get("/", getAllHospitals);
  router.get("/:id", getHospitalById);
  router.post("/", createHospital);
  router.get("/:id/update", parseUpdateQuery, updateHospital);
  router.delete("/:id", deleteHospital);

  return router;
};
