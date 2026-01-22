import mongoose, { Schema } from "mongoose";

export type DashboardPatientDoc = {
  doctorId: string;
  name: string;
  phone: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
};

const DashboardPatientSchema = new Schema<DashboardPatientDoc>(
  {
    doctorId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    avatar: { type: String, required: true },
  },
  { timestamps: true }
);

DashboardPatientSchema.index({ doctorId: 1, name: 1 });

export const DashboardPatient =
  mongoose.models.DashboardPatient ||
  mongoose.model<DashboardPatientDoc>("DashboardPatient", DashboardPatientSchema);

