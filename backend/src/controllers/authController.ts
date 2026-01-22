import { RequestHandler } from "express";
import { User, type UserRole } from "../models/userModel";
import { Doctor } from "../models/doctorModel"; // Keep for backward compatibility

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    specialization?: string;
    avatar?: string;
    role: UserRole;
  };
  // Keep doctor for backward compatibility
  doctor?: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    specialization?: string;
    avatar?: string;
  };
}

// Simple JWT-like token (in production, use jsonwebtoken)
const generateToken = (userId: string): string => {
  return Buffer.from(JSON.stringify({ userId, doctorId: userId, timestamp: Date.now() })).toString("base64");
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Try User model first, fallback to Doctor model for backward compatibility
    let user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    let isLegacyDoctor = false;

    if (!user) {
      // Fallback to Doctor model for backward compatibility
      const doctor = await Doctor.findOne({ email: email.toLowerCase() }).select("+password");
      if (doctor) {
        isLegacyDoctor = true;
        // Convert doctor to user format
        user = {
          _id: doctor._id,
          email: doctor.email,
          password: doctor.password,
          name: doctor.name,
          phone: doctor.phone,
          specialization: doctor.specialization,
          avatar: doctor.avatar,
          role: "doctor" as UserRole,
          comparePassword: doctor.comparePassword.bind(doctor),
        } as any;
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id.toString());

    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      specialization: user.specialization,
      avatar: user.avatar,
      role: user.role,
    };

    const response: AuthResponse = {
      token,
      user: userResponse,
      // Include doctor field for backward compatibility if it's a doctor
      ...(user.role === "doctor" ? {
        doctor: {
          id: userResponse.id,
          email: userResponse.email,
          name: userResponse.name,
          phone: userResponse.phone,
          specialization: userResponse.specialization,
          avatar: userResponse.avatar,
        }
      } : {}),
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Try User model first, fallback to Doctor model for backward compatibility
    let user = await User.findById(userId);
    let isLegacyDoctor = false;

    if (!user) {
      const doctor = await Doctor.findById(userId);
      if (doctor) {
        isLegacyDoctor = true;
        // Convert doctor to user format
        user = {
          _id: doctor._id,
          email: doctor.email,
          name: doctor.name,
          phone: doctor.phone,
          specialization: doctor.specialization,
          avatar: doctor.avatar,
          role: "doctor" as UserRole,
        } as any;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      specialization: user.specialization,
      avatar: user.avatar,
      role: user.role,
    };

    res.json({
      user: userResponse,
      // Include doctor field for backward compatibility if it's a doctor
      ...(user.role === "doctor" ? {
        doctor: {
          id: userResponse.id,
          email: userResponse.email,
          name: userResponse.name,
          phone: userResponse.phone,
          specialization: userResponse.specialization,
          avatar: userResponse.avatar,
        }
      } : {}),
    });
  } catch (err) {
    next(err);
  }
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { email, password, name, phone, specialization, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    // Check if user already exists in User model
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Check if user exists in Doctor model (backward compatibility)
    const existingDoctor = await Doctor.findOne({ email: email.toLowerCase() });
    if (existingDoctor) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Create user with role (default to "doctor" if not specified)
    const userRole = (role || "doctor") as UserRole;
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      phone,
      specialization,
      role: userRole,
    });

    const token = generateToken(user._id.toString());

    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      specialization: user.specialization,
      avatar: user.avatar,
      role: user.role,
    };

    const response: AuthResponse = {
      token,
      user: userResponse,
      // Include doctor field for backward compatibility if it's a doctor
      ...(user.role === "doctor" ? {
        doctor: {
          id: userResponse.id,
          email: userResponse.email,
          name: userResponse.name,
          phone: userResponse.phone,
          specialization: userResponse.specialization,
          avatar: userResponse.avatar,
        }
      } : {}),
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};
