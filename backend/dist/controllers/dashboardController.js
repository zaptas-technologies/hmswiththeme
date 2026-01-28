"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
const dashboardService_1 = require("../services/dashboardService");
const doctorModel_1 = require("../models/doctorModel");
const userModel_1 = require("../models/userModel");
const getDashboard = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const doctorId = req.user.userId;
        // Get doctor's hospitalId if doctor is associated with a hospital
        let hospitalId = undefined;
        try {
            // First try to find doctor by user ID
            let doctor = await doctorModel_1.Doctor.findOne({ user: doctorId })
                .select("hospital Email")
                .lean();
            // If not found by user ID, try to find by email from User model
            if (!doctor) {
                const user = await userModel_1.User.findById(doctorId).select("email").lean();
                if (user?.email) {
                    doctor = await doctorModel_1.Doctor.findOne({
                        Email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
                    })
                        .select("hospital Email")
                        .lean();
                }
            }
            if (doctor?.hospital) {
                hospitalId = doctor.hospital.toString();
            }
        }
        catch (error) {
            // If we can't find doctor, continue without hospital filter
            // eslint-disable-next-line no-console
            console.error("Error fetching doctor hospital:", error);
        }
        const payload = await (0, dashboardService_1.buildDashboardPayload)(doctorId, hospitalId);
        return res.json(payload);
    }
    catch (err) {
        return next(err);
    }
};
exports.getDashboard = getDashboard;
