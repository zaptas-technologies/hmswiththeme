import { Schema } from "mongoose";

export const AssetSchema = new Schema(
  {
    AssetID: { type: String, required: true, unique: true },
    AssetUser: { type: String, required: true },
    Image: { type: String },
    Assets: { type: String, required: true },
    PurchaseDate: { type: String, required: true },
    Warrenty: { type: String },
    WarrantyEnd: { type: String },
    Amount: { type: String, required: true },
    Status: {
      type: String,
      enum: ["Approved", "Pending", "Returned"],
      required: true,
    },
  },
  { timestamps: true, strict: false }
);

export const StaffSchema = new Schema(
  {
    Staff: { type: String, required: true },
    Image: { type: String },
    Designation: { type: String, required: true },
    Role: { type: String, required: true },
    Phone: { type: String, required: true },
    Email: { type: String, required: true },
    Status: { type: String, enum: ["Available", "Unavailable"], required: true },
  },
  { timestamps: true, strict: false }
);

export const LeaveSchema = new Schema(
  {
    ID: { type: String, required: true, unique: true },
    Employee: { type: String, required: true },
    Image: { type: String },
    LeaveType: { type: String, required: true },
    Date: { type: String, required: true },
    Day: { type: String, required: true },
    AppliedOn: { type: String, required: true },
    Status: { type: String, enum: ["Approved", "Rejected"], required: true },
  },
  { timestamps: true, strict: false }
);

export const ServiceSchema = new Schema(
  {
    ServiceName: { type: String, required: true },
    Department: { type: String, required: true },
    Price: { type: String, required: true },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
  },
  { timestamps: true, strict: false }
);

export const SpecializationSchema = new Schema(
  {
    Specialization: { type: String, required: true },
    img: { type: String },
    Image: { type: String },
    CreatedDate: { type: String },
    NoofDoctor: { type: String },
    Department: { type: String },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
  },
  { timestamps: true, strict: false }
);

export const DesignationSchema = new Schema(
  {
    Designation: { type: String, required: true },
    Department: { type: String, required: true },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
  },
  { timestamps: true, strict: false }
);

