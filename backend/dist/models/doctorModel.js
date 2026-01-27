"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Doctor = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const clinical_1 = require("./schemas/clinical");
// Add indexes for role-based access
clinical_1.DoctorSchema.index({ user: 1, createdAt: -1 });
clinical_1.DoctorSchema.index({ hospital: 1, createdAt: -1 });
clinical_1.DoctorSchema.index({ Email: 1 });
clinical_1.DoctorSchema.index({ Status: 1 });
exports.Doctor = mongoose_1.default.models.Doctor ||
    mongoose_1.default.model("Doctor", clinical_1.DoctorSchema, "doctors");
