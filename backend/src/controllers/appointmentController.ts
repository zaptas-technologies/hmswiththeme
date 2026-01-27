import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Appointment } from "../models/appointmentModel";
import { DashboardAppointment } from "../models/dashboardAppointmentModel";
import { DashboardPatient } from "../models/dashboardPatientModel";
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
    const Doctor = (req.query.doctor as string) || "";
    const Patient = (req.query.patient as string) || "";

    const filter = buildAccessFilter(req.user);
    
    if (Status) filter.Status = Status;
    if (Mode) filter.Mode = Mode;
    if (Patient) filter.Patient = Patient;

    if (Doctor) {
      const doctorRx = new RegExp(Doctor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.Doctor = doctorRx;
    }

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
    
    // Remove hospital from cleanApptData if it exists (we'll add it separately)
    const { hospital, ...finalApptData } = cleanApptData;
    
    // Ensure id and _id are not in finalApptData
    delete (finalApptData as any).id;
    delete (finalApptData as any)._id;
    
    const appointmentData: any = {
      ...finalApptData,
      ...(hospitalId && { hospital: hospitalId }),
    };

    const created = await Appointment.create(appointmentData);

    if (apptData.doctorId) {
      try {
        const doctorIdStr = String(apptData.doctorId).trim();
        const doctor = await Doctor.findById(doctorIdStr)
          .lean()
          .exec() as { Email?: string; email?: string } | null;
        
        if (doctor) {
          const doctorEmail = (doctor.Email || doctor.email || "").toLowerCase().trim();
          
          if (doctorEmail) {
            const user = await User.findOne({ email: doctorEmail }).select("_id").lean().exec();
            const dashboardDoctorId = user ? String(user._id) : doctorIdStr;
            
            let dashboardPatient = await DashboardPatient.findOne({
              doctorId: dashboardDoctorId,
              name: apptData.Patient,
              phone: apptData.Phone,
            })
              .lean()
              .exec() as { _id: mongoose.Types.ObjectId } | null;

            if (!dashboardPatient) {
              const newPatient = await DashboardPatient.create({
                doctorId: dashboardDoctorId,
                name: apptData.Patient,
                phone: apptData.Phone,
                avatar: apptData.Patient_Image || "assets/img/profiles/avatar-02.jpg",
              });
              dashboardPatient = { _id: newPatient._id };
            }

            let appointmentDate: Date;
            try {
              appointmentDate = new Date(apptData.Date_Time);
              if (isNaN(appointmentDate.getTime())) {
                const monthMap: Record<string, number> = {
                  "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
                  "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
                };
                const match = apptData.Date_Time.match(/(\d{1,2})\s+(\w{3})\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i);
                if (match) {
                  const [, day, month, year, hour, minute, ampm] = match;
                  const monthNum = monthMap[month];
                  if (monthNum !== undefined) {
                    let hour24 = parseInt(hour, 10);
                    if (ampm.toUpperCase() === "PM" && hour24 !== 12) hour24 += 12;
                    if (ampm.toUpperCase() === "AM" && hour24 === 12) hour24 = 0;
                    appointmentDate = new Date(parseInt(year, 10), monthNum, parseInt(day, 10), hour24, parseInt(minute, 10));
                  } else {
                    appointmentDate = new Date();
                  }
                } else {
                  appointmentDate = new Date();
                }
              }
            } catch {
              appointmentDate = new Date();
            }

            const statusMap: Record<string, "Schedule" | "Checked in" | "Checked Out" | "Cancelled"> = {
              "Schedule": "Schedule",
              "Scheduled": "Schedule",
              "Checked In": "Checked in",
              "Checked Out": "Checked Out",
              "Completed": "Checked Out",
              "Confirmed": "Schedule",
            };
            const dashboardStatus = statusMap[apptData.Status] || "Schedule";

            const modeMap: Record<string, "Online" | "In-Person"> = {
              "Online": "Online",
              "In-Person": "In-Person",
              "In Person": "In-Person",
            };
            const dashboardMode = modeMap[apptData.Mode || ""] || "In-Person";

            const fee = parseFloat(String(apptData.Fees)) || 0;

            await DashboardAppointment.create({
              doctorId: dashboardDoctorId,
              patientId: dashboardPatient._id,
              datetime: appointmentDate,
              mode: dashboardMode,
              status: dashboardStatus,
              fee: fee,
            });
          }
        }
      } catch (dashboardErr: any) {
        // Log error but don't fail the appointment creation
      }
    }

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
