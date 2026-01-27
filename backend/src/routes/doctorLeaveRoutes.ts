import { Router } from "express";
import {
  getAllDoctorLeaves,
  getDoctorLeaveById,
  createDoctorLeave,
  updateDoctorLeave,
  deleteDoctorLeave,
} from "../controllers/doctorLeaveController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const buildDoctorLeaveRouter = () => {
  const router = Router();
  router.get("/", authMiddleware, getAllDoctorLeaves);
  router.get("/:id", authMiddleware, getDoctorLeaveById);
  router.post("/", authMiddleware, createDoctorLeave);
  router.patch("/:id", authMiddleware, updateDoctorLeave);
  router.delete("/:id", authMiddleware, deleteDoctorLeave);

  return router;
};
