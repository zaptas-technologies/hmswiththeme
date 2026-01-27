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
    Consultation_ID: { type: String, index: true }, // Reference to consultation document
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
    hospital: { type: Schema.Types.ObjectId, ref: "Hospital", index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
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

export const ConsultationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Consultation_ID: { type: String, required: true, unique: true },
    Appointment_ID: { type: String, required: true, index: true }, // Reference to appointment
    Patient: { type: String, required: true },
    Patient_Image: { type: String },
    Doctor: { type: String, required: true },
    Doctor_Image: { type: String },
    // Vitals
    Vitals: {
      temperature: { type: String },
      pulse: { type: String },
      respiratoryRate: { type: String },
      spo2: { type: String },
      height: { type: String },
      weight: { type: String },
      bmi: { type: String },
      waist: { type: String },
    },
    // Complaints
    Complaints: [{
      complaint: { type: String, required: true },
      duration: { type: String },
    }],
    // Diagnosis
    Diagnosis: [{
      diagnosis: { type: String, required: true },
      type: { type: String },
    }],
    // Medications
    Medications: [{
      medicine: { type: String, required: true },
      dosage: { type: String },
      frequency: { type: String },
      duration: { type: String },
    }],
    // Advice
    Advice: [{
      advice: { type: String, required: true },
    }],
    // Investigations
    Investigations: [{
      investigation: { type: String, required: true },
      notes: { type: String },
    }],
    // Follow Up
    FollowUp: {
      nextConsultation: { type: String },
      emptyStomach: { type: String },
    },
    // Invoice
    Invoice: [{
      item: { type: String, required: true },
      quantity: { type: Number, default: 1 },
      price: { type: Number, required: true },
      total: { type: Number, required: true },
      paymentMode: { type: String },
    }],
    // Status
    Status: {
      type: String,
      enum: ["Draft", "Completed", "Cancelled"],
      default: "Draft",
    },
    // Consultation Date
    Consultation_Date: { type: Date, default: Date.now },
    Completed_At: { type: Date },
  },
  { timestamps: true, strict: false }
);

export const InventorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Item_Name: { type: String, required: true },
    Item_Code: { type: String },
    Category: { type: String },
    Manufacturer: { type: String },
    Batch_Number: { type: String },
    Expiry_Date: { type: Date, required: true },
    Quantity: { type: Number, required: true, default: 0 },
    Unit: { type: String, default: "pcs" },
    Unit_Price: { type: Number, default: 0 },
    Total_Value: { type: Number, default: 0 },
    Location: { type: String },
    Supplier: { type: String },
    Status: { 
      type: String, 
      enum: ["Available", "Low Stock", "Out of Stock", "Expired"], 
      default: "Available"
    },
    Notes: { type: String },
    hospital: { type: Schema.Types.ObjectId, index: true },
    user: { type: Schema.Types.ObjectId, index: true },
  },
  { timestamps: true, strict: false }
);

export const GRNSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    GRN_Number: { type: String, required: true, unique: true },
    GRN_Date: { type: Date, required: true, default: Date.now },
    Supplier: { type: String, required: true },
    Supplier_Invoice: { type: String },
    Items: [{
      inventoryId: { type: String, required: true },
      Item_Name: { type: String, required: true },
      Item_Code: { type: String },
      Batch_Number: { type: String },
      Expiry_Date: { type: Date, required: true },
      Quantity: { type: Number, required: true },
      Unit: { type: String, default: "pcs" },
      Unit_Price: { type: Number, required: true },
      Total_Price: { type: Number, required: true },
    }],
    Total_Amount: { type: Number, required: true, default: 0 },
    Status: {
      type: String,
      enum: ["Draft", "Received", "Cancelled"],
      default: "Draft",
    },
    Received_By: { type: String },
    Notes: { type: String },
    hospital: { type: Schema.Types.ObjectId, index: true },
    user: { type: Schema.Types.ObjectId, index: true },
  },
  { timestamps: true, strict: false }
);

