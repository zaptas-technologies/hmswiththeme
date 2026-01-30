"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDoctorRouter = void 0;
const express_1 = require("express");
const doctorController_1 = require("../controllers/doctorController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadDoctorImage_1 = require("../middlewares/uploadDoctorImage");
const parseUpdateQuery_1 = require("../middlewares/parseUpdateQuery");
const buildDoctorRouter = () => {
    const router = (0, express_1.Router)();
    router.get("/", authMiddleware_1.authMiddleware, doctorController_1.getAllDoctors);
    router.get("/:id", authMiddleware_1.authMiddleware, doctorController_1.getDoctorById);
    router.post("/upload-image", authMiddleware_1.authMiddleware, (req, res, next) => {
        uploadDoctorImage_1.doctorImageUpload.single("image")(req, res, (err) => {
            if (err)
                return res.status(400).json({ message: err.message || "Upload failed" });
            next();
        });
    }, doctorController_1.uploadDoctorImage);
    router.post("/", authMiddleware_1.authMiddleware, doctorController_1.createDoctor);
    router.get("/:id/update", authMiddleware_1.authMiddleware, parseUpdateQuery_1.parseUpdateQuery, doctorController_1.updateDoctor);
    router.delete("/:id", authMiddleware_1.authMiddleware, doctorController_1.deleteDoctor);
    return router;
};
exports.buildDoctorRouter = buildDoctorRouter;
