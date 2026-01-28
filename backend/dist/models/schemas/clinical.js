"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRNSchema = exports.InventorySchema = exports.ConsultationSchema = exports.DoctorLeaveSchema = exports.PatientPrescriptionSchema = exports.DoctorPrescriptionSchema = exports.PatientAppointmentSchema = exports.DoctorAppointmentSchema = exports.PatientSchema = exports.DoctorSchema = exports.AppointmentSchema = void 0;
const mongoose_1 = require("mongoose");
exports.AppointmentSchema = new mongoose_1.Schema({
    Date_Time: { type: String, required: true },
    Patient: { type: String, required: true },
    Phone: { type: String, required: true },
    Patient_Image: { type: String },
    Doctor_Image: { type: String },
    Doctor: { type: String, required: true },
    role: { type: String },
    Mode: { type: String },
    Status: { type: String, required: true },
    Consultation_ID: { type: String, index: true }, // Reference to consultation document
    Fees: { type: mongoose_1.Schema.Types.Mixed },
    doctorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Doctor", index: true },
    hospital: { type: mongoose_1.Schema.Types.ObjectId, ref: "Hospital", index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
}, { timestamps: true, strict: false });
exports.DoctorSchema = new mongoose_1.Schema({
    Name_Designation: { type: String, required: true },
    img: { type: String },
    role: { type: String },
    Department: { type: String },
    Phone: { type: String, required: true },
    Email: { type: String, required: true },
    Fees: { type: String },
    Status: { type: String, enum: ["Available", "Unavailable"], required: true },
    hospital: { type: mongoose_1.Schema.Types.ObjectId, ref: "Hospital", index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
}, { timestamps: true, strict: false });
exports.PatientSchema = new mongoose_1.Schema({
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
    hospital: { type: mongoose_1.Schema.Types.ObjectId, ref: "Hospital", index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
}, { timestamps: true, strict: false });
exports.DoctorAppointmentSchema = new mongoose_1.Schema({
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
    Date_Time: { type: String, required: true },
    Doctor: { type: String, required: true },
    Doctor_Image: { type: String },
    Department: { type: String },
    Phone: { type: String },
    Status: { type: String, required: true },
}, { timestamps: true, strict: false });
exports.DoctorPrescriptionSchema = new mongoose_1.Schema({
    // Business identifier (human readable)
    Prescription_ID: { type: String, index: true },
    Date: { type: String, required: true },
    Prescribed_On: { type: String },
    // Display names (for backward compatibility and UI)
    Patient: { type: String, required: true },
    Patient_Image: { type: String },
    Doctor: { type: String, required: true },
    Medicine: { type: String, required: true },
    Status: { type: String, required: true },
    Dosage: { type: String },
    Frequency: { type: String },
    Duration: { type: String },
    // MongoDB ObjectId references (required for proper relationships)
    Appointment_ID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Patient", index: true },
    doctorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Doctor", index: true },
    consultationId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Consultation", index: true }, // Replaces Consultation_ID string
    // If medicine is selected from inventory, store the inventory document _id
    inventoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Inventory", index: true },
    // Role-based access
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
    hospital: { type: mongoose_1.Schema.Types.ObjectId, ref: "Hospital", index: true },
}, { timestamps: true, strict: false });
exports.PatientPrescriptionSchema = new mongoose_1.Schema({
    Date: { type: String, required: true },
    Doctor: { type: String, required: true },
    Doctor_Image: { type: String },
    Medicine: { type: String, required: true },
    Status: { type: String, required: true },
}, { timestamps: true, strict: false });
exports.DoctorLeaveSchema = new mongoose_1.Schema({
    Doctor: { type: String, required: true },
    Doctor_Id: { type: String },
    Date: { type: String, required: true }, // Format: "15 Apr 2026- 15 Apr 2025" or date range
    From_Date: { type: Date },
    To_Date: { type: Date },
    Leave_Type: { type: String, required: true },
    Day: { type: String, required: true }, // Format: "01 Day" or "02 Days"
    No_Of_Days: { type: Number },
    Applied_On: { type: String, required: true },
    Applied_On_Date: { type: Date },
    Status: {
        type: String,
        enum: ["Applied", "Approved", "Rejected"],
        required: true,
        default: "Applied"
    },
    Reason: { type: String },
    Department: { type: String },
    Designation: { type: String },
}, { timestamps: true, strict: false });
exports.ConsultationSchema = new mongoose_1.Schema({
    // Use MongoDB _id as the primary consultation identifier.
    // Appointment link MUST be stored as ObjectId.
    Appointment_ID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    Patient: { type: String, required: true },
    Patient_Image: { type: String },
    Doctor: { type: String, required: true },
    Doctor_Image: { type: String },
    // Vitals
    Vitals: {
        temperature: { type: String },
        pulse: { type: String },
        respiratoryRate: { type: String },
        spo2: { type: String },
        height: { type: String },
        weight: { type: String },
        bmi: { type: String },
        waist: { type: String },
    },
    // Complaints
    Complaints: [{
            complaint: { type: String, required: true },
            duration: { type: String },
        }],
    // Diagnosis
    Diagnosis: [{
            diagnosis: { type: String, required: true },
            type: { type: String },
        }],
    // Medications
    Medications: [{
            medicine: { type: String, required: true },
            dosage: { type: String },
            frequency: { type: String },
            duration: { type: String },
            // Optional link to inventory item when medicine comes from inventory
            inventoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Inventory", index: true },
        }],
    // Advice
    Advice: [{
            advice: { type: String, required: true },
        }],
    // Investigations
    Investigations: [{
            investigation: { type: String, required: true },
            notes: { type: String },
        }],
    // Follow Up
    FollowUp: {
        nextConsultation: { type: String },
        emptyStomach: { type: String },
    },
    // Invoice
    Invoice: [{
            item: { type: String, required: true },
            quantity: { type: Number, default: 1 },
            price: { type: Number, required: true },
            total: { type: Number, required: true },
            paymentMode: { type: String },
        }],
    // Status
    Status: {
        type: String,
        enum: ["Draft", "Completed", "Cancelled"],
        default: "Draft",
    },
    // Consultation Date
    Consultation_Date: { type: Date, default: Date.now },
    Completed_At: { type: Date },
}, { timestamps: true, strict: false });
exports.InventorySchema = new mongoose_1.Schema({
    Item_Name: { type: String, required: true },
    Item_Code: { type: String },
    Category: { type: String },
    Manufacturer: { type: String },
    Batch_Number: { type: String },
    Expiry_Date: { type: Date, required: true },
    Quantity: { type: Number, required: true, default: 0 },
    Unit: { type: String, default: "pcs" },
    Unit_Price: { type: Number, default: 0 },
    Total_Value: { type: Number, default: 0 },
    Location: { type: String },
    Supplier: { type: String },
    Status: {
        type: String,
        enum: ["Available", "Low Stock", "Out of Stock", "Expired"],
        default: "Available"
    },
    Notes: { type: String },
    hospital: { type: mongoose_1.Schema.Types.ObjectId, index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, index: true },
}, { timestamps: true, strict: false });
exports.GRNSchema = new mongoose_1.Schema({
    GRN_Number: { type: String, required: true, unique: true },
    GRN_Date: { type: Date, required: true, default: Date.now },
    Supplier: { type: String, required: true },
    Supplier_Invoice: { type: String },
    Items: [{
            Item_Name: { type: String, required: true },
            Item_Code: { type: String },
            Batch_Number: { type: String },
            Expiry_Date: { type: Date, required: true },
            Quantity: { type: Number, required: true },
            Unit: { type: String, default: "pcs" },
            Unit_Price: { type: Number, required: true },
            Total_Price: { type: Number, required: true },
        }],
    Total_Amount: { type: Number, required: true, default: 0 },
    Status: {
        type: String,
        enum: ["Draft", "Received", "Cancelled"],
        default: "Draft",
    },
    Received_By: { type: String },
    Notes: { type: String },
    hospital: { type: mongoose_1.Schema.Types.ObjectId, index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, index: true },
}, { timestamps: true, strict: false });
