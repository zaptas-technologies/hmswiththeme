"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAppointmentRouter = void 0;
const express_1 = require("express");
const appointmentController_1 = require("../controllers/appointmentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const parseUpdateQuery_1 = require("../middlewares/parseUpdateQuery");
const buildAppointmentRouter = () => {
    const router = (0, express_1.Router)();
    router.get("/", authMiddleware_1.authMiddleware, appointmentController_1.getAllAppointments);
    router.get("/available-slots", authMiddleware_1.authMiddleware, appointmentController_1.getAvailableSlots);
    router.get("/:id", authMiddleware_1.authMiddleware, appointmentController_1.getAppointmentById);
    router.post("/", authMiddleware_1.authMiddleware, appointmentController_1.createAppointment);
    router.get("/:id/update", authMiddleware_1.authMiddleware, parseUpdateQuery_1.parseUpdateQuery, appointmentController_1.updateAppointment);
    router.delete("/:id", authMiddleware_1.authMiddleware, appointmentController_1.deleteAppointment);
    return router;
};
exports.buildAppointmentRouter = buildAppointmentRouter;
