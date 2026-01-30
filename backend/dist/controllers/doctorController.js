"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDoctor = exports.updateDoctor = exports.createDoctor = exports.getDoctorById = exports.getAllDoctors = exports.uploadDoctorImage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const doctorModel_1 = require("../models/doctorModel");
const userModel_1 = require("../models/userModel");
const doctorScheduleModel_1 = require("../models/doctorScheduleModel");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadDoctorImage_1 = require("../middlewares/uploadDoctorImage");
const uploadDoctorImage = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const file = req.file;
        if (!file?.filename) {
            return res.status(400).json({ message: "No image uploaded" });
        }
        const relativePath = (0, uploadDoctorImage_1.getDoctorUploadPath)(file.filename);
        // Return path only for DB storage (deployment-safe). Client builds full URL from API origin.
        return res.status(201).json({
            path: relativePath,
            filename: file.filename,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.uploadDoctorImage = uploadDoctorImage;
// Helper to format doctor response
const formatDoctorResponse = (doctor) => {
    const doc = doctor.toObject ? doctor.toObject() : doctor;
    return {
        ...doc,
        _id: doc._id?.toString() || doc._id,
        id: doc._id?.toString() || doc._id, // For backward compatibility, map _id to id
        // Ensure img field is included (use img or avatar field)
        img: doc.img || doc.avatar || "assets/img/doctors/doctor-01.jpg",
        // Map role to Designation if needed
        Designation: doc.role || doc.Designation,
        // Ensure all optional fields have default values
        languageSpoken: doc.languageSpoken || [],
        schedules: doc.schedules || [],
        education: doc.education || [],
        awards: doc.awards || [],
        certifications: doc.certifications || [],
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
    // Time slot minutes (required, default handled in schema but we validate if provided)
    if (data.timeSlotMinutes !== undefined) {
        const n = Number(data.timeSlotMinutes);
        if (!Number.isFinite(n) || n <= 0) {
            return { isValid: false, error: "timeSlotMinutes must be a positive number" };
        }
    }
    return { isValid: true };
};
const getAllDoctors = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || "-createdAt";
        const filter = (0, authMiddleware_1.buildAccessFilter)(req.user);
        const [doctors, total] = await Promise.all([
            doctorModel_1.Doctor.find(filter)
                .select("_id Name_Designation img role Department Phone Email Fees Status timeSlotMinutes createdAt updatedAt")
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            doctorModel_1.Doctor.countDocuments(filter),
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
/** Resolve current hospital ID for the logged-in user (for schedule filtering). */
async function getCurrentHospitalId(req) {
    if (!req.user)
        return undefined;
    if (req.user.role === "HOSPITAL_ADMIN" || req.user.role === "PHARMACIST") {
        if (req.user.hospitalId && mongoose_1.default.Types.ObjectId.isValid(req.user.hospitalId)) {
            return new mongoose_1.default.Types.ObjectId(req.user.hospitalId);
        }
        return undefined;
    }
    if (req.user.role === "USER") {
        const doctor = await doctorModel_1.Doctor.findOne({ user: req.user.userId }).select("hospital").lean();
        if (doctor?.hospital && mongoose_1.default.Types.ObjectId.isValid(doctor.hospital.toString())) {
            return new mongoose_1.default.Types.ObjectId(doctor.hospital.toString());
        }
        return undefined;
    }
    return undefined; // SUPER_ADMIN: no single current hospital
}
const getDoctorById = async (req, res, next) => {
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
            return res.status(400).json({ message: "Invalid doctor ID format" });
        }
        const doctor = await doctorModel_1.Doctor.findOne(filter)
            .lean()
            .exec();
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        const doctorIdObj = new mongoose_1.default.Types.ObjectId(doctor._id?.toString?.() ?? doctor._id);
        const currentHospitalId = await getCurrentHospitalId(req);
        console.log("[getDoctorById] doctorId:", doctorIdObj.toString(), "currentHospitalId:", currentHospitalId?.toString() ?? "none", "user.role:", req.user?.role);
        const scheduleFilter = { doctorId: doctorIdObj };
        if (currentHospitalId) {
            scheduleFilter.hospital = currentHospitalId;
        }
        console.log("[getDoctorById] scheduleFilter:", JSON.stringify({ doctorId: scheduleFilter.doctorId.toString(), hospital: scheduleFilter.hospital?.toString() }));
        const scheduleCountForDoctor = await doctorScheduleModel_1.DoctorSchedule.countDocuments({ doctorId: doctorIdObj });
        console.log("[getDoctorById] DoctorSchedule count for this doctorId:", scheduleCountForDoctor);
        let doctorScheduleDoc = await doctorScheduleModel_1.DoctorSchedule.findOne(scheduleFilter)
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        console.log("[getDoctorById] first query (by doctorId + hospital): found =", !!doctorScheduleDoc);
        // Fallback: if no schedule for current hospital, use latest schedule for this doctor (any hospital)
        if (!doctorScheduleDoc) {
            doctorScheduleDoc = await doctorScheduleModel_1.DoctorSchedule.findOne({ doctorId: doctorIdObj })
                .sort({ createdAt: -1 })
                .lean()
                .exec();
            console.log("[getDoctorById] fallback (by doctorId only): found =", !!doctorScheduleDoc, doctorScheduleDoc ? { _id: doctorScheduleDoc._id, hospital: doctorScheduleDoc.hospital } : "");
        }
        console.log("[getDoctorById] scheduleDetail:", doctorScheduleDoc ? "included" : "null");
        const response = formatDoctorResponse(doctor);
        response.scheduleDetail = doctorScheduleDoc
            ? {
                location: doctorScheduleDoc.location,
                fromDate: doctorScheduleDoc.fromDate.toISOString?.()?.split("T")[0] ?? doctorScheduleDoc.fromDate,
                toDate: doctorScheduleDoc.toDate.toISOString?.()?.split("T")[0] ?? doctorScheduleDoc.toDate,
                recursEvery: doctorScheduleDoc.recursEvery,
                schedules: doctorScheduleDoc.schedules ?? [],
            }
            : null;
        res.json(response);
    }
    catch (err) {
        next(err);
    }
};
exports.getDoctorById = getDoctorById;
const createDoctor = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const doctorData = req.body;
        // Validate required fields
        const validation = validateDoctorData(doctorData);
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.error });
        }
        // Remove id field if present (we use MongoDB's _id)
        const { id: _ignoredId, ...cleanDoctorData } = doctorData;
        // Normalize email for checking (lowercase, trim)
        const normalizedEmail = cleanDoctorData.Email.toLowerCase().trim();
        // Check if doctor with same email already exists (case-insensitive using regex)
        // Check both Email and email fields since schema might use either
        const emailRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const existingByEmail = await doctorModel_1.Doctor.findOne({
            $or: [
                { email: emailRegex },
                { Email: emailRegex }
            ]
        })
            .lean()
            .exec();
        if (existingByEmail) {
            return res.status(409).json({
                message: "Doctor with this email already exists",
                email: normalizedEmail
            });
        }
        // Check if user account already exists with this email
        const existingUser = await userModel_1.User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                message: "User account with this email already exists",
                email: normalizedEmail
            });
        }
        // Extract password and schedule-related fields before creating doctor
        const { password, email, schedules, scheduleLocation, scheduleFromDate, scheduleToDate, scheduleRecursEvery, ...doctorRecordData } = cleanDoctorData;
        doctorRecordData.Email = normalizedEmail;
        const accessFilter = (0, authMiddleware_1.buildAccessFilter)(req.user);
        // Ensure hospital is ObjectId if provided
        // Priority: accessFilter (from user role) > doctorRecordData (from request body)
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
        else if (doctorRecordData.hospital) {
            // Hospital from request body (could be string or ObjectId)
            if (typeof doctorRecordData.hospital === 'string') {
                if (mongoose_1.default.Types.ObjectId.isValid(doctorRecordData.hospital)) {
                    hospitalId = new mongoose_1.default.Types.ObjectId(doctorRecordData.hospital);
                }
                else {
                    return res.status(400).json({ message: "Invalid hospital ID format in request body" });
                }
            }
            else if (doctorRecordData.hospital instanceof mongoose_1.default.Types.ObjectId) {
                hospitalId = doctorRecordData.hospital;
            }
        }
        // Remove hospital from doctorRecordData if it exists (we'll add it separately)
        const { hospital, ...finalDoctorData } = doctorRecordData;
        const doctor = await doctorModel_1.Doctor.create({
            ...finalDoctorData,
            ...(hospitalId && { hospital: hospitalId }),
        });
        // Save schedules to DoctorSchedule model if schedules are provided
        if (schedules && schedules.length > 0) {
            try {
                // Validate required schedule metadata
                if (!scheduleLocation || scheduleLocation.trim() === "") {
                    throw new Error("Schedule location is required when schedules are provided");
                }
                if (!scheduleFromDate || !scheduleToDate) {
                    throw new Error("Schedule start date and end date are required when schedules are provided");
                }
                // Parse dates
                const fromDate = new Date(scheduleFromDate);
                const toDate = new Date(scheduleToDate);
                // Validate dates
                if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                    throw new Error("Invalid date format for schedule dates");
                }
                if (toDate < fromDate) {
                    throw new Error("Schedule end date must be after start date");
                }
                const location = scheduleLocation.trim();
                const recursEvery = scheduleRecursEvery || "1 Week";
                // Use doctor._id as ObjectId for DoctorSchedule
                const doctorId = doctor._id;
                await doctorScheduleModel_1.DoctorSchedule.create({
                    doctorId,
                    location,
                    fromDate,
                    toDate,
                    recursEvery,
                    schedules: schedules.map(schedule => ({
                        day: schedule.day,
                        timeSlots: schedule.timeSlots.map(slot => ({
                            session: slot.session,
                            from: slot.from,
                            to: slot.to,
                        })),
                    })),
                });
            }
            catch (scheduleErr) {
                // If schedule creation fails, delete the doctor and return error
                await doctorModel_1.Doctor.findByIdAndDelete(doctor._id);
                console.error("Failed to create doctor schedule:", scheduleErr);
                return res.status(400).json({
                    message: `Failed to create doctor schedule: ${scheduleErr.message || "Unknown error"}`
                });
            }
        }
        // Create user account for login if password is provided
        if (password) {
            try {
                await userModel_1.User.create({
                    email: normalizedEmail,
                    password: password,
                    name: doctorData.Name_Designation.split(" - ")[0] || doctorData.Name_Designation, // Extract name from Name_Designation
                    phone: doctorData.Phone,
                    role: "doctor",
                    specialization: doctorData.Department,
                });
            }
            catch (userErr) {
                await doctorModel_1.Doctor.findByIdAndDelete(doctor._id);
                // Also delete schedule if it was created
                if (schedules && schedules.length > 0) {
                    await doctorScheduleModel_1.DoctorSchedule.deleteMany({ doctorId: doctor._id });
                }
                if (userErr.code === 11000) {
                    return res.status(409).json({ message: "User account with this email already exists" });
                }
                throw userErr;
            }
        }
        res.status(201).json(formatDoctorResponse(doctor));
    }
    catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            const fieldName = field === 'Email' || field === 'email' ? 'email' : field;
            return res.status(409).json({
                message: `Doctor with this ${fieldName} already exists`,
                field: fieldName,
                duplicateKey: err.keyValue
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
const updateDoctor = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        const updateData = req.body;
        // Extract password and schedule-related fields (schedule is stored in DoctorSchedule, not on doctor doc)
        const { password, id: _ignoredId, _id: _ignoredMongoId, schedules: updateSchedules, scheduleLocation: updateScheduleLocation, scheduleFromDate: updateScheduleFromDate, scheduleToDate: updateScheduleToDate, scheduleRecursEvery: updateScheduleRecursEvery, ...cleanUpdateData } = updateData;
        // Validate if updating required fields
        if (updateData.Email || updateData.Phone || updateData.Name_Designation || updateData.Status) {
            const validation = validateDoctorData({ ...updateData, Email: updateData.Email || "", Phone: updateData.Phone || "", Name_Designation: updateData.Name_Designation || "", Status: updateData.Status || "Available" });
            if (!validation.isValid && (updateData.Email || updateData.Phone || updateData.Name_Designation || updateData.Status)) {
                return res.status(400).json({ message: validation.error });
            }
        }
        const filter = (0, authMiddleware_1.buildAccessFilter)(req.user);
        // Use _id only (MongoDB ObjectId)
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            filter._id = new mongoose_1.default.Types.ObjectId(id);
        }
        else {
            return res.status(400).json({ message: "Invalid doctor ID format" });
        }
        const doctor = await doctorModel_1.Doctor.findOne(filter).exec();
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        // Save old email before updating (needed for user account lookup)
        const oldEmail = doctor.Email?.toLowerCase();
        if (updateData.Email && updateData.Email !== doctor.Email) {
            const existingByEmail = await doctorModel_1.Doctor.findOne({ Email: updateData.Email })
                .lean()
                .exec();
            if (existingByEmail && existingByEmail._id.toString() !== doctor._id.toString()) {
                return res.status(409).json({ message: "Doctor with this email already exists" });
            }
            // Also check if user account exists with new email
            const existingUser = await userModel_1.User.findOne({ email: updateData.Email.toLowerCase() });
            if (existingUser) {
                return res.status(409).json({ message: "User account with this email already exists" });
            }
        }
        // Update doctor (without password and without schedule fields)
        Object.assign(doctor, cleanUpdateData);
        await doctor.save();
        // Upsert DoctorSchedule if schedule data is provided
        if (updateSchedules &&
            Array.isArray(updateSchedules) &&
            updateSchedules.length > 0 &&
            updateScheduleLocation?.trim() &&
            updateScheduleFromDate &&
            updateScheduleToDate) {
            const fromDate = new Date(updateScheduleFromDate);
            const toDate = new Date(updateScheduleToDate);
            if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime()) && toDate >= fromDate) {
                const doctorId = doctor._id;
                const location = updateScheduleLocation.trim();
                const recursEvery = updateScheduleRecursEvery || "1 Week";
                const normalizedSchedules = updateSchedules.map((s) => ({
                    day: s.day,
                    timeSlots: (s.timeSlots || []).map((slot) => ({
                        session: slot.session ?? "",
                        from: slot.from ?? "",
                        to: slot.to ?? "",
                    })),
                }));
                const existingSchedule = await doctorScheduleModel_1.DoctorSchedule.findOne({ doctorId }).sort({ createdAt: -1 }).exec();
                if (existingSchedule) {
                    existingSchedule.set({
                        location,
                        fromDate,
                        toDate,
                        recursEvery,
                        schedules: normalizedSchedules,
                    });
                    existingSchedule.markModified("schedules");
                    await existingSchedule.save();
                }
                else {
                    const doctorForHospital = await doctorModel_1.Doctor.findById(doctorId).select("hospital").lean();
                    const hospitalId = doctorForHospital?.hospital
                        ? new mongoose_1.default.Types.ObjectId(doctorForHospital.hospital.toString())
                        : undefined;
                    await doctorScheduleModel_1.DoctorSchedule.create({
                        doctorId,
                        location,
                        fromDate,
                        toDate,
                        recursEvery,
                        schedules: normalizedSchedules,
                        ...(hospitalId && { hospital: hospitalId }),
                    });
                }
            }
        }
        // Update user account if email or password is being changed
        // Find user by old email (before update)
        let user = oldEmail ? await userModel_1.User.findOne({ email: oldEmail }) : null;
        // If email is being updated and user not found by old email, try new email
        if (!user && updateData.Email) {
            user = await userModel_1.User.findOne({ email: updateData.Email.toLowerCase() });
        }
        if (user) {
            // Update existing user account
            if (updateData.Email && updateData.Email !== doctor.Email) {
                user.email = updateData.Email.toLowerCase();
            }
            if (password) {
                user.password = password; // Will be hashed by the pre-save hook
            }
            // Update name and phone if they changed
            const doctorName = updateData.Name_Designation?.split(" - ")[0] || updateData.Name_Designation || doctor.Name_Designation?.split(" - ")[0] || doctor.Name_Designation;
            if (doctorName) {
                user.name = doctorName;
            }
            if (updateData.Phone) {
                user.phone = updateData.Phone;
            }
            if (updateData.Department) {
                user.specialization = updateData.Department;
            }
            await user.save();
        }
        else if (password) {
            // If user doesn't exist but password is provided, create user account
            // This handles the case where doctor was created before user accounts were implemented
            const newEmail = updateData.Email || doctor.Email;
            if (newEmail) {
                try {
                    await userModel_1.User.create({
                        email: newEmail.toLowerCase(),
                        password: password,
                        name: updateData.Name_Designation?.split(" - ")[0] || updateData.Name_Designation || doctor.Name_Designation?.split(" - ")[0] || doctor.Name_Designation,
                        phone: updateData.Phone || doctor.Phone,
                        role: "doctor",
                        specialization: updateData.Department || doctor.Department,
                    });
                }
                catch (userErr) {
                    if (userErr.code === 11000) {
                        return res.status(409).json({ message: "User account with this email already exists" });
                    }
                    throw userErr;
                }
            }
        }
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
const deleteDoctor = async (req, res, next) => {
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
            return res.status(400).json({ message: "Invalid doctor ID format" });
        }
        const doctor = await doctorModel_1.Doctor.findOneAndDelete(filter)
            .lean()
            .exec();
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        res.json({ message: "Doctor deleted successfully", id: doctor._id?.toString() || "" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteDoctor = deleteDoctor;
