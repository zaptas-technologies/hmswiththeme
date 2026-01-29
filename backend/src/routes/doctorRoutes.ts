import { Router } from "express";
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  uploadDoctorImage,
} from "../controllers/doctorController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { doctorImageUpload } from "../middlewares/uploadDoctorImage";
import { parseUpdateQuery } from "../middlewares/parseUpdateQuery";

export const buildDoctorRouter = () => {
  const router = Router();

  router.get("/", authMiddleware, getAllDoctors);
  router.get("/:id", authMiddleware, getDoctorById);

  router.post(
    "/upload-image",
    authMiddleware,
    (req, res, next) => {
      doctorImageUpload.single("image")(req, res, (err: any) => {
        if (err) return res.status(400).json({ message: err.message || "Upload failed" });
        next();
      });
    },
    uploadDoctorImage
  );

  router.post("/", authMiddleware, createDoctor);
  router.get("/:id/update", authMiddleware, parseUpdateQuery, updateDoctor);
  router.delete("/:id", authMiddleware, deleteDoctor);

  return router;
};
