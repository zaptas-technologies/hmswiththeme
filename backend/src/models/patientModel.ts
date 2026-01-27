import mongoose, { Schema, Document } from "mongoose";
import { PatientSchema } from "./schemas/clinical";

export interface PatientDoc extends Document {
  id: string;
  Patient: string;
  Gender?: string;
  Patient_img?: string;
  Doctor_img?: string;
  Phone: string;
  Email?: string;
  Doctor?: string;
  Role?: string;
  Address?: string;
  Last_Visit?: string;
  Status: "Available" | "Unavailable";
  user?: mongoose.Types.ObjectId;
  hospital?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Add indexes for role-based access
PatientSchema.index({ user: 1, createdAt: -1 });
PatientSchema.index({ hospital: 1, createdAt: -1 });
PatientSchema.index({ Phone: 1 });
PatientSchema.index({ Status: 1 });

export const Patient =
  mongoose.models.Patient ||
  mongoose.model<PatientDoc>("Patient", PatientSchema, "patients");
