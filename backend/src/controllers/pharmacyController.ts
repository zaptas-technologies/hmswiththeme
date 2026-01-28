import { RequestHandler } from "express";
import mongoose from "mongoose";
import { User } from "../models/userModel";
import { buildAccessFilter } from "../middlewares/authMiddleware";

export interface PharmacyRequest {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  hospitalId?: string; // For super_admin to specify hospital
}

// Helper to format pharmacy response
const formatPharmacyResponse = (user: any) => {
  return {
    _id: user._id?.toString(),
    id: user._id?.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hospitalId: user.hospitalId?.toString(),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Validation helper
const validatePharmacyData = (data: Partial<PharmacyRequest>): { isValid: boolean; error?: string } => {
  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    return { isValid: false, error: "Name is required" };
  }

  if (!data.email || typeof data.email !== "string" || data.email.trim() === "") {
    return { isValid: false, error: "Email is required" };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true };
};

// Get all pharmacies (users with pharmacist role)
export const getAllPharmacies: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort as string || "-createdAt";

    // Build filter for pharmacist role
    const filter: any = { role: "pharmacist" };
    
    // Apply hospital filter for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      filter.hospitalId = req.user.hospitalId;
    }

    const [pharmacies, total] = await Promise.all([
      User.find(filter)
        .select("_id name email phone role hospitalId createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      User.countDocuments(filter),
    ]);

    res.json({
      data: pharmacies.map(formatPharmacyResponse),
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

// Get pharmacy by ID
export const getPharmacyById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid pharmacy ID format" });
    }

    const filter: any = {
      _id: new mongoose.Types.ObjectId(id),
      role: "pharmacist",
    };

    // Apply hospital filter for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      filter.hospitalId = req.user.hospitalId;
    }

    const pharmacy = await User.findOne(filter)
      .select("_id name email phone role hospitalId createdAt updatedAt")
      .lean()
      .exec();

    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy user not found" });
    }

    res.json(formatPharmacyResponse(pharmacy));
  } catch (err) {
    next(err);
  }
};

// Create pharmacy user
export const createPharmacy: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only hospital_admin and super_admin can create pharmacies
    if (req.user.role !== "HOSPITAL_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const pharmacyData: PharmacyRequest = req.body;

    // Validate required fields
    const validation = validatePharmacyData(pharmacyData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Password is required for new pharmacy users
    if (!pharmacyData.password || pharmacyData.password.trim() === "") {
      return res.status(400).json({ message: "Password is required" });
    }

    // Normalize email
    const normalizedEmail = pharmacyData.email.toLowerCase().trim();

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        message: "User with this email already exists",
        email: normalizedEmail 
      });
    }

    // Determine hospitalId
    let hospitalId: mongoose.Types.ObjectId | undefined;
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      hospitalId = new mongoose.Types.ObjectId(req.user.hospitalId);
    } else if (req.user.role === "SUPER_ADMIN" && pharmacyData.hospitalId) {
      hospitalId = new mongoose.Types.ObjectId(pharmacyData.hospitalId);
    }

    // Create pharmacy user
    const pharmacy = await User.create({
      name: pharmacyData.name,
      email: normalizedEmail,
      phone: pharmacyData.phone,
      password: pharmacyData.password,
      role: "pharmacist",
      hospitalId: hospitalId,
    });

    res.status(201).json(formatPharmacyResponse(pharmacy));
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: "User with this email already exists",
        field: "email"
      });
    }
    
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors 
      });
    }
    
    next(err);
  }
};

// Update pharmacy user
export const updatePharmacy: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only hospital_admin and super_admin can update pharmacies
    if (req.user.role !== "HOSPITAL_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid pharmacy ID format" });
    }

    const filter: any = {
      _id: new mongoose.Types.ObjectId(id),
      role: "pharmacist",
    };

    // Apply hospital filter for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      filter.hospitalId = req.user.hospitalId;
    }

    const pharmacy = await User.findOne(filter);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy user not found" });
    }

    const updateData: Partial<PharmacyRequest> = req.body;

    // Validate if updating email
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if email is already taken by another user
      const normalizedEmail = updateData.email.toLowerCase().trim();
      const existingUser = await User.findOne({ 
        email: normalizedEmail,
        _id: { $ne: id }
      });
      if (existingUser) {
        return res.status(409).json({ message: "Email already in use" });
      }
      updateData.email = normalizedEmail;
    }

    // Update fields
    if (updateData.name) pharmacy.name = updateData.name;
    if (updateData.email) pharmacy.email = updateData.email;
    if (updateData.phone !== undefined) pharmacy.phone = updateData.phone;
    if (updateData.password) pharmacy.password = updateData.password;

    await pharmacy.save();

    res.json(formatPharmacyResponse(pharmacy));
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: "User with this email already exists",
        field: "email"
      });
    }
    
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors 
      });
    }
    
    next(err);
  }
};

// Delete pharmacy user
export const deletePharmacy: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only hospital_admin and super_admin can delete pharmacies
    if (req.user.role !== "HOSPITAL_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid pharmacy ID format" });
    }

    const filter: any = {
      _id: new mongoose.Types.ObjectId(id),
      role: "pharmacist",
    };

    // Apply hospital filter for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      filter.hospitalId = req.user.hospitalId;
    }

    const pharmacy = await User.findOne(filter);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy user not found" });
    }

    await User.findByIdAndDelete(id);

    res.json({ 
      success: true,
      message: "Pharmacy user deleted successfully" 
    });
  } catch (err) {
    next(err);
  }
};

// Impersonate pharmacy user (login as pharmacy user)
export const impersonatePharmacy: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only hospital_admin and super_admin can impersonate
    if (req.user.role !== "HOSPITAL_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid pharmacy ID format" });
    }

    const filter: any = {
      _id: new mongoose.Types.ObjectId(id),
      role: "pharmacist",
    };

    // Apply hospital filter for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      filter.hospitalId = req.user.hospitalId;
    }

    const pharmacy = await User.findOne(filter);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy user not found" });
    }

    // Generate token for the pharmacy user (using same method as authController)
    const generateToken = (userId: string): string => {
      return Buffer.from(JSON.stringify({ userId, doctorId: userId, timestamp: Date.now() })).toString("base64");
    };
    const token = generateToken(pharmacy._id.toString());

    // Return pharmacy user data with token
    res.json({
      token,
      user: formatPharmacyResponse(pharmacy),
      impersonated: true,
      originalUser: {
        id: req.user.userId,
        role: req.user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
