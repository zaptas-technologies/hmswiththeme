"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignationSchema = exports.SpecializationSchema = exports.ServiceSchema = exports.LeaveSchema = exports.StaffSchema = exports.AssetSchema = void 0;
const mongoose_1 = require("mongoose");
exports.AssetSchema = new mongoose_1.Schema({
    AssetID: { type: String, required: true, unique: true },
    AssetUser: { type: String, required: true },
    Image: { type: String },
    Assets: { type: String, required: true },
    PurchaseDate: { type: String, required: true },
    Warrenty: { type: String },
    WarrantyEnd: { type: String },
    Amount: { type: String, required: true },
    Status: {
        type: String,
        enum: ["Approved", "Pending", "Returned"],
        required: true,
    },
}, { timestamps: true, strict: false });
exports.StaffSchema = new mongoose_1.Schema({
    Staff: { type: String, required: true },
    Image: { type: String },
    Designation: { type: String, required: true },
    Role: { type: String, required: true },
    Phone: { type: String, required: true },
    Email: { type: String, required: true },
    Status: { type: String, enum: ["Available", "Unavailable"], required: true },
}, { timestamps: true, strict: false });
exports.LeaveSchema = new mongoose_1.Schema({
    ID: { type: String, required: true, unique: true },
    Employee: { type: String, required: true },
    Image: { type: String },
    LeaveType: { type: String, required: true },
    Date: { type: String, required: true },
    Day: { type: String, required: true },
    AppliedOn: { type: String, required: true },
    Status: { type: String, enum: ["Approved", "Rejected"], required: true },
}, { timestamps: true, strict: false });
exports.ServiceSchema = new mongoose_1.Schema({
    ServiceName: { type: String, required: true },
    Department: { type: String, required: true },
    Price: { type: String, required: true },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
}, { timestamps: true, strict: false });
exports.SpecializationSchema = new mongoose_1.Schema({
    Specialization: { type: String, required: true },
    img: { type: String },
    Image: { type: String },
    CreatedDate: { type: String },
    NoofDoctor: { type: String },
    Department: { type: String },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
}, { timestamps: true, strict: false });
exports.DesignationSchema = new mongoose_1.Schema({
    Designation: { type: String, required: true },
    Department: { type: String, required: true },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
}, { timestamps: true, strict: false });
