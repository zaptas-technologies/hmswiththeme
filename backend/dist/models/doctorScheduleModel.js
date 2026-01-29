"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorSchedule = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TimeSlotSchema = new mongoose_1.Schema({
    session: { type: String, required: true },
    from: { type: String, required: true }, // Format: "HH:mm"
    to: { type: String, required: true }, // Format: "HH:mm"
}, { _id: false });
const DayScheduleSchema = new mongoose_1.Schema({
    day: {
        type: String,
        required: true,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    timeSlots: { type: [TimeSlotSchema], default: [] },
}, { _id: false });
const DoctorScheduleSchema = new mongoose_1.Schema({
    doctorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    location: { type: String, required: true },
    hospital: { type: mongoose_1.Schema.Types.ObjectId, ref: "Hospital", index: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    recursEvery: { type: String, required: true },
    schedules: { type: [DayScheduleSchema], default: [] },
}, {
    timestamps: true,
    strict: true, // Ensure strict mode
});
// Index for efficient queries
DoctorScheduleSchema.index({ doctorId: 1, fromDate: -1 });
DoctorScheduleSchema.index({ doctorId: 1, createdAt: -1 });
DoctorScheduleSchema.index({ doctorId: 1, hospital: 1 }); // For hospital-based filtering
exports.DoctorSchedule = mongoose_1.default.models.DoctorSchedule ||
    mongoose_1.default.model("DoctorSchedule", DoctorScheduleSchema);
