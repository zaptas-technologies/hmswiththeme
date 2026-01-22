import { Schema } from "mongoose";

export const AppointmentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Date_Time: { type: String, required: true },
    Patient: { type: String, required: true },
    Phone: { type: String, required: true },
    Patient_Image: { type: String },
    Doctor_Image: { type: String },
    Doctor: { type: String, required: true },
    role: { type: String },
    Mode: { type: String },
    Status: { type: String, required: true },
  },
  { timestamps: true, strict: false }
);

export const DoctorSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Name_Designation: { type: String, required: true },
    img: { type: String },
    role: { type: String },
    Department: { type: String },
    Phone: { type: String, required: true },
    Email: { type: String, required: true },
    Fees: { type: String },
    Status: { type: String, enum: ["Available", "Unavailable"], required: true },
  },
  { timestamps: true, strict: false }
);

export const PatientSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Patient: { type: String, required: true },
    Gender: { type: String },
    Patient_img: { type: String },
    Doctor_img: { type: String },
    Phone: { type: String, required: true },
    Doctor: { type: String },
    Role: { type: String },
    Address: { type: String },
    Last_Visit: { type: String },
    Status: { type: String, enum: ["Available", "Unavailable"], required: true },
  },
  { timestamps: true, strict: false }
);

export const DoctorAppointmentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Date_Time: { type: String, required: true },
    Patient: { type: String, required: true },
    Phone: { type: String },
    Patient_Image: { type: String },
    Doctor_Image: { type: String },
    Doctor: { type: String },
    role: { type: String },
    Mode: { type: String },
    Status: { type: String, required: true },
  },
  { timestamps: true, strict: false }
);

export const PatientAppointmentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Date_Time: { type: String, required: true },
    Doctor: { type: String, required: true },
    Doctor_Image: { type: String },
    Department: { type: String },
    Phone: { type: String },
    Status: { type: String, required: true },
  },
  { timestamps: true, strict: false }
);

export const DoctorPrescriptionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Date: { type: String, required: true },
    Patient: { type: String, required: true },
    Patient_Image: { type: String },
    Doctor: { type: String, required: true },
    Medicine: { type: String, required: true },
    Status: { type: String, required: true },
  },
  { timestamps: true, strict: false }
);

export const PatientPrescriptionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Date: { type: String, required: true },
    Doctor: { type: String, required: true },
    Doctor_Image: { type: String },
    Medicine: { type: String, required: true },
    Status: { type: String, required: true },
  },
  { timestamps: true, strict: false }
);

export const DoctorLeaveSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Doctor: { type: String, required: true },
    Doctor_Id: { type: String },
    Date: { type: String, required: true }, // Format: "15 Apr 2026- 15 Apr 2025" or date range
    From_Date: { type: Date },
    To_Date: { type: Date },
    Leave_Type: { type: String, required: true },
    Day: { type: String, required: true }, // Format: "01 Day" or "02 Days"
    No_Of_Days: { type: Number },
    Applied_On: { type: String, required: true },
    Applied_On_Date: { type: Date },
    Status: { 
      type: String, 
      enum: ["Applied", "Approved", "Rejected"], 
      required: true,
      default: "Applied"
    },
    Reason: { type: String },
    Department: { type: String },
    Designation: { type: String },
  },
  { timestamps: true, strict: false }
);

