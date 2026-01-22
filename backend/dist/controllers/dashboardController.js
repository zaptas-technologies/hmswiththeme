"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
const dashboardService_1 = require("../services/dashboardService");
const getDashboard = async (req, res, next) => {
    try {
        const doctorId = req.userId;
        if (!doctorId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const payload = await (0, dashboardService_1.buildDashboardPayload)(doctorId);
        return res.json(payload);
    }
    catch (err) {
        return next(err);
    }
};
exports.getDashboard = getDashboard;
