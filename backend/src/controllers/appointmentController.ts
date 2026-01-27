import { RequestHandler } from "express";
import { getResourceModel } from "../models/resourceRegistry";
import mongoose from "mongoose";
import { DashboardAppointment } from "../models/dashboardAppointmentModel";
import { DashboardPatient } from "../models/dashboardPatientModel";
import { User } from "../models/userModel";
 
export interface AppointmentRequest {
  _id?: string;
  id?: string;
  Date_Time: string;
  Patient: string;
  Phone: string;
  Patient_Image?: string;
  Doctor_Image?: string;
  Doctor: string;
  doctorId?: string; // Doctor's _id for dashboard sync
  role?: string;
  Mode?: string;
  Status: string;
  Fees?: string | number; // Fee for dashboard sync
  [key: string]: any;
}
 
const formatAppointmentResponse = (appt: any) => {
  if (!appt) return appt;
  const obj = typeof appt.toObject === "function" ? appt.toObject() : appt;
  
  // Return only relevant fields for list view
  return {
    _id: obj._id,
    id: obj.id,
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
 
// GET /api/appointments
export const getAllAppointments: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("appointments");
 
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) || "-createdAt";
 
    const search = (req.query.search as string) || "";
    const Status = (req.query.status as string) || "";
    const Mode = (req.query.mode as string) || "";
    const Doctor = (req.query.doctor as string) || "";
    const Patient = (req.query.patient as string) || "";

    const filter: Record<string, any> = {};
    if (Status) filter.Status = Status;
    if (Mode) filter.Mode = Mode;
    if (Patient) filter.Patient = Patient;

    // Support flexible doctor name matching (exact or partial)
    if (Doctor) {
      const doctorRx = new RegExp(Doctor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.Doctor = doctorRx;
    }

    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ Patient: rx }, { Doctor: rx }, { Phone: rx }];
    }
 
    // Use select to only fetch necessary fields from database
    const [appts, total] = await Promise.all([
      Model.find(filter)
        .select("_id id Date_Time Patient Phone Patient_Image Doctor Mode Status Fees createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Model.countDocuments(filter),
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
 
// GET /api/appointments/:id
export const getAppointmentById: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("appointments");
    const { id } = req.params;
 
    const appt = await Model.findOne({ $or: [{ _id: id }, { id }] }).exec();
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
 
    res.json(formatAppointmentResponse(appt));
  } catch (err: any) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid appointment id" });
    }
    next(err);
  }
};
 
// POST /api/appointments
export const createAppointment: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("appointments");
    const apptData: AppointmentRequest = req.body;
 
    const validation = validateAppointmentData(apptData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }
 
    if (!apptData.id) {
      apptData.id =
        Date.now().toString() + Math.random().toString(36).slice(2, 9);
    }
 
    const existingById = await Model.findOne({ id: apptData.id }).exec();
    if (existingById) {
      return res.status(409).json({ message: "Appointment with this ID already exists" });
    }

    const created = await Model.create(apptData);

    // Sync to DashboardAppointment for doctor dashboard if doctorId is provided
    // IMPORTANT: doctorId from frontend is Doctor._id, but dashboard uses User._id (from login)
    // We need to find the User record by the doctor's email to get the correct User._id
    const doctorIdStr = apptData.doctorId 
      ? String(apptData.doctorId).trim() 
      : null;
    
    if (doctorIdStr) {
      try {
        // eslint-disable-next-line no-console
        console.log("[Appointment Sync] Starting sync for doctorId (Doctor._id):", doctorIdStr);
        
        // Find the Doctor record to get the email
        const DoctorModel = getResourceModel("doctors");
        const doctor = await DoctorModel.findById(doctorIdStr);
        
        if (!doctor) {
          // eslint-disable-next-line no-console
          console.warn("[Appointment Sync] Doctor not found with id:", doctorIdStr);
          // Skip sync if doctor not found
        } else {
          // Get doctor's email (try both Email and email fields)
          const doctorEmail = (doctor.Email || doctor.email || "").toLowerCase().trim();
          
          if (!doctorEmail) {
            // eslint-disable-next-line no-console
            console.warn("[Appointment Sync] Doctor has no email, cannot find User record");
          } else {
            // Find User record by email (this is the ID used in dashboard - req.userId)
            const user = await User.findOne({ email: doctorEmail });
            
            if (!user) {
              // eslint-disable-next-line no-console
              console.warn("[Appointment Sync] User not found with email:", doctorEmail, "- Dashboard sync will use Doctor._id");
            }
            
            // Use User._id if found, otherwise fallback to Doctor._id
            const dashboardDoctorId = user ? String(user._id) : doctorIdStr;
            
            // eslint-disable-next-line no-console
            console.log("[Appointment Sync] Using dashboard doctorId (User._id):", dashboardDoctorId);
            
            // Find or create DashboardPatient
            let dashboardPatient = await DashboardPatient.findOne({
              doctorId: dashboardDoctorId,
              name: apptData.Patient,
              phone: apptData.Phone,
            });

            if (!dashboardPatient) {
              // eslint-disable-next-line no-console
              console.log("[Appointment Sync] Creating new DashboardPatient");
              dashboardPatient = await DashboardPatient.create({
                doctorId: dashboardDoctorId,
                name: apptData.Patient,
                phone: apptData.Phone,
                avatar: apptData.Patient_Image || "assets/img/profiles/avatar-02.jpg",
              });
            } else {
              // eslint-disable-next-line no-console
              console.log("[Appointment Sync] Found existing DashboardPatient:", dashboardPatient._id);
            }

            // Parse Date_Time string to Date object
            // Format: "DD MMM YYYY, hh:mm A" (e.g., "15 Jan 2025, 02:30 PM")
            let appointmentDate: Date;
            try {
              const dateStr = apptData.Date_Time;
              // Try to parse the formatted date string
              // First try native Date parsing
              appointmentDate = new Date(dateStr);
              
              // If that fails, try manual parsing for "DD MMM YYYY, hh:mm A" format
              if (isNaN(appointmentDate.getTime())) {
                const monthMap: Record<string, number> = {
                  "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
                  "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
                };
                
                // Match pattern: "DD MMM YYYY, hh:mm A"
                const match = dateStr.match(/(\d{1,2})\s+(\w{3})\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i);
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

            // Map status to DashboardAppointment status enum
            const statusMap: Record<string, "Schedule" | "Checked in" | "Checked Out" | "Cancelled"> = {
              "Schedule": "Schedule",
              "Scheduled": "Schedule",
              "Checked In": "Checked in",
              "Checked Out": "Checked Out",
              "Completed": "Checked Out",
              "Confirmed": "Schedule",
              "Cancelled": "Cancelled",
            };
            const dashboardStatus = statusMap[apptData.Status] || "Schedule";

            // Map mode to DashboardAppointment mode enum
            const modeMap: Record<string, "Online" | "In-Person"> = {
              "Online": "Online",
              "In-Person": "In-Person",
              "In Person": "In-Person",
            };
            const dashboardMode = modeMap[apptData.Mode || ""] || "In-Person";

            // Get fee from Fees field or default to 0
            const fee = parseFloat(apptData.Fees as string) || 0;

            // Create DashboardAppointment using User._id (dashboardDoctorId)
            const dashboardAppt = await DashboardAppointment.create({
              doctorId: dashboardDoctorId,
              patientId: dashboardPatient._id,
              datetime: appointmentDate,
              mode: dashboardMode,
              status: dashboardStatus,
              fee: fee,
            });
            // eslint-disable-next-line no-console
            console.log("[Appointment Sync] Successfully created DashboardAppointment:", dashboardAppt._id);
          }
        }
      } catch (dashboardErr: any) {
        // Log error but don't fail the appointment creation
        // eslint-disable-next-line no-console
        console.error("[Appointment Sync] Failed to sync appointment to dashboard:", {
          error: dashboardErr.message,
          stack: dashboardErr.stack,
          doctorId: doctorIdStr,
          patient: apptData.Patient,
          doctorIdFromRequest: apptData.doctorId,
        });
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn("[Appointment Sync] No doctorId provided, skipping dashboard sync. doctorId value:", apptData.doctorId);
    }

    res.status(201).json(formatAppointmentResponse(created));
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate key error", key: err.keyValue });
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};
 
// PATCH /api/appointments/:id
export const updateAppointment: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("appointments");
    const { id } = req.params;
    const updates: Partial<AppointmentRequest> = req.body;
 
    // If caller attempts to change required fields, validate them.
    const validation = validateAppointmentData({
      Date_Time: updates.Date_Time ?? "x",
      Patient: updates.Patient ?? "x",
      Phone: updates.Phone ?? "x",
      Doctor: updates.Doctor ?? "x",
      Status: updates.Status ?? "x",
    } as any);
    // Only enforce when those fields are actually present
    if (
      (updates.Date_Time || updates.Patient || updates.Phone || updates.Doctor || updates.Status) &&
      !validation.isValid
    ) {
      return res.status(400).json({ message: validation.error });
    }
 
    const updated = await Model.findOneAndUpdate(
      { $or: [{ _id: id }, { id }] },
      { $set: updates },
      { new: true }
    ).exec();
 
    if (!updated) return res.status(404).json({ message: "Appointment not found" });
    res.json(formatAppointmentResponse(updated));
  } catch (err: any) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid appointment id" });
    }
    next(err);
  }
};
 
// DELETE /api/appointments/:id
export const deleteAppointment: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("appointments");
    const { id } = req.params;
 
    const deleted = await Model.findOneAndDelete({ $or: [{ _id: id }, { id }] }).exec();
    if (!deleted) return res.status(404).json({ message: "Appointment not found" });
 
    res.status(204).send();
  } catch (err: any) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid appointment id" });
    }
    next(err);
  }
};

