import mongoose, { Schema, Document } from "mongoose";
import { ConsultationSchema } from "./schemas/clinical";

export interface ConsultationDoc extends Document {
  Appointment_ID: mongoose.Types.ObjectId;
  Patient: string;
  Patient_Image?: string;
  Doctor: string;
  Doctor_Image?: string;
  Vitals?: {
    temperature?: string;
    pulse?: string;
    respiratoryRate?: string;
    spo2?: string;
    height?: string;
    weight?: string;
    bmi?: string;
    waist?: string;
  };
  Complaints?: Array<{ complaint: string; duration?: string }>;
  Diagnosis?: Array<{ diagnosis: string; type?: string }>;
  Medications?: Array<{
    medicine: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    inventoryId?: mongoose.Types.ObjectId;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
  }>;
  Advice?: Array<{ advice: string }>;
  Investigations?: Array<{ investigation: string; notes?: string }>;
  FollowUp?: {
    nextConsultation?: string;
    emptyStomach?: string;
  };
  Invoice?: Array<{
    item: string;
    quantity?: number;
    price?: number;
    total?: number;
    paymentMode?: string;
  }>;
  Status: "Draft" | "Completed" | "Cancelled";
  Consultation_Date?: Date;
  Completed_At?: Date;
  user?: mongoose.Types.ObjectId;
  hospital?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Add indexes for role-based access
ConsultationSchema.index({ user: 1, createdAt: -1 });
ConsultationSchema.index({ hospital: 1, createdAt: -1 });
// NOTE: Appointment_ID already has `index: true` in `ConsultationSchema` definition
// (see `models/schemas/clinical.ts`). Duplicating it here triggers Mongoose warnings.
ConsultationSchema.index({ Doctor: 1, createdAt: -1 });
ConsultationSchema.index({ Status: 1 });

export const Consultation =
  mongoose.models.Consultation ||
  mongoose.model<ConsultationDoc>("Consultation", ConsultationSchema, "consultations");
