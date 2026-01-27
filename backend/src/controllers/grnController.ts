import { RequestHandler } from "express";
import { GRN, GRNDoc, GRNItem } from "../models/grnModel";
import { Inventory } from "../models/inventoryModel";
import mongoose from "mongoose";

export interface GRNRequest {
  _id?: string;
  id?: string;
  GRN_Number: string;
  GRN_Date?: Date | string;
  Supplier: string;
  Supplier_Invoice?: string;
  Items: GRNItem[];
  Total_Amount?: number;
  Status?: "Draft" | "Received" | "Cancelled";
  Received_By?: string;
  Notes?: string;
  hospital?: string;
  user?: string;
  [key: string]: any;
}

const formatGRNResponse = (grn: any) => {
  if (!grn) return grn;
  const obj = typeof grn.toObject === "function" ? grn.toObject() : grn;
  return obj;
};

const validateGRNData = (
  data: Partial<GRNRequest>
): { isValid: boolean; error?: string } => {
  if (!data) return { isValid: false, error: "Missing request body" };
  if (!data.GRN_Number || typeof data.GRN_Number !== "string") {
    return { isValid: false, error: "GRN number is required" };
  }
  if (!data.Supplier || typeof data.Supplier !== "string") {
    return { isValid: false, error: "Supplier is required" };
  }
  if (!data.Items || !Array.isArray(data.Items) || data.Items.length === 0) {
    return { isValid: false, error: "At least one item is required" };
  }
  
  // Validate each item
  for (const item of data.Items) {
    if (!item.Item_Name || typeof item.Item_Name !== "string") {
      return { isValid: false, error: "Item name is required for all items" };
    }
    if (!item.Expiry_Date) {
      return { isValid: false, error: "Expiry date is required for all items" };
    }
    if (item.Quantity === undefined || item.Quantity === null || item.Quantity <= 0) {
      return { isValid: false, error: "Valid quantity is required for all items" };
    }
    if (item.Unit_Price === undefined || item.Unit_Price === null || item.Unit_Price < 0) {
      return { isValid: false, error: "Valid unit price is required for all items" };
    }
  }
  
  return { isValid: true };
};

// Helper function to update inventory when GRN is received
const updateInventoryFromGRN = async (items: GRNItem[], hospitalId?: mongoose.Types.ObjectId) => {
  for (const item of items) {
    // Find existing inventory item by name and batch number, or create new
    const filter: any = {
      Item_Name: item.Item_Name,
      Batch_Number: item.Batch_Number || undefined,
    };
    
    if (hospitalId) {
      filter.hospital = hospitalId;
    }
    
    let inventoryItem = await Inventory.findOne(filter);
    
    if (inventoryItem) {
      // Update existing inventory
      inventoryItem.Quantity += item.Quantity;
      inventoryItem.Unit_Price = item.Unit_Price; // Update price
      inventoryItem.Expiry_Date = new Date(item.Expiry_Date);
      
      // Update status based on quantity and expiry
      const now = new Date();
      const expiryDate = new Date(inventoryItem.Expiry_Date);
      
      if (expiryDate < now) {
        inventoryItem.Status = "Expired";
      } else if (inventoryItem.Quantity === 0) {
        inventoryItem.Status = "Out of Stock";
      } else if (inventoryItem.Quantity < 10) {
        inventoryItem.Status = "Low Stock";
      } else {
        inventoryItem.Status = "Available";
      }
      
      inventoryItem.Total_Value = inventoryItem.Unit_Price * inventoryItem.Quantity;
      await inventoryItem.save();
    } else {
      // Create new inventory item
      const newInventoryData: any = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        Item_Name: item.Item_Name,
        Item_Code: item.Item_Code,
        Batch_Number: item.Batch_Number,
        Expiry_Date: new Date(item.Expiry_Date),
        Quantity: item.Quantity,
        Unit: item.Unit || "pcs",
        Unit_Price: item.Unit_Price,
        Total_Value: item.Total_Price,
        Status: item.Quantity > 0 ? "Available" : "Out of Stock",
      };
      
      if (hospitalId) {
        newInventoryData.hospital = hospitalId;
      }
      
      await Inventory.create(newInventoryData);
    }
  }
};

// GET /api/grn - Get all GRNs
export const getAllGRN: RequestHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) || "-createdAt";

    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const supplier = (req.query.supplier as string) || "";
    const hospitalId = (req.query.hospitalId as string) || "";

    const filter: Record<string, any> = {};
    
    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      filter.hospital = new mongoose.Types.ObjectId(hospitalId);
    }
    
    if (status) filter.Status = status;
    if (supplier) filter.Supplier = new RegExp(supplier, "i");

    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [
        { GRN_Number: rx },
        { Supplier: rx },
        { Supplier_Invoice: rx },
      ];
    }

    const [grns, total] = await Promise.all([
      GRN.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      GRN.countDocuments(filter),
    ]);

    res.json({
      data: grns.map(formatGRNResponse),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/grn/:id - Get GRN by ID
export const getGRNById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    let grn;
    if (mongoose.Types.ObjectId.isValid(id)) {
      grn = await GRN.findById(id);
    }

    if (!grn) {
      grn = await GRN.findOne({ $or: [{ _id: id }, { id }, { GRN_Number: id }] });
    }

    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    res.json(formatGRNResponse(grn));
  } catch (err) {
    next(err);
  }
};

// POST /api/grn - Create new GRN
export const createGRN: RequestHandler = async (req, res, next) => {
  try {
    const grnData: GRNRequest = req.body;

    // Validate required fields
    const validation = validateGRNData(grnData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Generate ID if not provided
    if (!grnData.id) {
      grnData.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Check if GRN with same GRN_Number already exists
    const existing = await GRN.findOne({ GRN_Number: grnData.GRN_Number });
    if (existing) {
      return res.status(409).json({ message: "GRN with this number already exists" });
    }

    // Calculate total amount from items
    let totalAmount = 0;
    for (const item of grnData.Items) {
      item.Total_Price = item.Quantity * item.Unit_Price;
      totalAmount += item.Total_Price;
    }
    grnData.Total_Amount = totalAmount;

    // Convert GRN_Date to Date if string
    if (grnData.GRN_Date && typeof grnData.GRN_Date === "string") {
      grnData.GRN_Date = new Date(grnData.GRN_Date);
    } else if (!grnData.GRN_Date) {
      grnData.GRN_Date = new Date();
    }

    // Set hospital and user from request if available
    const hospitalId = req.user && (req.user as any).hospitalId 
      ? new mongoose.Types.ObjectId((req.user as any).hospitalId)
      : undefined;
    
    if (hospitalId) {
      grnData.hospital = hospitalId.toString();
    }
    if (req.user && (req.user as any).id) {
      grnData.user = (req.user as any).id;
    }

    const grn = await GRN.create(grnData);

    // If status is "Received", update inventory
    if (grn.Status === "Received" && hospitalId) {
      await updateInventoryFromGRN(grn.Items, hospitalId);
    }

    res.status(201).json(formatGRNResponse(grn));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `GRN with this ${field} already exists`,
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({
        message: "Validation error",
        errors,
      });
    }

    next(err);
  }
};

// PATCH /api/grn/:id - Update GRN
export const updateGRN: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData: Partial<GRNRequest> = req.body;

    // Don't allow updating id or _id
    const { id: _ignoredId, _id: _ignoredMongoId, ...cleanUpdateData } = updateData;

    // Find GRN by _id, id, or GRN_Number
    let grn;
    if (mongoose.Types.ObjectId.isValid(id)) {
      grn = await GRN.findById(id);
    }

    if (!grn) {
      grn = await GRN.findOne({ $or: [{ id }, { GRN_Number: id }] });
    }

    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    const oldStatus = grn.Status;
    const hospitalId = grn.hospital;

    // If updating items, recalculate total
    if (cleanUpdateData.Items && Array.isArray(cleanUpdateData.Items)) {
      let totalAmount = 0;
      for (const item of cleanUpdateData.Items) {
        item.Total_Price = item.Quantity * item.Unit_Price;
        totalAmount += item.Total_Price;
      }
      cleanUpdateData.Total_Amount = totalAmount;
    }

    // Convert GRN_Date to Date if string
    if (cleanUpdateData.GRN_Date && typeof cleanUpdateData.GRN_Date === "string") {
      cleanUpdateData.GRN_Date = new Date(cleanUpdateData.GRN_Date);
    }

    // Update GRN
    Object.assign(grn, cleanUpdateData);
    await grn.save();

    // If status changed from non-Received to Received, update inventory
    if (oldStatus !== "Received" && grn.Status === "Received" && hospitalId) {
      await updateInventoryFromGRN(grn.Items, hospitalId);
    }

    res.json(formatGRNResponse(grn));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `GRN with this ${field} already exists`,
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({
        message: "Validation error",
        errors,
      });
    }

    next(err);
  }
};

// DELETE /api/grn/:id - Delete GRN
export const deleteGRN: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    let grn;
    if (mongoose.Types.ObjectId.isValid(id)) {
      grn = await GRN.findByIdAndDelete(id);
    }

    if (!grn) {
      grn = await GRN.findOneAndDelete({ $or: [{ id }, { GRN_Number: id }] });
    }

    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    res.json({ message: "GRN deleted successfully" });
  } catch (err) {
    next(err);
  }
};
