import mongoose, { Schema } from "mongoose";

export type DashboardAvailabilityDoc = {
  doctorId: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  window: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const DashboardAvailabilitySchema = new Schema<DashboardAvailabilityDoc>(
  {
    doctorId: { type: String, required: true, index: true },
    day: { type: String, required: true, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    window: { type: String, default: null },
  },
  { timestamps: true }
);

DashboardAvailabilitySchema.index({ doctorId: 1, day: 1 }, { unique: true });

export const DashboardAvailability =
  mongoose.models.DashboardAvailability ||
  mongoose.model<DashboardAvailabilityDoc>("DashboardAvailability", DashboardAvailabilitySchema);

