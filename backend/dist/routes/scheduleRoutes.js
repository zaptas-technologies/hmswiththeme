"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildScheduleRouter = void 0;
const express_1 = require("express");
const scheduleController_1 = require("../controllers/scheduleController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validateSchedule_1 = require("../middleware/validateSchedule");
const buildScheduleRouter = () => {
    const router = (0, express_1.Router)();
    router.use(authMiddleware_1.authMiddleware);
    // GET /api/schedule - Get current schedule
    router.get("/", scheduleController_1.getSchedule);
    // GET /api/schedule/history - Get schedule history with pagination
    router.get("/history", scheduleController_1.getScheduleHistory);
    // POST /api/schedule - Create or update schedule (upsert)
    router.post("/", validateSchedule_1.validateScheduleRequest, scheduleController_1.saveSchedule);
    // PUT /api/schedule - Update schedule (full update)
    router.put("/", validateSchedule_1.validateScheduleRequest, scheduleController_1.saveSchedule);
    // PATCH /api/schedule - Partial update
    router.patch("/", scheduleController_1.updateSchedule);
    // DELETE /api/schedule - Delete schedule
    router.delete("/", scheduleController_1.deleteSchedule);
    return router;
};
exports.buildScheduleRouter = buildScheduleRouter;
