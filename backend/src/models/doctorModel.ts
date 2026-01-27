import mongoose, { Schema, Document } from "mongoose";
import { DoctorSchema } from "./schemas/clinical";

export interface DoctorDoc extends Document {
  Name_Designation: string;
  img?: string;
  role?: string;
  Department?: string;
  Phone: string;
  Email: string;
  Fees?: string;
  Status: "Available" | "Unavailable";
  user?: mongoose.Types.ObjectId;
  hospital?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Add indexes for role-based access
DoctorSchema.index({ user: 1, createdAt: -1 });
DoctorSchema.index({ hospital: 1, createdAt: -1 });
DoctorSchema.index({ Email: 1 });
DoctorSchema.index({ Status: 1 });

export const Doctor =
  mongoose.models.Doctor ||
  mongoose.model<DoctorDoc>("Doctor", DoctorSchema, "doctors");
