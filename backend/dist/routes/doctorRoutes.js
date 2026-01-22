"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDoctorRouter = void 0;
const express_1 = require("express");
const doctorController_1 = require("../controllers/doctorController");
const requireUserId_1 = require("../middleware/requireUserId");
const buildDoctorRouter = () => {
    const router = (0, express_1.Router)();
    // GET /api/doctors - Get all doctors (public or authenticated based on your needs)
    router.get("/", doctorController_1.getAllDoctors);
    // GET /api/doctors/:id - Get doctor by ID
    router.get("/:id", doctorController_1.getDoctorById);
    // POST /api/doctors - Create new doctor (requires authentication)
    router.post("/", requireUserId_1.requireUserId, doctorController_1.createDoctor);
    // PATCH /api/doctors/:id - Update doctor (requires authentication)
    router.patch("/:id", requireUserId_1.requireUserId, doctorController_1.updateDoctor);
    // DELETE /api/doctors/:id - Delete doctor (requires authentication)
    router.delete("/:id", requireUserId_1.requireUserId, doctorController_1.deleteDoctor);
    return router;
};
exports.buildDoctorRouter = buildDoctorRouter;
