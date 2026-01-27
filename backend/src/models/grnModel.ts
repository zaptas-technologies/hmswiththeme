import mongoose, { Document } from "mongoose";
import { GRNSchema } from "./schemas/clinical";

export interface GRNItem {
  inventoryId?: string;
  Item_Name: string;
  Item_Code?: string;
  Batch_Number?: string;
  Expiry_Date: Date;
  Quantity: number;
  Unit?: string;
  Unit_Price: number;
  Total_Price: number;
}

export interface GRNDoc extends Document {
  GRN_Number: string;
  GRN_Date: Date;
  Supplier: string;
  Supplier_Invoice?: string;
  Items: GRNItem[];
  Total_Amount: number;
  Status: "Draft" | "Received" | "Cancelled";
  Received_By?: string;
  Notes?: string;
  hospital?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Add indexes for role-based access and queries
GRNSchema.index({ hospital: 1, createdAt: -1 });
GRNSchema.index({ hospital: 1, GRN_Date: -1 });
// Note: GRN_Number already has unique: true in schema which creates an index
GRNSchema.index({ Status: 1 });

export const GRN =
  mongoose.models.GRN ||
  mongoose.model<GRNDoc>("GRN", GRNSchema, "grn");
