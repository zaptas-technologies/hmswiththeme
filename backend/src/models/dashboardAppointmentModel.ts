import mongoose, { Schema } from "mongoose";

export type AppointmentMode = "Online" | "In-Person";
export type AppointmentStatus =
  | "Schedule"
  | "Checked in"
  | "Checked Out"
  | "Cancelled";

export type DashboardAppointmentDoc = {
  doctorId: string;
  patientId: mongoose.Types.ObjectId;
  datetime: Date;
  mode: AppointmentMode;
  status: AppointmentStatus;
  fee: number;
  createdAt: Date;
  updatedAt: Date;
};

const DashboardAppointmentSchema = new Schema<DashboardAppointmentDoc>(
  {
    doctorId: { type: String, required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "DashboardPatient", required: true, index: true },
    datetime: { type: Date, required: true, index: true },
    mode: { type: String, required: true, enum: ["Online", "In-Person"] },
    status: {
      type: String,
      required: true,
      enum: ["Schedule", "Checked in", "Checked Out", "Cancelled"],
      index: true,
    },
    fee: { type: Number, required: true },
  },
  { timestamps: true }
);

DashboardAppointmentSchema.index({ doctorId: 1, datetime: -1 });
DashboardAppointmentSchema.index({ doctorId: 1, status: 1, datetime: -1 });

export const DashboardAppointment =
  mongoose.models.DashboardAppointment ||
  mongoose.model<DashboardAppointmentDoc>("DashboardAppointment", DashboardAppointmentSchema);

