import fs from "fs";
import path from "path";
import multer from "multer";
import type { FileFilterCallback } from "multer";

const DOCTOR_UPLOAD_DIR = path.join(process.cwd(), "uploads", "doctors");

// Ensure upload directory exists at runtime
fs.mkdirSync(DOCTOR_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOCTOR_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doctor-${unique}${safeExt}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype?.startsWith("image/")) return cb(null, true);
  return cb(new Error("Only image files are allowed"));
};

export const doctorImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export const getDoctorUploadPath = (filename: string) => `/uploads/doctors/${filename}`;
