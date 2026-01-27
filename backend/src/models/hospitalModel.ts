import mongoose, { Schema, Document } from "mongoose";

export interface HospitalDoc extends Document {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
  hospitalAdmin?: mongoose.Types.ObjectId; // Reference to User with hospital_admin role
  createdAt: Date;
  updatedAt: Date;
}

const hospitalSchema = new Schema<HospitalDoc>(
  {
    name: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    status: { 
      type: String, 
      enum: ["Active", "Inactive"], 
      default: "Active",
      index: true,
    },
    hospitalAdmin: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
    },
  },
  { 
    timestamps: true,
    id: false,
  }
);

// Compound indexes for common queries
hospitalSchema.index({ status: 1, createdAt: -1 });
hospitalSchema.index({ hospitalAdmin: 1 });

export const Hospital =
  mongoose.models.Hospital ||
  mongoose.model<HospitalDoc>("Hospital", hospitalSchema, "hospitals");
