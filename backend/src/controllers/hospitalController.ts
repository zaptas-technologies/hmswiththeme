import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Hospital } from "../models/hospitalModel";
import { User } from "../models/userModel";
import { buildAccessFilter } from "../middlewares/authMiddleware";

export interface HospitalRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  status?: "Active" | "Inactive";
  hospitalAdminEmail?: string; // Email of hospital admin to assign
  hospitalAdminName?: string;
  hospitalAdminPassword?: string;
  hospitalAdminPhone?: string;
}

// Get all hospitals (super_admin sees all, hospital_admin sees only their hospital)
export const getAllHospitals: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let query: any = {};
    
    if (req.user.role === "SUPER_ADMIN") {
      // Super admin sees all hospitals
      query = {};
    } else if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      // Hospital admin sees only their hospital
      query = { _id: new mongoose.Types.ObjectId(req.user.hospitalId) };
    } else if (req.user.role === "USER") {
      // Doctors/staff: allow fetching hospital list for selecting locations, but only Active ones.
      // This is read-only and does not expose admin assignment capabilities.
      query = { status: "Active" };
    } else {
      // Other roles don't have access
      return res.status(403).json({ message: "Access denied" });
    }

    const hospitals = await Hospital.find(query)
      .populate("hospitalAdmin", "name email phone role")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: hospitals,
      count: hospitals.length,
    });
  } catch (err) {
    next(err);
  }
};

// Get hospital by ID
export const getHospitalById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }

    const accessFilter = buildAccessFilter(req.user);
    
    // Hospital admin can only see their own hospital
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      if (req.user.hospitalId !== id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const hospital = await Hospital.findById(id)
      .populate("hospitalAdmin", "name email phone role")
      .lean();

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.json({
      success: true,
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

// Create new hospital (only super_admin)
export const createHospital: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only super_admin can create hospitals
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only super admin can create hospitals" });
    }

    const {
      name,
      address,
      city,
      state,
      phone,
      email,
      status = "Active",
      hospitalAdminEmail,
      hospitalAdminName,
      hospitalAdminPassword,
      hospitalAdminPhone,
    }: HospitalRequest = req.body;

    // Validate required fields
    if (!name || !address || !city || !state || !phone || !email) {
      return res.status(400).json({ 
        message: "Name, address, city, state, phone, and email are required" 
      });
    }

    // Check if hospital with same email already exists
    const existingHospital = await Hospital.findOne({ email: email.toLowerCase() });
    if (existingHospital) {
      return res.status(400).json({ message: "Hospital with this email already exists" });
    }

    let hospitalAdminId: mongoose.Types.ObjectId | undefined;

    // Create hospital admin user if provided
    if (hospitalAdminEmail && hospitalAdminName && hospitalAdminPassword) {
      // Check if user with this email already exists
      const existingUser = await User.findOne({ email: hospitalAdminEmail.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ 
          message: "User with this email already exists. Please use a different email." 
        });
      }

      // Create hospital admin user
      const hospitalAdmin = new User({
        email: hospitalAdminEmail.toLowerCase(),
        name: hospitalAdminName,
        password: hospitalAdminPassword,
        phone: hospitalAdminPhone,
        role: "hospital_admin",
      });

      await hospitalAdmin.save();
      hospitalAdminId = hospitalAdmin._id;
    }

    // Create hospital
    const hospital = new Hospital({
      name,
      address,
      city,
      state,
      phone,
      email: email.toLowerCase(),
      status,
      hospitalAdmin: hospitalAdminId,
    });

    await hospital.save();

    // Update hospital admin's hospitalId if created
    if (hospitalAdminId) {
      await User.findByIdAndUpdate(hospitalAdminId, {
        hospitalId: hospital._id,
      });
    }

    const populatedHospital = await Hospital.findById(hospital._id)
      .populate("hospitalAdmin", "name email phone role")
      .lean();

    res.status(201).json({
      success: true,
      message: "Hospital created successfully",
      data: populatedHospital,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Hospital with this email already exists" });
    }
    next(err);
  }
};

// Update hospital (super_admin can update any, hospital_admin can update their own)
export const updateHospital: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Check access: hospital_admin can only update their own hospital
    if (req.user.role === "HOSPITAL_ADMIN") {
      if (req.user.hospitalId !== id) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      name,
      address,
      city,
      state,
      phone,
      email,
      status,
      hospitalAdminEmail,
      hospitalAdminName,
      hospitalAdminPassword,
      hospitalAdminPhone,
    }: Partial<HospitalRequest> = req.body;

    // Update hospital fields
    if (name) hospital.name = name;
    if (address) hospital.address = address;
    if (city) hospital.city = city;
    if (state) hospital.state = state;
    if (phone) hospital.phone = phone;
    if (email) {
      // Check if email is already taken by another hospital
      const existingHospital = await Hospital.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingHospital) {
        return res.status(400).json({ message: "Hospital with this email already exists" });
      }
      hospital.email = email.toLowerCase();
    }
    if (status) hospital.status = status;

    // Handle hospital admin assignment (only super_admin can do this)
    if (req.user.role === "SUPER_ADMIN") {
      if (hospitalAdminEmail && hospitalAdminName && hospitalAdminPassword) {
        // Check if user with this email already exists
        let hospitalAdmin = await User.findOne({ email: hospitalAdminEmail.toLowerCase() });
        
        if (hospitalAdmin) {
          // Update existing user to be hospital admin
          hospitalAdmin.role = "hospital_admin";
          hospitalAdmin.name = hospitalAdminName;
          if (hospitalAdminPassword) {
            hospitalAdmin.password = hospitalAdminPassword;
          }
          if (hospitalAdminPhone) {
            hospitalAdmin.phone = hospitalAdminPhone;
          }
          hospitalAdmin.hospitalId = hospital._id;
          await hospitalAdmin.save();
          hospital.hospitalAdmin = hospitalAdmin._id;
        } else {
          // Create new hospital admin user
          hospitalAdmin = new User({
            email: hospitalAdminEmail.toLowerCase(),
            name: hospitalAdminName,
            password: hospitalAdminPassword,
            phone: hospitalAdminPhone,
            role: "hospital_admin",
            hospitalId: hospital._id,
          });
          await hospitalAdmin.save();
          hospital.hospitalAdmin = hospitalAdmin._id;
        }
      }
    }

    await hospital.save();

    const populatedHospital = await Hospital.findById(hospital._id)
      .populate("hospitalAdmin", "name email phone role")
      .lean();

    res.json({
      success: true,
      message: "Hospital updated successfully",
      data: populatedHospital,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Hospital with this email already exists" });
    }
    next(err);
  }
};

// Delete hospital (only super_admin)
export const deleteHospital: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only super_admin can delete hospitals
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only super admin can delete hospitals" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Optionally, you might want to check if there are any users/doctors associated with this hospital
    // before deleting. For now, we'll just delete it.

    await Hospital.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Hospital deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
