import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Appointment } from "../models/appointmentModel";
import { User } from "../models/userModel";
import { Doctor } from "../models/doctorModel";
import { buildAccessFilter } from "../middlewares/authMiddleware";

export interface AppointmentRequest {
  Date_Time: string;
  Patient: string;
  Phone: string;
  Patient_Image?: string;
  Doctor_Image?: string;
  Doctor: string;
  doctorId?: string;
  role?: string;
  Mode?: string;
  Status: string;
  Fees?: string | number;
  [key: string]: any;
}

const formatAppointmentResponse = (appt: any) => {
  if (!appt) return appt;
  const obj = typeof appt.toObject === "function" ? appt.toObject() : appt;
  
  return {
    _id: obj._id?.toString() || obj._id,
    id: obj._id?.toString() || obj._id, // For backward compatibility, map _id to id
    Date_Time: obj.Date_Time,
    Patient: obj.Patient,
    Phone: obj.Phone,
    Patient_Image: obj.Patient_Image,
    Doctor: obj.Doctor,
    Mode: obj.Mode,
    Status: obj.Status,
    Fees: obj.Fees,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const validateAppointmentData = (
  data: Partial<AppointmentRequest>
): { isValid: boolean; error?: string } => {
  if (!data) return { isValid: false, error: "Missing request body" };
  if (!data.Date_Time || typeof data.Date_Time !== "string") {
    return { isValid: false, error: "Date_Time is required" };
  }
  if (!data.Patient || typeof data.Patient !== "string") {
    return { isValid: false, error: "Patient is required" };
  }
  if (!data.Phone || typeof data.Phone !== "string") {
    return { isValid: false, error: "Phone is required" };
  }
  if (!data.Doctor || typeof data.Doctor !== "string") {
    return { isValid: false, error: "Doctor is required" };
  }
  if (!data.Status || typeof data.Status !== "string") {
    return { isValid: false, error: "Status is required" };
  }
  return { isValid: true };
};

export const getAllAppointments: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) || "-createdAt";

    const search = (req.query.search as string) || "";
    const Status = (req.query.status as string) || "";
    const Mode = (req.query.mode as string) || "";
    const Patient = (req.query.patient as string) || "";

    // Build filter similar to dashboardService - simple approach
    const filter: any = {};
    
    // For doctors (USER role), filter by hospital and doctorId
    if (req.user.role === "USER") {
      try {
        // Find doctor by user ID or email (same approach as dashboardService)
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

        // Add doctorId filter - ensures appointments are filtered by specific doctor
        if (doctor?._id) {
          filter.doctorId = new mongoose.Types.ObjectId(doctor._id.toString());
        }

        // Add hospital filter if doctor is associated with a hospital
        if (doctor?.hospital) {
          filter.hospital = new mongoose.Types.ObjectId(doctor.hospital.toString());
        }

        // Add doctor name filter (same as dashboardService)
        if (doctor?.Name_Designation) {
          filter.Doctor = doctor.Name_Designation;
        }
      } catch (error) {
        // If we can't find doctor, continue without filters
        // eslint-disable-next-line no-console
        console.error("Error fetching doctor for appointments:", error);
      }
    } else {
      // For other roles, use buildAccessFilter
      const accessFilter = buildAccessFilter(req.user);
      Object.assign(filter, accessFilter);
    }
    
    // Apply additional filters
    if (Status) filter.Status = Status;
    if (Mode) filter.Mode = Mode;
    if (Patient) filter.Patient = Patient;

    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ Patient: rx }, { Doctor: rx }, { Phone: rx }];
    }

    const [appts, total] = await Promise.all([
      Appointment.find(filter)
        .select("_id Date_Time Patient Phone Patient_Image Doctor Mode Status Fees createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Appointment.countDocuments(filter),
    ]);

    res.json({
      data: appts.map(formatAppointmentResponse),
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

export const getAppointmentById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const filter = buildAccessFilter(req.user);
    
    // Use _id only (MongoDB ObjectId)
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter._id = new mongoose.Types.ObjectId(id);
    } else {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const appt = await Appointment.findOne(filter)
      .select("_id Date_Time Patient Phone Patient_Image Doctor Mode Status Fees createdAt updatedAt")
      .lean()
      .exec();
    
    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(formatAppointmentResponse(appt));
  } catch (err: any) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid appointment id" });
    }
    next(err);
  }
};

export const createAppointment: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const apptData: AppointmentRequest = req.body;

    const validation = validateAppointmentData(apptData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Remove id field if present (we use MongoDB's _id)
    const { id: _ignoredId, _id: _ignoredMongoId, ...cleanApptData } = apptData;
    
    // Explicitly delete id field to ensure it's not included (handles cases where id might be undefined/null/empty)
    delete (cleanApptData as any).id;
    delete (cleanApptData as any)._id;

    const accessFilter = buildAccessFilter(req.user);
    
    // Ensure hospital is ObjectId if provided
    let hospitalId: mongoose.Types.ObjectId | undefined;
    
    if (accessFilter.hospital) {
      // Hospital from user role (should be string from buildAccessFilter)
      if (typeof accessFilter.hospital === 'string') {
        if (mongoose.Types.ObjectId.isValid(accessFilter.hospital)) {
          hospitalId = new mongoose.Types.ObjectId(accessFilter.hospital);
        } else {
          return res.status(400).json({ message: "Invalid hospital ID format from user role" });
        }
      } else if (accessFilter.hospital instanceof mongoose.Types.ObjectId) {
        hospitalId = accessFilter.hospital;
      }
    } else if (cleanApptData.hospital) {
      // Hospital from request body (could be string or ObjectId)
      if (typeof cleanApptData.hospital === 'string') {
        if (mongoose.Types.ObjectId.isValid(cleanApptData.hospital)) {
          hospitalId = new mongoose.Types.ObjectId(cleanApptData.hospital);
        } else {
          return res.status(400).json({ message: "Invalid hospital ID format in request body" });
        }
      } else if (cleanApptData.hospital instanceof mongoose.Types.ObjectId) {
        hospitalId = cleanApptData.hospital;
      }
    }
    
    // Remove hospital and doctorId from cleanApptData if they exist (we'll add them separately)
    const { hospital, doctorId, ...finalApptData } = cleanApptData;
    
    // Ensure id and _id are not in finalApptData
    delete (finalApptData as any).id;
    delete (finalApptData as any)._id;
    
    // Convert doctorId to ObjectId if provided
    let doctorObjectId: mongoose.Types.ObjectId | undefined;
    if (doctorId) {
      const doctorIdStr = String(doctorId).trim();
      if (mongoose.Types.ObjectId.isValid(doctorIdStr)) {
        doctorObjectId = new mongoose.Types.ObjectId(doctorIdStr);
      } else {
        return res.status(400).json({ message: "Invalid doctorId format. Must be a valid ObjectId." });
      }
    }
    
    const appointmentData: any = {
      ...finalApptData,
      ...(hospitalId && { hospital: hospitalId }),
      ...(doctorObjectId && { doctorId: doctorObjectId }),
    };

    const created = await Appointment.create(appointmentData);

    res.status(201).json(formatAppointmentResponse(created));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      // If the error is about 'id' field, provide a more helpful message
      if (field === 'id') {
        return res.status(409).json({
          message: "An appointment with this identifier already exists. Please refresh and try again.",
        });
      }
      return res.status(409).json({ 
        message: `Appointment with this ${field} already exists`,
        key: err.keyValue 
      });
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const updateAppointment: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const updates: Partial<AppointmentRequest> = req.body;

    // Remove id field if present
    const { id: _ignoredId, _id: _ignoredMongoId, ...cleanUpdates } = updates;

    const validation = validateAppointmentData({
      Date_Time: cleanUpdates.Date_Time ?? "x",
      Patient: cleanUpdates.Patient ?? "x",
      Phone: cleanUpdates.Phone ?? "x",
      Doctor: cleanUpdates.Doctor ?? "x",
      Status: cleanUpdates.Status ?? "x",
    } as any);

    if (
      (cleanUpdates.Date_Time || cleanUpdates.Patient || cleanUpdates.Phone || cleanUpdates.Doctor || cleanUpdates.Status) &&
      !validation.isValid
    ) {
      return res.status(400).json({ message: validation.error });
    }

    const filter = buildAccessFilter(req.user);
    
    // Use _id only (MongoDB ObjectId)
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter._id = new mongoose.Types.ObjectId(id);
    } else {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const updated = await Appointment.findOneAndUpdate(
      filter,
      { $set: cleanUpdates },
      { new: true }
    )
      .select("_id Date_Time Patient Phone Patient_Image Doctor Mode Status Fees createdAt updatedAt")
      .lean()
      .exec();

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(formatAppointmentResponse(updated));
  } catch (err: any) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid appointment id" });
    }
    next(err);
  }
};

export const deleteAppointment: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const filter = buildAccessFilter(req.user);
    
    // Use _id only (MongoDB ObjectId)
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter._id = new mongoose.Types.ObjectId(id);
    } else {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const deleted = await Appointment.findOneAndDelete(filter).lean().exec();
    
    if (!deleted) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(204).send();
  } catch (err: any) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid appointment id" });
    }
    next(err);
  }
};
