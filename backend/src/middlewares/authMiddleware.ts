import { RequestHandler } from "express";
import { User } from "../models/userModel";

export type UserRole = "USER" | "HOSPITAL_ADMIN" | "SUPER_ADMIN";

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  hospitalId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Unified authentication middleware
 * Decodes JWT token and attaches user info to req.user
 */
export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized. Missing or invalid Authorization header." });
    }

    const token = authHeader.substring(7);
    
    // Decode base64 token (simple JWT-like implementation)
    let decoded: { userId?: string; doctorId?: string; timestamp?: number };
    try {
      decoded = JSON.parse(Buffer.from(token, "base64").toString());
    } catch {
      return res.status(401).json({ message: "Unauthorized. Invalid token format." });
    }

    const userId = decoded.userId || decoded.doctorId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Token missing userId." });
    }

    // Fetch user from database to get role and hospitalId
    const user = await User.findById(userId).select("_id role hospitalId").lean();
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    // Map user role to standardized roles
    let role: UserRole;
    if (user.role === "super_admin") {
      role = "SUPER_ADMIN";
    } else if (user.role === "hospital_admin") {
      role = "HOSPITAL_ADMIN";
    } else {
      role = "USER";
    }

    // Attach user info to request
    req.user = {
      userId: user._id.toString(),
      role,
      hospitalId: user.hospitalId?.toString(),
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized. Token validation failed." });
  }
};

/**
 * Middleware to require specific role(s)
 */
export const requireRole = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden. Insufficient permissions." });
    }

    next();
  };
};

/**
 * Helper to build query filter based on user role
 */
export const buildAccessFilter = (user: AuthenticatedUser): Record<string, any> => {
  if (user.role === "SUPER_ADMIN") {
    return {}; // Can access all records
  }

  if (user.role === "HOSPITAL_ADMIN") {
    if (!user.hospitalId) {
      throw new Error("HOSPITAL_ADMIN must have hospitalId");
    }
    return { hospital: user.hospitalId };
  }

  // USER role - can only see their own data
  return { user: user.userId };
};
