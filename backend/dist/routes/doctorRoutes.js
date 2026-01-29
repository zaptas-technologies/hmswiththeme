"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDoctorRouter = void 0;
const express_1 = require("express");
const doctorController_1 = require("../controllers/doctorController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadDoctorImage_1 = require("../middlewares/uploadDoctorImage");
const buildDoctorRouter = () => {
    const router = (0, express_1.Router)();
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
    router.get("/", authMiddleware_1.authMiddleware, doctorController_1.getAllDoctors);
    router.get("/:id", authMiddleware_1.authMiddleware, doctorController_1.getDoctorById);
    // Upload doctor profile image (multipart/form-data, field: "image")
    // Must be before "/:id" PATCH/DELETE routes if any path overlap occurs later.
    router.post("/upload-image", authMiddleware_1.authMiddleware, (req, res, next) => {
        uploadDoctorImage_1.doctorImageUpload.single("image")(req, res, (err) => {
            if (err)
                return res.status(400).json({ message: err.message || "Upload failed" });
            next();
        });
    }, doctorController_1.uploadDoctorImage);
    router.post("/", authMiddleware_1.authMiddleware, doctorController_1.createDoctor);
    router.patch("/:id", authMiddleware_1.authMiddleware, doctorController_1.updateDoctor);
    router.delete("/:id", authMiddleware_1.authMiddleware, doctorController_1.deleteDoctor);
    return router;
};
exports.buildDoctorRouter = buildDoctorRouter;
