import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Doctor } from "../models/doctorModel";
import { User } from "../models/userModel";
import { buildAccessFilter } from "../middlewares/authMiddleware";

export interface DoctorRequest {
  id?: string;
  Name_Designation: string;
  img?: string;
  role?: string;
  Department?: string;
  Phone: string;
  Email: string;
  password?: string; // Password for creating user account
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

export const getAllDoctors: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort as string || "-createdAt";

    const filter = buildAccessFilter(req.user);

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .select("_id id Name_Designation img role Department Phone Email Fees Status createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Doctor.countDocuments(filter),
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

export const getDoctorById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const filter = buildAccessFilter(req.user);
    filter.$or = [{ _id: id }, { id }];

    const doctor = await Doctor.findOne(filter)
      .select("_id id Name_Designation img role Department Phone Email Fees Status createdAt updatedAt")
      .lean()
      .exec();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(formatDoctorResponse(doctor));
  } catch (err) {
    next(err);
  }
};

export const createDoctor: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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

    // Normalize email for checking (lowercase, trim)
    const normalizedEmail = doctorData.Email.toLowerCase().trim();
    
    // Check if doctor with same email already exists (case-insensitive using regex)
    // Check both Email and email fields since schema might use either
    const emailRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const existingByEmail = await Doctor.findOne({
      $or: [
        { email: emailRegex },
        { Email: emailRegex }
      ]
    })
      .lean()
      .exec();
    
    if (existingByEmail) {
      return res.status(409).json({ 
        message: "Doctor with this email already exists",
        email: normalizedEmail 
      });
    }

    const existingById = await Doctor.findOne({ id: doctorData.id }).lean().exec();
    if (existingById) {
      return res.status(409).json({ message: "Doctor with this ID already exists" });
    }

    // Check if user account already exists with this email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        message: "User account with this email already exists",
        email: normalizedEmail 
      });
    }

    // Extract password before creating doctor (password is only for User account, not doctor record)
    const { password, email, ...doctorRecordData } = doctorData; // Remove email (lowercase) if present
    
    doctorRecordData.Email = normalizedEmail;
    const accessFilter = buildAccessFilter(req.user);
    const doctor = await Doctor.create({
      ...doctorRecordData,
      ...accessFilter,
    });

    // Create user account for login if password is provided
    if (password) {
      try {
        await User.create({
          email: normalizedEmail,
          password: password,
          name: doctorData.Name_Designation.split(" - ")[0] || doctorData.Name_Designation, // Extract name from Name_Designation
          phone: doctorData.Phone,
          role: "doctor",
          specialization: doctorData.Department,
        });
      } catch (userErr: any) {
        await Doctor.findByIdAndDelete(doctor._id);
        
        if (userErr.code === 11000) {
          return res.status(409).json({ message: "User account with this email already exists" });
        }
        throw userErr;
      }
    }

    res.status(201).json(formatDoctorResponse(doctor));
  } catch (err: any) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const fieldName = field === 'Email' || field === 'email' ? 'email' : field;
      return res.status(409).json({ 
        message: `Doctor with this ${fieldName} already exists`,
        field: fieldName,
        duplicateKey: err.keyValue
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

export const updateDoctor: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const updateData: Partial<DoctorRequest> = req.body;

    // Extract password before cleaning (password is only for User account, not doctor record)
    const { password, id: _ignoredId, _id: _ignoredMongoId, ...cleanUpdateData } = updateData;

    // Validate if updating required fields
    if (updateData.Email || updateData.Phone || updateData.Name_Designation || updateData.Status) {
      const validation = validateDoctorData({ ...updateData, Email: updateData.Email || "", Phone: updateData.Phone || "", Name_Designation: updateData.Name_Designation || "", Status: updateData.Status || "Available" });
      if (!validation.isValid && (updateData.Email || updateData.Phone || updateData.Name_Designation || updateData.Status)) {
        return res.status(400).json({ message: validation.error });
      }
    }

    const filter = buildAccessFilter(req.user);
    filter.$or = [{ _id: id }, { id }];

    const doctor = await Doctor.findOne(filter).exec();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Save old email before updating (needed for user account lookup)
    const oldEmail = doctor.Email?.toLowerCase();

    if (updateData.Email && updateData.Email !== doctor.Email) {
      const existingByEmail = await Doctor.findOne({ Email: updateData.Email })
        .lean()
        .exec() as { _id: mongoose.Types.ObjectId } | null;
      if (existingByEmail && existingByEmail._id.toString() !== doctor._id.toString()) {
        return res.status(409).json({ message: "Doctor with this email already exists" });
      }
      
      // Also check if user account exists with new email
      const existingUser = await User.findOne({ email: updateData.Email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ message: "User account with this email already exists" });
      }
    }

    // Update doctor (without password)
    Object.assign(doctor, cleanUpdateData);
    await doctor.save();

    // Update user account if email or password is being changed
    // Find user by old email (before update)
    let user = oldEmail ? await User.findOne({ email: oldEmail }) : null;
    
    // If email is being updated and user not found by old email, try new email
    if (!user && updateData.Email) {
      user = await User.findOne({ email: updateData.Email.toLowerCase() });
    }
    
    if (user) {
      // Update existing user account
      if (updateData.Email && updateData.Email !== doctor.Email) {
        user.email = updateData.Email.toLowerCase();
      }
      
      if (password) {
        user.password = password; // Will be hashed by the pre-save hook
      }
      
      // Update name and phone if they changed
      const doctorName = updateData.Name_Designation?.split(" - ")[0] || updateData.Name_Designation || doctor.Name_Designation?.split(" - ")[0] || doctor.Name_Designation;
      if (doctorName) {
        user.name = doctorName;
      }
      
      if (updateData.Phone) {
        user.phone = updateData.Phone;
      }
      
      if (updateData.Department) {
        user.specialization = updateData.Department;
      }
      
      await user.save();
    } else if (password) {
      // If user doesn't exist but password is provided, create user account
      // This handles the case where doctor was created before user accounts were implemented
      const newEmail = updateData.Email || doctor.Email;
      if (newEmail) {
        try {
          await User.create({
            email: newEmail.toLowerCase(),
            password: password,
            name: updateData.Name_Designation?.split(" - ")[0] || updateData.Name_Designation || doctor.Name_Designation?.split(" - ")[0] || doctor.Name_Designation,
            phone: updateData.Phone || doctor.Phone,
            role: "doctor",
            specialization: updateData.Department || doctor.Department,
          });
        } catch (userErr: any) {
          if (userErr.code === 11000) {
            return res.status(409).json({ message: "User account with this email already exists" });
          }
          throw userErr;
        }
      }
    }

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

export const deleteDoctor: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const filter = buildAccessFilter(req.user);
    filter.$or = [{ _id: id }, { id }];

    const doctor = await Doctor.findOneAndDelete(filter)
      .lean()
      .exec() as { _id: mongoose.Types.ObjectId; id?: string } | null;

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ message: "Doctor deleted successfully", id: doctor._id?.toString() || doctor.id || "" });
  } catch (err) {
    next(err);
  }
};
