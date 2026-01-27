import mongoose, { Schema, Document } from "mongoose";

export interface TimeSlot {
  session: string; // "Morning", "Noon", etc.
  from: string; // HH:mm format
  to: string; // HH:mm format
}

export interface DaySchedule {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  timeSlots: TimeSlot[];
}

export interface DoctorScheduleDoc extends Document {
  doctorId: mongoose.Types.ObjectId;
  location: string;
  fromDate: Date;
  toDate: Date;
  recursEvery: string; // "1 Week", "1 Month", etc.
  schedules: DaySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema<TimeSlot>(
  {
    session: { type: String, required: true },
    from: { type: String, required: true }, // Format: "HH:mm"
    to: { type: String, required: true }, // Format: "HH:mm"
  },
  { _id: false }
);

const DayScheduleSchema = new Schema<DaySchedule>(
  {
    day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    timeSlots: { type: [TimeSlotSchema], default: [] },
  },
  { _id: false }
);

const DoctorScheduleSchema = new Schema<DoctorScheduleDoc>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    location: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    recursEvery: { type: String, required: true },
    schedules: { type: [DayScheduleSchema], default: [] },
  },
  { 
    timestamps: true,
    strict: true, // Ensure strict mode
  }
);

// Index for efficient queries
DoctorScheduleSchema.index({ doctorId: 1, fromDate: -1 });
DoctorScheduleSchema.index({ doctorId: 1, createdAt: -1 });

export const DoctorSchedule =
  mongoose.models.DoctorSchedule ||
  mongoose.model<DoctorScheduleDoc>("DoctorSchedule", DoctorScheduleSchema);
