"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAppointmentRouter = void 0;
const express_1 = require("express");
const appointmentController_1 = require("../controllers/appointmentController");
const requireUserId_1 = require("../middleware/requireUserId");
const buildAppointmentRouter = () => {
    const router = (0, express_1.Router)();
    router.get("/", appointmentController_1.getAllAppointments);
    router.get("/:id", appointmentController_1.getAppointmentById);
    router.post("/", requireUserId_1.requireUserId, appointmentController_1.createAppointment);
    router.patch("/:id", requireUserId_1.requireUserId, appointmentController_1.updateAppointment);
    router.delete("/:id", requireUserId_1.requireUserId, appointmentController_1.deleteAppointment);
    return router;
};
exports.buildAppointmentRouter = buildAppointmentRouter;
