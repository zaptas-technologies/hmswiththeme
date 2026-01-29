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

  router.get("/", authMiddleware, getAllDoctors);
  router.get("/:id", authMiddleware, getDoctorById);

  // Upload doctor profile image (multipart/form-data, field: "image")
  // Must be before "/:id" PATCH/DELETE routes if any path overlap occurs later.
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
  router.patch("/:id", authMiddleware, updateDoctor);
  router.delete("/:id", authMiddleware, deleteDoctor);

  return router;
};
