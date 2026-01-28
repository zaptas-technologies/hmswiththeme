"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScheduleHistory = exports.deleteSchedule = exports.updateSchedule = exports.saveSchedule = exports.getSchedule = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const doctorScheduleModel_1 = require("../models/doctorScheduleModel");
const doctorModel_1 = require("../models/doctorModel");
const userModel_1 = require("../models/userModel");
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
 * Resolve the "Doctor" document _id for the currently logged-in user.
 * Auth middleware attaches `req.user.userId` (User model id).
 */
const resolveDoctorId = async (req) => {
    const userIdStr = req.user?.userId;
    if (!userIdStr || !mongoose_1.default.Types.ObjectId.isValid(userIdStr))
        return null;
    // Primary: Doctor.user points to User._id
    const byUser = await doctorModel_1.Doctor.findOne({ user: new mongoose_1.default.Types.ObjectId(userIdStr) })
        .select("_id")
        .lean();
    if (byUser?._id)
        return new mongoose_1.default.Types.ObjectId(byUser._id.toString());
    // Fallback: match by email if doctor.user linkage is missing
    const user = await userModel_1.User.findById(userIdStr).select("email").lean();
    if (user?.email) {
        const rx = new RegExp(`^${escapeRegExp(user.email)}$`, "i");
        const byEmail = await doctorModel_1.Doctor.findOne({ $or: [{ Email: rx }, { email: rx }] })
            .select("_id")
            .lean();
        if (byEmail?._id)
            return new mongoose_1.default.Types.ObjectId(byEmail._id.toString());
    }
    return null;
};
// Helper to format schedule response
const formatScheduleResponse = (schedule) => {
    return {
        id: schedule._id.toString(),
        doctorId: schedule.doctorId.toString(),
        location: schedule.location,
        fromDate: schedule.fromDate.toISOString().split("T")[0],
        toDate: schedule.toDate.toISOString().split("T")[0],
        recursEvery: schedule.recursEvery,
        schedules: schedule.schedules,
        createdAt: schedule.createdAt.toISOString(),
        updatedAt: schedule.updatedAt.toISOString(),
    };
};
// Helper to get default empty schedule
const getDefaultSchedule = () => ({
    location: "",
    fromDate: null,
    toDate: null,
    recursEvery: "",
    schedules: [
        { day: "Monday", timeSlots: [] },
        { day: "Tuesday", timeSlots: [] },
        { day: "Wednesday", timeSlots: [] },
        { day: "Thursday", timeSlots: [] },
        { day: "Friday", timeSlots: [] },
        { day: "Saturday", timeSlots: [] },
        { day: "Sunday", timeSlots: [] },
    ],
});
const getSchedule = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const doctorId = await resolveDoctorId(req);
        if (!doctorId) {
            return res.status(403).json({ message: "Doctor profile not found for this user" });
        }
        // Get the most recent active schedule for this doctor
        const schedule = await doctorScheduleModel_1.DoctorSchedule.findOne({ doctorId })
            .sort({ createdAt: -1 })
            .exec();
        if (!schedule) {
            // Return default empty schedule structure
            return res.json(getDefaultSchedule());
        }
        res.json(formatScheduleResponse(schedule));
    }
    catch (err) {
        next(err);
    }
};
exports.getSchedule = getSchedule;
const saveSchedule = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const doctorId = await resolveDoctorId(req);
        if (!doctorId) {
            return res.status(403).json({ message: "Doctor profile not found for this user" });
        }
        const { location, fromDate, toDate, recursEvery, schedules } = req.body;
        // Validation is handled by middleware, but double-check here for safety
        if (!location || !fromDate || !toDate || !recursEvery) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        // Debug logging (remove in production)
        console.log("Saving schedule for doctorId:", doctorId);
        console.log("Schedules data:", JSON.stringify(schedules, null, 2));
        // Parse dates
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        // Find existing schedule for this doctor
        // We'll update the most recent one or create a new one
        const existingSchedule = await doctorScheduleModel_1.DoctorSchedule.findOne({ doctorId })
            .sort({ createdAt: -1 })
            .exec();
        // Normalize schedules - ensure all days are present and timeSlots are properly structured
        const normalizedSchedules = schedules.map((daySchedule) => ({
            day: daySchedule.day,
            timeSlots: (daySchedule.timeSlots || []).map((slot) => ({
                session: String(slot.session || ""),
                from: String(slot.from || ""),
                to: String(slot.to || ""),
            })),
        }));
        if (existingSchedule) {
            // Update existing schedule - use set() to ensure Mongoose detects changes
            existingSchedule.set({
                location: location.trim(),
                fromDate: fromDateObj,
                toDate: toDateObj,
                recursEvery: recursEvery.trim(),
                schedules: normalizedSchedules,
            });
            // Mark the schedules array as modified for Mongoose (important for nested arrays)
            existingSchedule.markModified("schedules");
            const savedSchedule = await existingSchedule.save();
            // Verify the save worked
            if (!savedSchedule) {
                throw new Error("Failed to save schedule");
            }
            const totalTimeSlots = savedSchedule.schedules.reduce((sum, day) => sum + day.timeSlots.length, 0);
            console.log("Updated schedule - Total timeSlots:", totalTimeSlots);
            return res.json(formatScheduleResponse(savedSchedule));
        }
        else {
            // Create new schedule
            const scheduleData = {
                doctorId,
                location: location.trim(),
                fromDate: fromDateObj,
                toDate: toDateObj,
                recursEvery: recursEvery.trim(),
                schedules: normalizedSchedules,
            };
            const newSchedule = await doctorScheduleModel_1.DoctorSchedule.create(scheduleData);
            const totalTimeSlots = newSchedule.schedules.reduce((sum, day) => sum + day.timeSlots.length, 0);
            console.log("Created schedule - Total timeSlots:", totalTimeSlots);
            return res.status(201).json(formatScheduleResponse(newSchedule));
        }
    }
    catch (err) {
        // Log error for debugging
        console.error("Error saving schedule:", err);
        console.error("Error details:", {
            name: err.name,
            message: err.message,
            stack: err.stack,
        });
        // Handle MongoDB validation errors
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({
                message: "Validation error",
                errors,
                details: err.errors,
            });
        }
        // Handle duplicate key errors
        if (err.code === 11000) {
            return res.status(409).json({
                message: "Schedule already exists for this doctor"
            });
        }
        // Return more detailed error in development
        return res.status(500).json({
            message: err.message || "Failed to save schedule",
            error: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }
};
exports.saveSchedule = saveSchedule;
const updateSchedule = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const doctorId = await resolveDoctorId(req);
        if (!doctorId) {
            return res.status(403).json({ message: "Doctor profile not found for this user" });
        }
        const updateData = req.body;
        // Find existing schedule
        const schedule = await doctorScheduleModel_1.DoctorSchedule.findOne({ doctorId })
            .sort({ createdAt: -1 })
            .exec();
        if (!schedule) {
            return res.status(404).json({ message: "Schedule not found" });
        }
        // Update only provided fields
        if (updateData.location !== undefined) {
            schedule.location = updateData.location.trim();
        }
        if (updateData.fromDate !== undefined) {
            schedule.fromDate = new Date(updateData.fromDate);
        }
        if (updateData.toDate !== undefined) {
            schedule.toDate = new Date(updateData.toDate);
        }
        if (updateData.recursEvery !== undefined) {
            schedule.recursEvery = updateData.recursEvery.trim();
        }
        if (updateData.schedules !== undefined) {
            // Normalize schedules before updating
            const normalizedSchedules = updateData.schedules.map((daySchedule) => ({
                day: daySchedule.day,
                timeSlots: (daySchedule.timeSlots || []).map((slot) => ({
                    session: String(slot.session || ""),
                    from: String(slot.from || ""),
                    to: String(slot.to || ""),
                })),
            }));
            schedule.schedules = normalizedSchedules;
            schedule.markModified("schedules");
        }
        await schedule.save();
        return res.json(formatScheduleResponse(schedule));
    }
    catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({
                message: "Validation error",
                errors
            });
        }
        next(err);
    }
};
exports.updateSchedule = updateSchedule;
const deleteSchedule = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const doctorId = await resolveDoctorId(req);
        if (!doctorId) {
            return res.status(403).json({ message: "Doctor profile not found for this user" });
        }
        const schedule = await doctorScheduleModel_1.DoctorSchedule.findOne({ doctorId })
            .sort({ createdAt: -1 })
            .exec();
        if (!schedule) {
            return res.status(404).json({ message: "Schedule not found" });
        }
        await schedule.deleteOne();
        return res.status(204).send();
    }
    catch (err) {
        next(err);
    }
};
exports.deleteSchedule = deleteSchedule;
const getScheduleHistory = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const doctorId = await resolveDoctorId(req);
        if (!doctorId) {
            return res.status(403).json({ message: "Doctor profile not found for this user" });
        }
        const limit = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const [schedules, total] = await Promise.all([
            doctorScheduleModel_1.DoctorSchedule.find({ doctorId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            doctorScheduleModel_1.DoctorSchedule.countDocuments({ doctorId }),
        ]);
        res.json({
            data: schedules.map(formatScheduleResponse),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getScheduleHistory = getScheduleHistory;
