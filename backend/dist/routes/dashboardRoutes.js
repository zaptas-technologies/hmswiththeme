"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDashboardRouter = void 0;
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const requireUserId_1 = require("../middleware/requireUserId");
const buildDashboardRouter = () => {
    const router = (0, express_1.Router)();
    router.use(requireUserId_1.requireUserId);
    router.get("/", dashboardController_1.getDashboard);
    return router;
};
exports.buildDashboardRouter = buildDashboardRouter;
