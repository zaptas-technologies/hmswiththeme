import mongoose, { Schema, Document } from "mongoose";
import { DoctorPrescriptionSchema } from "./schemas/clinical";

export interface PrescriptionDoc extends Document {
  Date: string;
  Prescribed_On?: string;
  Patient: string;
  Patient_Image?: string;
  Doctor: string;
  Medicine: string;
  Status: string;
  Dosage?: string;
  Frequency?: string;
  Duration?: string;
  Appointment_ID: mongoose.Types.ObjectId;
  Prescription_ID?: string;
  Amount?: number;
  consultationId?: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  inventoryId?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  hospital?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Add indexes for role-based access
DoctorPrescriptionSchema.index({ user: 1, createdAt: -1 });
DoctorPrescriptionSchema.index({ hospital: 1, createdAt: -1 });
DoctorPrescriptionSchema.index({ Doctor: 1, createdAt: -1 });
DoctorPrescriptionSchema.index({ Patient: 1, createdAt: -1 });
DoctorPrescriptionSchema.index({ Status: 1 });
DoctorPrescriptionSchema.index({ Appointment_ID: 1 });
DoctorPrescriptionSchema.index({ consultationId: 1 });
DoctorPrescriptionSchema.index({ patientId: 1 });
DoctorPrescriptionSchema.index({ doctorId: 1 });

export const Prescription =
  mongoose.models.Prescription ||
  mongoose.model<PrescriptionDoc>("Prescription", DoctorPrescriptionSchema, "doctorprescriptions");
