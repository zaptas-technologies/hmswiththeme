import { Router } from "express";
import {
  getAllGRN,
  getGRNById,
  createGRN,
  updateGRN,
  deleteGRN,
} from "../controllers/grnController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const buildGRNRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllGRN);
  router.get("/:id", authMiddleware, getGRNById);
  router.post("/", authMiddleware, createGRN);
  router.patch("/:id", authMiddleware, updateGRN);
  router.delete("/:id", authMiddleware, deleteGRN);

  return router;
};
