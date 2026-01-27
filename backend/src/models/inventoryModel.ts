import mongoose, { Document } from "mongoose";
import { InventorySchema } from "./schemas/clinical";

export interface InventoryDoc extends Document {
  id: string;
  Item_Name: string;
  Item_Code?: string;
  Category?: string;
  Manufacturer?: string;
  Batch_Number?: string;
  Expiry_Date: Date;
  Quantity: number;
  Unit?: string;
  Unit_Price?: number;
  Total_Value?: number;
  Location?: string;
  Supplier?: string;
  Status: "Available" | "Low Stock" | "Out of Stock" | "Expired";
  Notes?: string;
  hospital?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Add indexes for role-based access and queries
InventorySchema.index({ hospital: 1, createdAt: -1 });
InventorySchema.index({ hospital: 1, Expiry_Date: 1 });
InventorySchema.index({ hospital: 1, Status: 1 });
InventorySchema.index({ Item_Name: 1 });
InventorySchema.index({ Item_Code: 1 });
InventorySchema.index({ Expiry_Date: 1 });

export const Inventory =
  mongoose.models.Inventory ||
  mongoose.model<InventoryDoc>("Inventory", InventorySchema, "inventory");
