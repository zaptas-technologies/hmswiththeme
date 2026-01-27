import mongoose, { Schema, Document } from "mongoose";
import { DoctorLeaveSchema } from "./schemas/clinical";

export interface DoctorLeaveDoc extends Document {
  Doctor: string;
  Doctor_Id?: string;
  Date: string;
  From_Date?: Date;
  To_Date?: Date;
  Leave_Type: string;
  Day: string;
  No_Of_Days?: number;
  Applied_On: string;
  Applied_On_Date?: Date;
  Status: "Applied" | "Approved" | "Rejected";
  Reason?: string;
  Department?: string;
  Designation?: string;
  user?: mongoose.Types.ObjectId;
  hospital?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Add indexes for role-based access
DoctorLeaveSchema.index({ user: 1, createdAt: -1 });
DoctorLeaveSchema.index({ hospital: 1, createdAt: -1 });
DoctorLeaveSchema.index({ Doctor: 1, createdAt: -1 });
DoctorLeaveSchema.index({ Status: 1 });
DoctorLeaveSchema.index({ From_Date: 1, To_Date: 1 });

export const DoctorLeave =
  mongoose.models.DoctorLeave ||
  mongoose.model<DoctorLeaveDoc>("DoctorLeave", DoctorLeaveSchema, "doctorleaves");
