"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientPrescriptionSchema = exports.DoctorPrescriptionSchema = exports.PatientAppointmentSchema = exports.DoctorAppointmentSchema = exports.PatientSchema = exports.DoctorSchema = exports.AppointmentSchema = void 0;
const mongoose_1 = require("mongoose");
exports.AppointmentSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Date_Time: { type: String, required: true },
    Patient: { type: String, required: true },
    Phone: { type: String, required: true },
    Patient_Image: { type: String },
    Doctor_Image: { type: String },
    Doctor: { type: String, required: true },
    role: { type: String },
    Mode: { type: String },
    Status: { type: String, required: true },
}, { timestamps: true, strict: false });
exports.DoctorSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Name_Designation: { type: String, required: true },
    img: { type: String },
    role: { type: String },
    Department: { type: String },
    Phone: { type: String, required: true },
    Email: { type: String, required: true },
    Fees: { type: String },
    Status: { type: String, enum: ["Available", "Unavailable"], required: true },
}, { timestamps: true, strict: false });
exports.PatientSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Patient: { type: String, required: true },
    Gender: { type: String },
    Patient_img: { type: String },
    Doctor_img: { type: String },
    Phone: { type: String, required: true },
    Doctor: { type: String },
    Role: { type: String },
    Address: { type: String },
    Last_Visit: { type: String },
    Status: { type: String, enum: ["Available", "Unavailable"], required: true },
}, { timestamps: true, strict: false });
exports.DoctorAppointmentSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Date_Time: { type: String, required: true },
    Patient: { type: String, required: true },
    Phone: { type: String },
    Patient_Image: { type: String },
    Doctor_Image: { type: String },
    Doctor: { type: String },
    role: { type: String },
    Mode: { type: String },
    Status: { type: String, required: true },
}, { timestamps: true, strict: false });
exports.PatientAppointmentSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Date_Time: { type: String, required: true },
    Doctor: { type: String, required: true },
    Doctor_Image: { type: String },
    Department: { type: String },
    Phone: { type: String },
    Status: { type: String, required: true },
}, { timestamps: true, strict: false });
exports.DoctorPrescriptionSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Date: { type: String, required: true },
    Patient: { type: String, required: true },
    Patient_Image: { type: String },
    Doctor: { type: String, required: true },
    Medicine: { type: String, required: true },
    Status: { type: String, required: true },
}, { timestamps: true, strict: false });
exports.PatientPrescriptionSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    Date: { type: String, required: true },
    Doctor: { type: String, required: true },
    Doctor_Image: { type: String },
    Medicine: { type: String, required: true },
    Status: { type: String, required: true },
}, { timestamps: true, strict: false });
