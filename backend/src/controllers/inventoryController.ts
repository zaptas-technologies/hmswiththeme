import { RequestHandler } from "express";
import { Inventory, InventoryDoc } from "../models/inventoryModel";
import mongoose from "mongoose";
import { buildAccessFilter } from "../middlewares/authMiddleware";
import { Doctor } from "../models/doctorModel";
import { User } from "../models/userModel";

export interface InventoryRequest {
  Item_Name: string;
  Item_Code?: string;
  Category?: string;
  Manufacturer?: string;
  Batch_Number?: string;
  Expiry_Date: Date | string;
  Quantity: number;
  Unit?: string;
  Unit_Price?: number;
  Total_Value?: number;
  Location?: string;
  Supplier?: string;
  Status?: "Available" | "Low Stock" | "Out of Stock" | "Expired";
  Notes?: string;
  hospital?: string;
  user?: string;
  [key: string]: any;
}

const formatInventoryResponse = (inventory: any) => {
  if (!inventory) return inventory;
  const obj = typeof inventory.toObject === "function" ? inventory.toObject() : inventory;
  return {
    ...obj,
    _id: obj._id?.toString() || obj._id,
    id: obj._id?.toString() || obj._id, // For backward compatibility, map _id to id
  };
};

const validateInventoryData = (
  data: Partial<InventoryRequest>
): { isValid: boolean; error?: string } => {
  if (!data) return { isValid: false, error: "Missing request body" };
  if (!data.Item_Name || typeof data.Item_Name !== "string") {
    return { isValid: false, error: "Item name is required" };
  }
  if (!data.Expiry_Date) {
    return { isValid: false, error: "Expiry date is required" };
  }
  if (data.Quantity === undefined || data.Quantity === null || typeof data.Quantity !== "number") {
    return { isValid: false, error: "Quantity is required and must be a number" };
  }
  if (data.Quantity < 0) {
    return { isValid: false, error: "Quantity cannot be negative" };
  }
  return { isValid: true };
};

// Helper function to update status based on quantity and expiry
const updateInventoryStatus = (inventory: InventoryDoc) => {
  const now = new Date();
  const expiryDate = new Date(inventory.Expiry_Date);
  
  if (expiryDate < now) {
    inventory.Status = "Expired";
  } else if (inventory.Quantity === 0) {
    inventory.Status = "Out of Stock";
  } else if (inventory.Quantity < 10) {
    inventory.Status = "Low Stock";
  } else {
    inventory.Status = "Available";
  }
  
  // Calculate total value
  if (inventory.Unit_Price && inventory.Quantity) {
    inventory.Total_Value = inventory.Unit_Price * inventory.Quantity;
  }
};

// GET /api/inventory - Get all inventory items
export const getAllInventory: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) || "-createdAt";

    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const category = (req.query.category as string) || "";

    // Use buildAccessFilter to ensure users only see inventory from their hospital
    const filter = buildAccessFilter(req.user);
    
    if (status) filter.Status = status;
    if (category) filter.Category = new RegExp(category, "i");

    if (search) {
      const rx = new RegExp(search, "i");
      const searchConditions = {
        $or: [
          { Item_Name: rx },
          { Item_Code: rx },
          { Batch_Number: rx },
          { Manufacturer: rx },
        ],
      };
      // Combine with existing filter conditions
      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push(searchConditions);
      } else {
        Object.assign(filter, searchConditions);
      }
    }

    const [inventory, total] = await Promise.all([
      Inventory.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      Inventory.countDocuments(filter),
    ]);

    res.json({
      data: inventory.map(formatInventoryResponse),
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

// GET /api/inventory/search/medicines - Search medicines for autocomplete (filtered by hospital)
export const searchMedicines: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const search = (req.query.search as string) || "";
    const limit = parseInt(req.query.limit as string) || 20;

    // Build filter similar to getAllAppointments - filter by hospital for doctors
    const filter: any = {};
    
    // If auth middleware already attached hospitalId, always prefer it
    // (prevents accidental cross-hospital search when doctor lookup fails)
    if (req.user.hospitalId && mongoose.Types.ObjectId.isValid(req.user.hospitalId)) {
      filter.hospital = new mongoose.Types.ObjectId(req.user.hospitalId);
    }

    // For doctors (USER role), find their hospital
    if (req.user.role === "USER") {
      try {
        // Find doctor by user ID or email (same approach as getAllAppointments)
        let doctor = await Doctor.findOne({ user: req.user.userId })
          .select("_id hospital Email Name_Designation")
          .lean() as { _id?: any; hospital?: any; Email?: string; Name_Designation?: string } | null;

        // If not found by user ID, try to find by email from User model
        if (!doctor) {
          const user = await User.findById(req.user.userId).select("email").lean();
          if (user?.email) {
            doctor = await Doctor.findOne({
              $or: [
                { Email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                { email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
              ],
            })
              .select("_id hospital Email Name_Designation")
              .lean() as { _id?: any; hospital?: any; Email?: string; Name_Designation?: string } | null;
          }
        }

        // Add hospital filter if doctor is associated with a hospital
        if (doctor?.hospital) {
          filter.hospital = new mongoose.Types.ObjectId(doctor.hospital.toString());
        }
      } catch (error) {
        // If we can't find doctor, do NOT continue without filters (would leak cross-hospital inventory)
        // eslint-disable-next-line no-console
        console.error("Error fetching doctor for medicine search:", error);
      }

      // If we still can't resolve a hospital context for a doctor, return empty results
      // This makes "hospital-wise medicine search" compulsory.
      if (!filter.hospital) {
        return res.json({ data: [], count: 0 });
      }
    } else {
      // For other roles, use buildAccessFilter
      const accessFilter = buildAccessFilter(req.user);
      Object.assign(filter, accessFilter);
    }
    
    // Filter by medicine category or item name containing search term
    if (search) {
      const rx = new RegExp(search, "i");
      const searchConditions = {
        $or: [
          { Item_Name: rx },
          { Category: rx },
          { Manufacturer: rx },
        ],
      };
      // Combine with existing filter conditions
      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push(searchConditions);
      } else {
        Object.assign(filter, searchConditions);
      }
    }

    // Only return available medicines (not expired or out of stock)
    filter.Status = { $in: ["Available", "Low Stock"] };

    const medicines = await Inventory.find(filter)
      .select("_id Item_Name Item_Code Category Manufacturer Unit Unit_Price Quantity Status Expiry_Date Batch_Number")
      .sort({ Item_Name: 1 })
      .limit(limit)
      .lean()
      .exec();

    // Format response for autocomplete
    const formattedMedicines = medicines.map((med: any) => ({
      inventoryId: med._id?.toString() || "",
      value: med.Item_Name,
      label: med.Item_Name,
      code: med.Item_Code || "",
      category: med.Category || "",
      manufacturer: med.Manufacturer || "",
      unit: med.Unit || "",
      unitPrice: med.Unit_Price || 0,
      quantity: med.Quantity || 0,
      status: med.Status || "Available",
      expiryDate: med.Expiry_Date ? new Date(med.Expiry_Date).toISOString() : "",
      batchNumber: med.Batch_Number || "",
      details: {
        inventoryId: med._id?.toString() || "",
        code: med.Item_Code || "",
        category: med.Category || "",
        manufacturer: med.Manufacturer || "",
        unit: med.Unit || "",
        unitPrice: med.Unit_Price || 0,
        quantity: med.Quantity || 0,
        status: med.Status || "Available",
        expiryDate: med.Expiry_Date ? new Date(med.Expiry_Date).toISOString() : "",
        batchNumber: med.Batch_Number || "",
      },
    }));

    res.json({
      data: formattedMedicines,
      count: formattedMedicines.length,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/inventory/:id - Get inventory item by ID
export const getInventoryById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    // Use buildAccessFilter to ensure users only see inventory from their hospital
    const filter = buildAccessFilter(req.user);

    // Use _id only (MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid inventory ID format" });
    }

    filter._id = new mongoose.Types.ObjectId(id);

    const inventory = await Inventory.findOne(filter);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json(formatInventoryResponse(inventory));
  } catch (err) {
    next(err);
  }
};

// POST /api/inventory - Create new inventory item
export const createInventory: RequestHandler = async (req, res, next) => {
  try {
    const inventoryData: InventoryRequest = req.body;

    // Validate required fields
    const validation = validateInventoryData(inventoryData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Remove id field if present (we use MongoDB's _id)
    const { id: _ignoredId, _id: _ignoredMongoId, ...cleanInventoryData } = inventoryData;
    
    // Explicitly delete id field to ensure it's not included (handles cases where id might be undefined/null/empty)
    delete (cleanInventoryData as any).id;
    delete (cleanInventoryData as any)._id;

    // Convert Expiry_Date to Date if string
    if (typeof cleanInventoryData.Expiry_Date === "string") {
      cleanInventoryData.Expiry_Date = new Date(cleanInventoryData.Expiry_Date);
    }

    // Set hospital and user from request if available
    if (req.user) {
      const accessFilter = buildAccessFilter(req.user);
      if (accessFilter.hospital) {
        cleanInventoryData.hospital = typeof accessFilter.hospital === 'string' 
          ? new mongoose.Types.ObjectId(accessFilter.hospital)
          : accessFilter.hospital;
      }
      if (accessFilter.user) {
        cleanInventoryData.user = typeof accessFilter.user === 'string'
          ? new mongoose.Types.ObjectId(accessFilter.user)
          : accessFilter.user;
      }
    }

    const inventory = await Inventory.create(cleanInventoryData);
    
    // Update status based on quantity and expiry
    updateInventoryStatus(inventory);
    await inventory.save();

    res.status(201).json(formatInventoryResponse(inventory));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      // If the error is about 'id' field, provide a more helpful message
      if (field === 'id') {
        return res.status(409).json({
          message: "An inventory item with this identifier already exists. Please refresh and try again.",
        });
      }
      return res.status(409).json({
        message: `Inventory item with this ${field} already exists`,
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

// PATCH /api/inventory/:id - Update inventory item
export const updateInventory: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const updateData: Partial<InventoryRequest> = req.body;

    // Don't allow updating id or _id
    const { id: _ignoredId, _id: _ignoredMongoId, ...cleanUpdateData } = updateData;

    // Convert Expiry_Date to Date if string
    if (cleanUpdateData.Expiry_Date && typeof cleanUpdateData.Expiry_Date === "string") {
      cleanUpdateData.Expiry_Date = new Date(cleanUpdateData.Expiry_Date);
    }

    // Use buildAccessFilter to ensure users only update inventory from their hospital
    const filter = buildAccessFilter(req.user);

    // Use _id only (MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid inventory ID format" });
    }

    filter._id = new mongoose.Types.ObjectId(id);

    const inventory = await Inventory.findOne(filter);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Update inventory
    Object.assign(inventory, cleanUpdateData);
    
    // Update status based on quantity and expiry
    updateInventoryStatus(inventory);
    await inventory.save();

    res.json(formatInventoryResponse(inventory));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      // If the error is about 'id' field, provide a more helpful message
      if (field === 'id') {
        return res.status(409).json({
          message: "An inventory item with this identifier already exists. Please refresh and try again.",
        });
      }
      return res.status(409).json({
        message: `Inventory item with this ${field} already exists`,
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

// DELETE /api/inventory/:id - Delete inventory item
export const deleteInventory: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    // Use buildAccessFilter to ensure users only delete inventory from their hospital
    const filter = buildAccessFilter(req.user);

    // Use _id only (MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid inventory ID format" });
    }

    filter._id = new mongoose.Types.ObjectId(id);

    const inventory = await Inventory.findOneAndDelete(filter);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json({ message: "Inventory item deleted successfully" });
  } catch (err) {
    next(err);
  }
};
