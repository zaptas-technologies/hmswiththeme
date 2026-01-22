"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDoctor = exports.updateDoctor = exports.createDoctor = exports.getDoctorById = exports.getAllDoctors = void 0;
const resourceRegistry_1 = require("../models/resourceRegistry");
const mongoose_1 = __importDefault(require("mongoose"));
// Helper to format doctor response
const formatDoctorResponse = (doctor) => {
    const doc = doctor.toObject ? doctor.toObject() : doctor;
    return {
        ...doc,
        _id: doc._id?.toString() || doc._id,
        id: doc.id || doc._id?.toString(),
    };
};
// Validation helper
const validateDoctorData = (data) => {
    if (!data.Name_Designation || typeof data.Name_Designation !== "string" || data.Name_Designation.trim() === "") {
        return { isValid: false, error: "Name_Designation is required" };
    }
    if (!data.Email || typeof data.Email !== "string" || data.Email.trim() === "") {
        return { isValid: false, error: "Email is required" };
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.Email)) {
        return { isValid: false, error: "Invalid email format" };
    }
    if (!data.Phone || typeof data.Phone !== "string" || data.Phone.trim() === "") {
        return { isValid: false, error: "Phone is required" };
    }
    if (!data.Status || !["Available", "Unavailable"].includes(data.Status)) {
        return { isValid: false, error: "Status must be 'Available' or 'Unavailable'" };
    }
    return { isValid: true };
};
// GET /api/doctors - Get all doctors with pagination
const getAllDoctors = async (req, res, next) => {
    try {
        const Model = (0, resourceRegistry_1.getResourceModel)("doctors");
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || "-createdAt";
        const [doctors, total] = await Promise.all([
            Model.find({}).sort(sort).skip(skip).limit(limit).exec(),
            Model.countDocuments({}),
        ]);
        res.json({
            data: doctors.map(formatDoctorResponse),
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
exports.getAllDoctors = getAllDoctors;
// GET /api/doctors/:id - Get doctor by ID
const getDoctorById = async (req, res, next) => {
    try {
        const Model = (0, resourceRegistry_1.getResourceModel)("doctors");
        const { id } = req.params;
        let doctor;
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            doctor = await Model.findById(id);
        }
        if (!doctor) {
            doctor = await Model.findOne({ id });
        }
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        res.json(formatDoctorResponse(doctor));
    }
    catch (err) {
        next(err);
    }
};
exports.getDoctorById = getDoctorById;
// POST /api/doctors - Create new doctor
const createDoctor = async (req, res, next) => {
    try {
        const Model = (0, resourceRegistry_1.getResourceModel)("doctors");
        const doctorData = req.body;
        // Validate required fields
        const validation = validateDoctorData(doctorData);
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.error });
        }
        // Generate ID if not provided
        if (!doctorData.id) {
            doctorData.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        }
        // Check if doctor with same email or id already exists
        const existingByEmail = await Model.findOne({ Email: doctorData.Email });
        if (existingByEmail) {
            return res.status(409).json({ message: "Doctor with this email already exists" });
        }
        const existingById = await Model.findOne({ id: doctorData.id });
        if (existingById) {
            return res.status(409).json({ message: "Doctor with this ID already exists" });
        }
        const doctor = await Model.create(doctorData);
        res.status(201).json(formatDoctorResponse(doctor));
    }
    catch (err) {
        // Handle MongoDB duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(409).json({
                message: `Doctor with this ${field} already exists`
            });
        }
        // Handle validation errors
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
exports.createDoctor = createDoctor;
// PATCH /api/doctors/:id - Update doctor
const updateDoctor = async (req, res, next) => {
    try {
        const Model = (0, resourceRegistry_1.getResourceModel)("doctors");
        const { id } = req.params;
        const updateData = req.body;
        // Don't allow updating id or _id
        const { id: _ignoredId, _id: _ignoredMongoId, ...cleanUpdateData } = updateData;
        // Validate if updating required fields
        if (updateData.Email || updateData.Phone || updateData.Name_Designation || updateData.Status) {
            const validation = validateDoctorData({ ...updateData, Email: updateData.Email || "", Phone: updateData.Phone || "", Name_Designation: updateData.Name_Designation || "", Status: updateData.Status || "Available" });
            if (!validation.isValid && (updateData.Email || updateData.Phone || updateData.Name_Designation || updateData.Status)) {
                return res.status(400).json({ message: validation.error });
            }
        }
        // Find doctor by _id or id
        let doctor;
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            doctor = await Model.findById(id);
        }
        if (!doctor) {
            doctor = await Model.findOne({ id });
        }
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        // Check for email conflict if email is being updated
        if (updateData.Email && updateData.Email !== doctor.Email) {
            const existingByEmail = await Model.findOne({ Email: updateData.Email });
            if (existingByEmail && existingByEmail._id.toString() !== doctor._id.toString()) {
                return res.status(409).json({ message: "Doctor with this email already exists" });
            }
        }
        // Update doctor
        Object.assign(doctor, cleanUpdateData);
        await doctor.save();
        res.json(formatDoctorResponse(doctor));
    }
    catch (err) {
        // Handle MongoDB duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(409).json({
                message: `Doctor with this ${field} already exists`
            });
        }
        // Handle validation errors
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
exports.updateDoctor = updateDoctor;
// DELETE /api/doctors/:id - Delete doctor
const deleteDoctor = async (req, res, next) => {
    try {
        const Model = (0, resourceRegistry_1.getResourceModel)("doctors");
        const { id } = req.params;
        let doctor;
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            doctor = await Model.findByIdAndDelete(id);
        }
        if (!doctor) {
            doctor = await Model.findOneAndDelete({ id });
        }
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        res.json({ message: "Doctor deleted successfully", id: doctor._id?.toString() || doctor.id });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteDoctor = deleteDoctor;
