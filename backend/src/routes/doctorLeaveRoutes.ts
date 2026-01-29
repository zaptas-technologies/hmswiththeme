import { Router } from "express";
import {
  getAllDoctorLeaves,
  getDoctorLeaveById,
  createDoctorLeave,
  updateDoctorLeave,
  deleteDoctorLeave,
} from "../controllers/doctorLeaveController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { parseUpdateQuery } from "../middlewares/parseUpdateQuery";

export const buildDoctorLeaveRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllDoctorLeaves);
  router.get("/:id", authMiddleware, getDoctorLeaveById);
  router.post("/", authMiddleware, createDoctorLeave);
  router.get("/:id/update", authMiddleware, parseUpdateQuery, updateDoctorLeave);
  router.delete("/:id", authMiddleware, deleteDoctorLeave);

  return router;
};
