import mongoose, { Schema, Document } from "mongoose";
import { AppointmentSchema } from "./schemas/clinical";

export interface AppointmentDoc extends Document {
  Date_Time: string;
  appointmentDate?: string; // YYYY-MM-DD
  slotTime?: string; // HH:mm
  dateTime?: Date;
  Patient: string;
  Phone: string;
  Patient_Image?: string;
  Doctor_Image?: string;
  Doctor: string;
  role?: string;
  Mode?: string;
  Status: string;
  Consultation_ID?: string;
  Fees?: string | number;
  amountPaid?: number;
  paymentStatus?: "Paid" | "Pending" | "Refunded";
  paymentMode?: string;
  doctorId?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  hospital?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Add indexes for role-based access
AppointmentSchema.index({ user: 1, createdAt: -1 });
AppointmentSchema.index({ hospital: 1, createdAt: -1 });
AppointmentSchema.index({ Doctor: 1, createdAt: -1 });
AppointmentSchema.index({ doctorId: 1, createdAt: -1 });
AppointmentSchema.index({ Status: 1, createdAt: -1 });

// Prevent double-booking the same doctor slot (ignore Cancelled).
// Note: uses a partial index so legacy docs without appointmentDate/slotTime won't break.
AppointmentSchema.index(
  { doctorId: 1, hospital: 1, appointmentDate: 1, slotTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      appointmentDate: { $type: "string" },
      slotTime: { $type: "string" },
      Status: { $ne: "Cancelled" },
    },
  }
);

export const Appointment =
  mongoose.models.Appointment ||
  mongoose.model<AppointmentDoc>("Appointment", AppointmentSchema, "appointments");
