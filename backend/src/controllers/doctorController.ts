import { RequestHandler } from "express";
import { getResourceModel } from "../models/resourceRegistry";
import mongoose from "mongoose";

export interface DoctorRequest {
  id?: string;
  Name_Designation: string;
  img?: string;
  role?: string;
  Department?: string;
  Phone: string;
  Email: string;
  Fees?: string;
  Status: "Available" | "Unavailable";
  
  // Extended fields
  username?: string;
  dob?: string;
  yearOfExperience?: string;
  medicalLicenseNumber?: string;
  languageSpoken?: string[];
  bio?: string;
  featureOnWebsite?: boolean;
  bloodGroup?: string;
  gender?: string;
  
  // Address
  address1?: string;
  address2?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  
  // Schedule
  schedules?: Array<{
    day: string;
    timeSlots: Array<{
      session: string;
      from: string;
      to: string;
    }>;
  }>;
  
  // Appointment info
  appointmentType?: string;
  acceptBookingsInAdvance?: string;
  appointmentDuration?: string;
  consultationCharge?: string;
  maxBookingsPerSlot?: string;
  displayOnBookingPage?: boolean;
  
  // Education, Awards, Certifications
  education?: Array<{
    degree: string;
    university: string;
    from: string;
    to: string;
  }>;
  awards?: Array<{
    name: string;
    from: string;
  }>;
  certifications?: Array<{
    name: string;
    from: string;
  }>;
  
  [key: string]: any;
}

// Helper to format doctor response
const formatDoctorResponse = (doctor: any) => {
  const doc = doctor.toObject ? doctor.toObject() : doctor;
  return {
    ...doc,
    _id: doc._id?.toString() || doc._id,
    id: doc.id || doc._id?.toString(),
    // Ensure img field is included (use img or avatar field)
    img: doc.img || doc.avatar || "assets/img/doctors/doctor-01.jpg",
    // Map role to Designation if needed
    Designation: doc.role || doc.Designation,
    // Ensure all optional fields have default values
    languageSpoken: doc.languageSpoken || [],
    schedules: doc.schedules || [],
    education: doc.education || [],
    awards: doc.awards || [],
    certifications: doc.certifications || [],
  };
};

// Validation helper
const validateDoctorData = (data: Partial<DoctorRequest>): { isValid: boolean; error?: string } => {
  if (!data.Name_Designation || typeof data.Name_Designation !== "string" || data.Name_Designation.trim() === "") {
    return { isValid: false, error: "Name_Designation is required" };
  }

  if (!data.Email || typeof data.Email !== "string" || data.Email.trim() === "") {
    return { isValid: false, error: "Email is required" };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.Email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  if (!data.Phone || typeof data.Phone !== "string" || data.Phone.trim() === "") {
    return { isValid: false, error: "Phone is required" };
  }

  if (!data.Status || !["Available", "Unavailable"].includes(data.Status)) {
    return { isValid: false, error: "Status must be 'Available' or 'Unavailable'" };
  }

  return { isValid: true };
};

// GET /api/doctors - Get all doctors with pagination
export const getAllDoctors: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("doctors");
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort as string || "-createdAt";

    const [doctors, total] = await Promise.all([
      Model.find({}).sort(sort).skip(skip).limit(limit).exec(),
      Model.countDocuments({}),
    ]);

    res.json({
      data: doctors.map(formatDoctorResponse),
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

// GET /api/doctors/:id - Get doctor by ID
export const getDoctorById: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("doctors");
    const { id } = req.params;

    let doctor;
    if (mongoose.Types.ObjectId.isValid(id)) {
      doctor = await Model.findById(id);
    }
    
    if (!doctor) {
      doctor = await Model.findOne({ id });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(formatDoctorResponse(doctor));
  } catch (err) {
    next(err);
  }
};

// POST /api/doctors - Create new doctor
export const createDoctor: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("doctors");
    const doctorData: DoctorRequest = req.body;

    // Validate required fields
    const validation = validateDoctorData(doctorData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Generate ID if not provided
    if (!doctorData.id) {
      doctorData.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Check if doctor with same email or id already exists
    const existingByEmail = await Model.findOne({ Email: doctorData.Email });
    if (existingByEmail) {
      return res.status(409).json({ message: "Doctor with this email already exists" });
    }

    const existingById = await Model.findOne({ id: doctorData.id });
    if (existingById) {
      return res.status(409).json({ message: "Doctor with this ID already exists" });
    }

    const doctor = await Model.create(doctorData);
    res.status(201).json(formatDoctorResponse(doctor));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ 
        message: `Doctor with this ${field} already exists` 
      });
    }
    
    // Handle validation errors
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

// PATCH /api/doctors/:id - Update doctor
export const updateDoctor: RequestHandler = async (req, res, next) => {
  // Set CORS headers on the actual response
  const origin = req.headers.origin;
  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, Accept, Origin");
  
  try {
    const Model = getResourceModel("doctors");
    const { id } = req.params;
    const updateData: Partial<DoctorRequest> = req.body;

    // Don't allow updating id or _id
    const { id: _ignoredId, _id: _ignoredMongoId, ...cleanUpdateData } = updateData;

    // Validate if updating required fields
    if (updateData.Email || updateData.Phone || updateData.Name_Designation || updateData.Status) {
      const validation = validateDoctorData({ ...updateData, Email: updateData.Email || "", Phone: updateData.Phone || "", Name_Designation: updateData.Name_Designation || "", Status: updateData.Status || "Available" });
      if (!validation.isValid && (updateData.Email || updateData.Phone || updateData.Name_Designation || updateData.Status)) {
        return res.status(400).json({ message: validation.error });
      }
    }

    // Find doctor by _id or id
    let doctor;
    if (mongoose.Types.ObjectId.isValid(id)) {
      doctor = await Model.findById(id);
    }
    
    if (!doctor) {
      doctor = await Model.findOne({ id });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check for email conflict if email is being updated
    if (updateData.Email && updateData.Email !== doctor.Email) {
      const existingByEmail = await Model.findOne({ Email: updateData.Email });
      if (existingByEmail && existingByEmail._id.toString() !== doctor._id.toString()) {
        return res.status(409).json({ message: "Doctor with this email already exists" });
      }
    }

    // Update doctor
    Object.assign(doctor, cleanUpdateData);
    await doctor.save();

    res.json(formatDoctorResponse(doctor));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ 
        message: `Doctor with this ${field} already exists` 
      });
    }
    
    // Handle validation errors
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

// DELETE /api/doctors/:id - Delete doctor
export const deleteDoctor: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("doctors");
    const { id } = req.params;

    let doctor;
    if (mongoose.Types.ObjectId.isValid(id)) {
      doctor = await Model.findByIdAndDelete(id);
    }
    
    if (!doctor) {
      doctor = await Model.findOneAndDelete({ id });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ message: "Doctor deleted successfully", id: doctor._id?.toString() || doctor.id });
  } catch (err) {
    next(err);
  }
};
