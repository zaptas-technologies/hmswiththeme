import { RequestHandler } from "express";
import mongoose from "mongoose";
import { DoctorSchedule, DaySchedule, DoctorScheduleDoc } from "../models/doctorScheduleModel";
import { Doctor } from "../models/doctorModel";
import { User } from "../models/userModel";

export interface ScheduleRequest {
  location: string;
  fromDate: string; // YYYY-MM-DD format
  toDate: string; // YYYY-MM-DD format
  recursEvery: string;
  schedules: DaySchedule[];
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Resolve the "Doctor" document _id for the currently logged-in user.
 * Auth middleware attaches `req.user.userId` (User model id).
 */
const resolveDoctorId = async (req: any): Promise<mongoose.Types.ObjectId | null> => {
  const userIdStr = req.user?.userId as string | undefined;
  if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) return null;

  // Primary: Doctor.user points to User._id
  const byUser = await Doctor.findOne({ user: new mongoose.Types.ObjectId(userIdStr) })
    .select("_id")
    .lean<{ _id: any } | null>();
  if (byUser?._id) return new mongoose.Types.ObjectId(byUser._id.toString());

  // Fallback: match by email if doctor.user linkage is missing
  const user = await User.findById(userIdStr).select("email").lean<{ email?: string } | null>();
  if (user?.email) {
    const rx = new RegExp(`^${escapeRegExp(user.email)}$`, "i");
    const byEmail = await Doctor.findOne({ $or: [{ Email: rx }, { email: rx }] })
      .select("_id")
      .lean<{ _id: any } | null>();
    if (byEmail?._id) return new mongoose.Types.ObjectId(byEmail._id.toString());
  }

  return null;
};

// Helper to format schedule response
const formatScheduleResponse = (schedule: DoctorScheduleDoc) => {
  return {
    id: schedule._id.toString(),
    doctorId: schedule.doctorId.toString(),
    location: schedule.location,
    hospitalId: schedule.hospital?.toString(),
    fromDate: schedule.fromDate.toISOString().split("T")[0],
    toDate: schedule.toDate.toISOString().split("T")[0],
    recursEvery: schedule.recursEvery,
    schedules: schedule.schedules,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
  };
};

// Helper to get default empty schedule
const getDefaultSchedule = () => ({
  location: "",
  fromDate: null,
  toDate: null,
  recursEvery: "",
  schedules: [
    { day: "Monday" as const, timeSlots: [] },
    { day: "Tuesday" as const, timeSlots: [] },
    { day: "Wednesday" as const, timeSlots: [] },
    { day: "Thursday" as const, timeSlots: [] },
    { day: "Friday" as const, timeSlots: [] },
    { day: "Saturday" as const, timeSlots: [] },
    { day: "Sunday" as const, timeSlots: [] },
  ],
});

export const getSchedule: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.status(403).json({ message: "Doctor profile not found for this user" });
    }

    // Optional hospital filter from query param
    const hospitalIdParam = req.query.hospitalId as string | undefined;
    let hospitalId: mongoose.Types.ObjectId | undefined;
    
    if (hospitalIdParam && mongoose.Types.ObjectId.isValid(hospitalIdParam)) {
      hospitalId = new mongoose.Types.ObjectId(hospitalIdParam);
    }

    // Build filter: doctorId + optional hospital
    const filter: any = { doctorId };
    if (hospitalId) {
      filter.hospital = hospitalId;
    }

    // Get the most recent active schedule for this doctor (optionally filtered by hospital)
    const schedule = await DoctorSchedule.findOne(filter)
      .sort({ createdAt: -1 })
      .exec();

    if (!schedule) {
      // Return default empty schedule structure
      return res.json(getDefaultSchedule());
    }

    res.json(formatScheduleResponse(schedule));
  } catch (err) {
    next(err);
  }
};

export const saveSchedule: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.status(403).json({ message: "Doctor profile not found for this user" });
    }

    const { location, fromDate, toDate, recursEvery, schedules }: ScheduleRequest = req.body;

    // Validation is handled by middleware, but double-check here for safety
    if (!location || !fromDate || !toDate || !recursEvery) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get doctor's hospital ID for saving with schedule
    const doctor = await Doctor.findById(doctorId).select("hospital").lean<{ hospital?: mongoose.Types.ObjectId } | null>();
    const hospitalId = doctor?.hospital ? new mongoose.Types.ObjectId(doctor.hospital.toString()) : undefined;

    // Debug logging (remove in production)
    console.log("Saving schedule for doctorId:", doctorId, "hospitalId:", hospitalId);
    console.log("Schedules data:", JSON.stringify(schedules, null, 2));

    // Parse dates
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    // Find existing schedule for this doctor and location/hospital
    // If hospitalId is provided, filter by it; otherwise match by location string
    const filter: any = { doctorId };
    if (hospitalId) {
      filter.hospital = hospitalId;
    } else {
      // Fallback: match by location string if hospital ID not available
      filter.location = location.trim();
    }
    
    const existingSchedule = await DoctorSchedule.findOne(filter)
      .sort({ createdAt: -1 })
      .exec();

    // Normalize schedules - ensure all days are present and timeSlots are properly structured
    const normalizedSchedules = schedules.map((daySchedule) => ({
      day: daySchedule.day,
      timeSlots: (daySchedule.timeSlots || []).map((slot) => ({
        session: String(slot.session || ""),
        from: String(slot.from || ""),
        to: String(slot.to || ""),
      })),
    }));

    if (existingSchedule) {
      // Update existing schedule - use set() to ensure Mongoose detects changes
      existingSchedule.set({
        location: location.trim(),
        hospital: hospitalId, // Update hospital ID if doctor's hospital changed
        fromDate: fromDateObj,
        toDate: toDateObj,
        recursEvery: recursEvery.trim(),
        schedules: normalizedSchedules,
      });
      
      // Mark the schedules array as modified for Mongoose (important for nested arrays)
      existingSchedule.markModified("schedules");
      
      const savedSchedule = await existingSchedule.save();

      // Verify the save worked
      if (!savedSchedule) {
        throw new Error("Failed to save schedule");
      }

      const totalTimeSlots = savedSchedule.schedules.reduce((sum: number, day: DaySchedule) => sum + day.timeSlots.length, 0);
      console.log("Updated schedule - Total timeSlots:", totalTimeSlots);
      
      return res.json(formatScheduleResponse(savedSchedule));
    } else {
      // Create new schedule with hospital ID
      const scheduleData: any = {
        doctorId,
        location: location.trim(),
        fromDate: fromDateObj,
        toDate: toDateObj,
        recursEvery: recursEvery.trim(),
        schedules: normalizedSchedules,
      };
      
      // Add hospital ID if available
      if (hospitalId) {
        scheduleData.hospital = hospitalId;
      }

      const newSchedule = await DoctorSchedule.create(scheduleData);

      const totalTimeSlots = newSchedule.schedules.reduce((sum: number, day: DaySchedule) => sum + day.timeSlots.length, 0);
      console.log("Created schedule - Total timeSlots:", totalTimeSlots);

      return res.status(201).json(formatScheduleResponse(newSchedule));
    }
  } catch (err: any) {
    // Log error for debugging
    console.error("Error saving schedule:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });

    // Handle MongoDB validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors,
        details: err.errors,
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: "Schedule already exists for this doctor" 
      });
    }

    // Return more detailed error in development
    return res.status(500).json({
      message: err.message || "Failed to save schedule",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

export const updateSchedule: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.status(403).json({ message: "Doctor profile not found for this user" });
    }

    const updateData: Partial<ScheduleRequest> = req.body;

    // Find existing schedule
    const schedule = await DoctorSchedule.findOne({ doctorId })
      .sort({ createdAt: -1 })
      .exec();

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Update only provided fields
    if (updateData.location !== undefined) {
      schedule.location = updateData.location.trim();
    }
    if (updateData.fromDate !== undefined) {
      schedule.fromDate = new Date(updateData.fromDate);
    }
    if (updateData.toDate !== undefined) {
      schedule.toDate = new Date(updateData.toDate);
    }
    if (updateData.recursEvery !== undefined) {
      schedule.recursEvery = updateData.recursEvery.trim();
    }
    if (updateData.schedules !== undefined) {
      // Normalize schedules before updating
      const normalizedSchedules = updateData.schedules.map((daySchedule) => ({
        day: daySchedule.day,
        timeSlots: (daySchedule.timeSlots || []).map((slot) => ({
          session: String(slot.session || ""),
          from: String(slot.from || ""),
          to: String(slot.to || ""),
        })),
      }));
      schedule.schedules = normalizedSchedules;
      schedule.markModified("schedules");
    }

    await schedule.save();

    return res.json(formatScheduleResponse(schedule));
  } catch (err: any) {
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

export const deleteSchedule: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.status(403).json({ message: "Doctor profile not found for this user" });
    }

    const schedule = await DoctorSchedule.findOne({ doctorId })
      .sort({ createdAt: -1 })
      .exec();

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    await schedule.deleteOne();

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getScheduleHistory: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.status(403).json({ message: "Doctor profile not found for this user" });
    }

    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const [schedules, total] = await Promise.all([
      DoctorSchedule.find({ doctorId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      DoctorSchedule.countDocuments({ doctorId }),
    ]);

    res.json({
      data: schedules.map(formatScheduleResponse),
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
