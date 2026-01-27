import mongoose, { Schema, Document } from "mongoose";
import { AppointmentSchema } from "./schemas/clinical";

export interface AppointmentDoc extends Document {
  id: string;
  Date_Time: string;
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
  doctorId?: string;
  user?: mongoose.Types.ObjectId;
  hospital?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Add indexes for role-based access
AppointmentSchema.index({ user: 1, createdAt: -1 });
AppointmentSchema.index({ hospital: 1, createdAt: -1 });
AppointmentSchema.index({ Doctor: 1, createdAt: -1 });
AppointmentSchema.index({ Status: 1, createdAt: -1 });

export const Appointment =
  mongoose.models.Appointment ||
  mongoose.model<AppointmentDoc>("Appointment", AppointmentSchema, "appointments");
