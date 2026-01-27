"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDashboardRouter = void 0;
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const adminDashboardController_1 = require("../controllers/adminDashboardController");
const superAdminDashboardController_1 = require("../controllers/superAdminDashboardController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const buildDashboardRouter = () => {
    const router = (0, express_1.Router)();
    router.use(authMiddleware_1.authMiddleware);
    router.get("/", dashboardController_1.getDashboard);
    router.get("/admin", adminDashboardController_1.getAdminDashboard);
    router.get("/super-admin", (0, authMiddleware_1.requireRole)("SUPER_ADMIN"), superAdminDashboardController_1.getSuperAdminDashboard);
    return router;
};
exports.buildDashboardRouter = buildDashboardRouter;
