import mongoose, { Document } from "mongoose";
import { PharmacyDispenseSchema } from "./schemas/clinical";

export interface PharmacyDispenseMedication {
  medicine: string;
  dosage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  inventoryId?: mongoose.Types.ObjectId;
  batchNumber?: string;
  expiry?: Date;
}

export interface PharmacyDispenseDoc extends Document {
  hospital: mongoose.Types.ObjectId;
  consultationId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  doctorName: string;
  patientId?: mongoose.Types.ObjectId;
  patientName: string;
  amountReceived: number;
  paymentMethod: string;
  medications: PharmacyDispenseMedication[];
  dispensedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

PharmacyDispenseSchema.index({ hospital: 1, createdAt: -1 });
PharmacyDispenseSchema.index({ consultationId: 1 }, { unique: true });

export const PharmacyDispense =
  mongoose.models.PharmacyDispense ||
  mongoose.model<PharmacyDispenseDoc>("PharmacyDispense", PharmacyDispenseSchema, "pharmacydispenses");
