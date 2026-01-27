import { RequestHandler } from "express";
import mongoose from "mongoose";
import { DoctorLeave } from "../models/doctorLeaveModel";
import { buildAccessFilter } from "../middlewares/authMiddleware";

export interface DoctorLeaveRequest {
  Doctor: string;
  Doctor_Id?: string;
  Date: string; // Format: "15 Apr 2026- 15 Apr 2025"
  From_Date?: Date | string;
  To_Date?: Date | string;
  Leave_Type: string;
  Day: string; // Format: "01 Day" or "02 Days"
  No_Of_Days?: number;
  Applied_On: string;
  Applied_On_Date?: Date | string;
  Status: "Applied" | "Approved" | "Rejected";
  Reason?: string;
  Department?: string;
  Designation?: string;
  [key: string]: any;
}

const formatDoctorLeaveResponse = (leave: any) => {
  if (!leave) return leave;
  const obj = typeof leave.toObject === "function" ? leave.toObject() : leave;
  return {
    ...obj,
    _id: obj._id?.toString() || obj._id,
    id: obj._id?.toString() || obj._id, // For backward compatibility, map _id to id
  };
};

const validateDoctorLeaveData = (
  data: Partial<DoctorLeaveRequest>
): { isValid: boolean; error?: string } => {
  if (!data) return { isValid: false, error: "Missing request body" };
  if (!data.Doctor || typeof data.Doctor !== "string") {
    return { isValid: false, error: "Doctor is required" };
  }
  if (!data.Leave_Type || typeof data.Leave_Type !== "string") {
    return { isValid: false, error: "Leave_Type is required" };
  }
  if (!data.Status || !["Applied", "Approved", "Rejected"].includes(data.Status)) {
    return { isValid: false, error: "Status must be Applied, Approved, or Rejected" };
  }
  return { isValid: true };
};

// Helper to format date as "DD MMM YYYY"
const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate().toString().padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

// Helper to calculate days and format date string
const calculateLeaveDays = (fromDate: Date | string, toDate: Date | string): { days: number; dayString: string; dateString: string } => {
  const from = typeof fromDate === "string" ? new Date(fromDate) : fromDate;
  const to = typeof toDate === "string" ? new Date(toDate) : toDate;
  
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const days = diffDays + 1; // Include both start and end days
  
  const dayString = days === 1 ? "01 Day" : `${days.toString().padStart(2, "0")} Days`;
  const fromStr = formatDate(from);
  const toStr = formatDate(to);
  const dateString = fromStr === toStr ? `${fromStr} - ${toStr}` : `${fromStr} - ${toStr}`;
  
  return { days, dayString, dateString };
};

export const getAllDoctorLeaves: RequestHandler = async (req, res, next) => {
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
    const doctor = (req.query.doctor as string) || "";
    const leaveType = (req.query.leaveType as string) || "";
    const department = (req.query.department as string) || "";
    const designation = (req.query.designation as string) || "";
    const dateFrom = (req.query.dateFrom as string) || "";
    const dateTo = (req.query.dateTo as string) || "";

    const filter = buildAccessFilter(req.user);
    if (status) filter.Status = status;
    if (doctor) filter.Doctor = new RegExp(doctor, "i");
    if (leaveType) filter.Leave_Type = new RegExp(leaveType, "i");
    if (department) filter.Department = new RegExp(department, "i");
    if (designation) filter.Designation = new RegExp(designation, "i");

    // Date range filter - leaves that overlap with the requested date range
    if (dateFrom || dateTo) {
      const dateConditions: any[] = [];
      if (dateFrom && dateTo) {
        // Leave overlaps if: From_Date <= dateTo AND To_Date >= dateFrom
        filter.$and = [
          { $or: [{ From_Date: { $lte: new Date(dateTo) } }, { From_Date: { $exists: false } }] },
          { $or: [{ To_Date: { $gte: new Date(dateFrom) } }, { To_Date: { $exists: false } }] },
        ];
      } else if (dateFrom) {
        filter.$or = [{ To_Date: { $gte: new Date(dateFrom) } }, { To_Date: { $exists: false } }];
      } else if (dateTo) {
        filter.$or = [{ From_Date: { $lte: new Date(dateTo) } }, { From_Date: { $exists: false } }];
      }
    }

    // Search filter
    if (search) {
      const rx = new RegExp(search, "i");
      const searchConditions = {
        $or: [{ Doctor: rx }, { Leave_Type: rx }, { Department: rx }, { Designation: rx }],
      };
      // Combine with existing $and if present
      if (filter.$and) {
        filter.$and.push(searchConditions);
      } else {
        Object.assign(filter, searchConditions);
      }
    }

    const [leaves, total] = await Promise.all([
      DoctorLeave.find(filter)
        .select("_id Doctor Doctor_Id Date From_Date To_Date Leave_Type Day No_Of_Days Applied_On Applied_On_Date Status Reason Department Designation createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      DoctorLeave.countDocuments(filter),
    ]);

    res.json({
      data: leaves.map(formatDoctorLeaveResponse),
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

export const getDoctorLeaveById: RequestHandler = async (req, res, next) => {
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
      return res.status(400).json({ message: "Invalid doctor leave ID format" });
    }

    const leave = await DoctorLeave.findOne(filter)
      .select("_id Doctor Doctor_Id Date From_Date To_Date Leave_Type Day No_Of_Days Applied_On Applied_On_Date Status Reason Department Designation createdAt updatedAt")
      .lean()
      .exec();

    if (!leave) {
      return res.status(404).json({ message: "Doctor leave not found" });
    }

    res.json(formatDoctorLeaveResponse(leave));
  } catch (err) {
    next(err);
  }
};

export const createDoctorLeave: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const leaveData: DoctorLeaveRequest = req.body;

    // Validate required fields
    const validation = validateDoctorLeaveData(leaveData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Remove id field if present (we use MongoDB's _id)
    const { id: _ignoredId, ...cleanLeaveData } = leaveData;

    // Calculate days and format date string if From_Date and To_Date are provided
    if (cleanLeaveData.From_Date && cleanLeaveData.To_Date) {
      const { days, dayString, dateString } = calculateLeaveDays(
        cleanLeaveData.From_Date,
        cleanLeaveData.To_Date
      );
      cleanLeaveData.No_Of_Days = days;
      cleanLeaveData.Day = dayString;
      if (!cleanLeaveData.Date) {
        cleanLeaveData.Date = dateString;
      }
    }

    // Set Applied_On_Date if Applied_On is provided
    if (cleanLeaveData.Applied_On && !cleanLeaveData.Applied_On_Date) {
      cleanLeaveData.Applied_On_Date = new Date();
    }

    const accessFilter = buildAccessFilter(req.user);
    const leave = await DoctorLeave.create({
      ...cleanLeaveData,
      ...accessFilter,
    });
    res.status(201).json(formatDoctorLeaveResponse(leave));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `Doctor leave with this ${field} already exists`,
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

export const updateDoctorLeave: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const updateData: Partial<DoctorLeaveRequest> = req.body;

    const { id: _ignoredId, _id: _ignoredMongoId, ...cleanUpdateData } = updateData;

    if (updateData.Status && !["Applied", "Approved", "Rejected"].includes(updateData.Status)) {
      return res.status(400).json({ message: "Status must be Applied, Approved, or Rejected" });
    }

    const filter = buildAccessFilter(req.user);
    
    // Use _id only (MongoDB ObjectId)
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter._id = new mongoose.Types.ObjectId(id);
    } else {
      return res.status(400).json({ message: "Invalid doctor leave ID format" });
    }

    let leave = await DoctorLeave.findOne(filter).exec();

    if (!leave) {
      return res.status(404).json({ message: "Doctor leave not found" });
    }

    if (cleanUpdateData.From_Date || cleanUpdateData.To_Date) {
      const fromDate = cleanUpdateData.From_Date || leave.From_Date || leave.Date;
      const toDate = cleanUpdateData.To_Date || leave.To_Date || leave.Date;
      
      if (fromDate && toDate) {
        const { days, dayString, dateString } = calculateLeaveDays(fromDate, toDate);
        cleanUpdateData.No_Of_Days = days;
        cleanUpdateData.Day = dayString;
        cleanUpdateData.Date = dateString;
      }
    }

    Object.assign(leave, cleanUpdateData);
    await leave.save();

    res.json(formatDoctorLeaveResponse(leave));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `Doctor leave with this ${field} already exists`,
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

export const deleteDoctorLeave: RequestHandler = async (req, res, next) => {
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
      return res.status(400).json({ message: "Invalid doctor leave ID format" });
    }

    const leave = await DoctorLeave.findOneAndDelete(filter).lean().exec();

    if (!leave) {
      return res.status(404).json({ message: "Doctor leave not found" });
    }

    res.json({ message: "Doctor leave deleted successfully" });
  } catch (err) {
    next(err);
  }
};
