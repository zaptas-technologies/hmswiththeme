"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAppointment = exports.updateAppointment = exports.createAppointment = exports.getAppointmentById = exports.getAllAppointments = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const appointmentModel_1 = require("../models/appointmentModel");
const userModel_1 = require("../models/userModel");
const doctorModel_1 = require("../models/doctorModel");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const formatAppointmentResponse = (appt) => {
    if (!appt)
        return appt;
    const obj = typeof appt.toObject === "function" ? appt.toObject() : appt;
    return {
        _id: obj._id?.toString() || obj._id,
        id: obj._id?.toString() || obj._id, // For backward compatibility, map _id to id
        Date_Time: obj.Date_Time,
        Patient: obj.Patient,
        Phone: obj.Phone,
        Patient_Image: obj.Patient_Image,
        Doctor: obj.Doctor,
        Mode: obj.Mode,
        Status: obj.Status,
        Fees: obj.Fees,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
    };
};
const validateAppointmentData = (data) => {
    if (!data)
        return { isValid: false, error: "Missing request body" };
    if (!data.Date_Time || typeof data.Date_Time !== "string") {
        return { isValid: false, error: "Date_Time is required" };
    }
    if (!data.Patient || typeof data.Patient !== "string") {
        return { isValid: false, error: "Patient is required" };
    }
    if (!data.Phone || typeof data.Phone !== "string") {
        return { isValid: false, error: "Phone is required" };
    }
    if (!data.Doctor || typeof data.Doctor !== "string") {
        return { isValid: false, error: "Doctor is required" };
    }
    if (!data.Status || typeof data.Status !== "string") {
        return { isValid: false, error: "Status is required" };
    }
    return { isValid: true };
};
const getAllAppointments = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || "-createdAt";
        const search = req.query.search || "";
        const Status = req.query.status || "";
        const Mode = req.query.mode || "";
        const Patient = req.query.patient || "";
        // Build filter similar to dashboardService - simple approach
        const filter = {};
        // For doctors (USER role), filter by hospital and doctorId
        if (req.user.role === "USER") {
            try {
                // Find doctor by user ID or email (same approach as dashboardService)
                let doctor = await doctorModel_1.Doctor.findOne({ user: req.user.userId })
                    .select("_id hospital Email Name_Designation")
                    .lean();
                // If not found by user ID, try to find by email from User model
                if (!doctor) {
                    const user = await userModel_1.User.findById(req.user.userId).select("email").lean();
                    if (user?.email) {
                        doctor = await doctorModel_1.Doctor.findOne({
                            $or: [
                                { Email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                                { email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                            ],
                        })
                            .select("_id hospital Email Name_Designation")
                            .lean();
                    }
                }
                // Add doctorId filter - ensures appointments are filtered by specific doctor
                if (doctor?._id) {
                    filter.doctorId = new mongoose_1.default.Types.ObjectId(doctor._id.toString());
                }
                // Add hospital filter if doctor is associated with a hospital
                if (doctor?.hospital) {
                    filter.hospital = new mongoose_1.default.Types.ObjectId(doctor.hospital.toString());
                }
                // Add doctor name filter (same as dashboardService)
                if (doctor?.Name_Designation) {
                    filter.Doctor = doctor.Name_Designation;
                }
            }
            catch (error) {
                // If we can't find doctor, continue without filters
                // eslint-disable-next-line no-console
                console.error("Error fetching doctor for appointments:", error);
            }
        }
        else {
            // For other roles, use buildAccessFilter
            const accessFilter = (0, authMiddleware_1.buildAccessFilter)(req.user);
            Object.assign(filter, accessFilter);
        }
        // Apply additional filters
        if (Status)
            filter.Status = Status;
        if (Mode)
            filter.Mode = Mode;
        if (Patient)
            filter.Patient = Patient;
        if (search) {
            const rx = new RegExp(search, "i");
            filter.$or = [{ Patient: rx }, { Doctor: rx }, { Phone: rx }];
        }
        const [appts, total] = await Promise.all([
            appointmentModel_1.Appointment.find(filter)
                .select("_id Date_Time Patient Phone Patient_Image Doctor Mode Status Fees createdAt updatedAt")
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            appointmentModel_1.Appointment.countDocuments(filter),
        ]);
        res.json({
            data: appts.map(formatAppointmentResponse),
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
exports.getAllAppointments = getAllAppointments;
const getAppointmentById = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        const filter = (0, authMiddleware_1.buildAccessFilter)(req.user);
        // Use _id only (MongoDB ObjectId)
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            filter._id = new mongoose_1.default.Types.ObjectId(id);
        }
        else {
            return res.status(400).json({ message: "Invalid appointment ID format" });
        }
        const appt = await appointmentModel_1.Appointment.findOne(filter)
            .select("_id Date_Time Patient Phone Patient_Image Doctor Mode Status Fees createdAt updatedAt")
            .lean()
            .exec();
        if (!appt) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        res.json(formatAppointmentResponse(appt));
    }
    catch (err) {
        if (err?.name === "CastError") {
            return res.status(400).json({ message: "Invalid appointment id" });
        }
        next(err);
    }
};
exports.getAppointmentById = getAppointmentById;
const createAppointment = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const apptData = req.body;
        const validation = validateAppointmentData(apptData);
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.error });
        }
        // Remove id field if present (we use MongoDB's _id)
        const { id: _ignoredId, _id: _ignoredMongoId, ...cleanApptData } = apptData;
        // Explicitly delete id field to ensure it's not included (handles cases where id might be undefined/null/empty)
        delete cleanApptData.id;
        delete cleanApptData._id;
        const accessFilter = (0, authMiddleware_1.buildAccessFilter)(req.user);
        // Ensure hospital is ObjectId if provided
        let hospitalId;
        if (accessFilter.hospital) {
            // Hospital from user role (should be string from buildAccessFilter)
            if (typeof accessFilter.hospital === 'string') {
                if (mongoose_1.default.Types.ObjectId.isValid(accessFilter.hospital)) {
                    hospitalId = new mongoose_1.default.Types.ObjectId(accessFilter.hospital);
                }
                else {
                    return res.status(400).json({ message: "Invalid hospital ID format from user role" });
                }
            }
            else if (accessFilter.hospital instanceof mongoose_1.default.Types.ObjectId) {
                hospitalId = accessFilter.hospital;
            }
        }
        else if (cleanApptData.hospital) {
            // Hospital from request body (could be string or ObjectId)
            if (typeof cleanApptData.hospital === 'string') {
                if (mongoose_1.default.Types.ObjectId.isValid(cleanApptData.hospital)) {
                    hospitalId = new mongoose_1.default.Types.ObjectId(cleanApptData.hospital);
                }
                else {
                    return res.status(400).json({ message: "Invalid hospital ID format in request body" });
                }
            }
            else if (cleanApptData.hospital instanceof mongoose_1.default.Types.ObjectId) {
                hospitalId = cleanApptData.hospital;
            }
        }
        // Remove hospital and doctorId from cleanApptData if they exist (we'll add them separately)
        const { hospital, doctorId, ...finalApptData } = cleanApptData;
        // Ensure id and _id are not in finalApptData
        delete finalApptData.id;
        delete finalApptData._id;
        // Convert doctorId to ObjectId if provided
        let doctorObjectId;
        if (doctorId) {
            const doctorIdStr = String(doctorId).trim();
            if (mongoose_1.default.Types.ObjectId.isValid(doctorIdStr)) {
                doctorObjectId = new mongoose_1.default.Types.ObjectId(doctorIdStr);
            }
            else {
                return res.status(400).json({ message: "Invalid doctorId format. Must be a valid ObjectId." });
            }
        }
        const appointmentData = {
            ...finalApptData,
            ...(hospitalId && { hospital: hospitalId }),
            ...(doctorObjectId && { doctorId: doctorObjectId }),
        };
        const created = await appointmentModel_1.Appointment.create(appointmentData);
        res.status(201).json(formatAppointmentResponse(created));
    }
    catch (err) {
        // Handle MongoDB duplicate key error
        if (err?.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            // If the error is about 'id' field, provide a more helpful message
            if (field === 'id') {
                return res.status(409).json({
                    message: "An appointment with this identifier already exists. Please refresh and try again.",
                });
            }
            return res.status(409).json({
                message: `Appointment with this ${field} already exists`,
                key: err.keyValue
            });
        }
        if (err?.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        next(err);
    }
};
exports.createAppointment = createAppointment;
const updateAppointment = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        const updates = req.body;
        // Remove id field if present
        const { id: _ignoredId, _id: _ignoredMongoId, ...cleanUpdates } = updates;
        const validation = validateAppointmentData({
            Date_Time: cleanUpdates.Date_Time ?? "x",
            Patient: cleanUpdates.Patient ?? "x",
            Phone: cleanUpdates.Phone ?? "x",
            Doctor: cleanUpdates.Doctor ?? "x",
            Status: cleanUpdates.Status ?? "x",
        });
        if ((cleanUpdates.Date_Time || cleanUpdates.Patient || cleanUpdates.Phone || cleanUpdates.Doctor || cleanUpdates.Status) &&
            !validation.isValid) {
            return res.status(400).json({ message: validation.error });
        }
        const filter = (0, authMiddleware_1.buildAccessFilter)(req.user);
        // Use _id only (MongoDB ObjectId)
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            filter._id = new mongoose_1.default.Types.ObjectId(id);
        }
        else {
            return res.status(400).json({ message: "Invalid appointment ID format" });
        }
        const updated = await appointmentModel_1.Appointment.findOneAndUpdate(filter, { $set: cleanUpdates }, { new: true })
            .select("_id Date_Time Patient Phone Patient_Image Doctor Mode Status Fees createdAt updatedAt")
            .lean()
            .exec();
        if (!updated) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        res.json(formatAppointmentResponse(updated));
    }
    catch (err) {
        if (err?.name === "CastError") {
            return res.status(400).json({ message: "Invalid appointment id" });
        }
        next(err);
    }
};
exports.updateAppointment = updateAppointment;
const deleteAppointment = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        const filter = (0, authMiddleware_1.buildAccessFilter)(req.user);
        // Use _id only (MongoDB ObjectId)
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            filter._id = new mongoose_1.default.Types.ObjectId(id);
        }
        else {
            return res.status(400).json({ message: "Invalid appointment ID format" });
        }
        const deleted = await appointmentModel_1.Appointment.findOneAndDelete(filter).lean().exec();
        if (!deleted) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        res.status(204).send();
    }
    catch (err) {
        if (err?.name === "CastError") {
            return res.status(400).json({ message: "Invalid appointment id" });
        }
        next(err);
    }
};
exports.deleteAppointment = deleteAppointment;
