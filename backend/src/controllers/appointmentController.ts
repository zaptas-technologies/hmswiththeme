import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Appointment } from "../models/appointmentModel";
import { User } from "../models/userModel";
import { Doctor } from "../models/doctorModel";
import { DoctorSchedule } from "../models/doctorScheduleModel";
import { buildAccessFilter } from "../middlewares/authMiddleware";

export interface AppointmentRequest {
  Date_Time: string;
  appointmentDate?: string; // YYYY-MM-DD
  slotTime?: string; // HH:mm
  dateTime?: string | Date; // ISO string or Date (optional)
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
  /** Payment collected at reception (pay-first when booking) */
  amountPaid?: number;
  paymentMode?: string;
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
    amountPaid: obj.amountPaid,
    paymentStatus: obj.paymentStatus,
    paymentMode: obj.paymentMode,
    hospital: obj.hospital?.toString?.() || obj.hospital,
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
        .select("_id Date_Time Patient Phone Patient_Image Doctor Mode Status Fees amountPaid paymentStatus paymentMode createdAt updatedAt")
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
      .select("_id Date_Time Patient Phone Patient_Image Doctor Mode Status Fees amountPaid paymentStatus paymentMode createdAt updatedAt")
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
    
    // Convert user to ObjectId (always required)
    const userId = accessFilter.user 
      ? (typeof accessFilter.user === 'string' 
          ? new mongoose.Types.ObjectId(accessFilter.user)
          : accessFilter.user)
      : new mongoose.Types.ObjectId(req.user.userId);
    
    // Resolve hospital ID (prefer auth context if available)
    let hospitalId: mongoose.Types.ObjectId | undefined;

    // If auth middleware attached hospitalId, always prefer it
    if (req.user.hospitalId && mongoose.Types.ObjectId.isValid(req.user.hospitalId)) {
      hospitalId = new mongoose.Types.ObjectId(req.user.hospitalId);
    }
    
    if (req.user.role === "USER") {
      // For doctors, find their hospital from Doctor model
      try {
        let doctor = await Doctor.findOne({ user: req.user.userId })
          .select("hospital")
          .lean() as { hospital?: any } | null;
        
        if (!doctor) {
          const user = await User.findById(req.user.userId).select("email").lean();
          if (user?.email) {
            doctor = await Doctor.findOne({
              $or: [
                { Email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                { email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
              ],
            })
              .select("hospital")
              .lean() as { hospital?: any } | null;
          }
        }
        
        if (!hospitalId && doctor?.hospital) {
          hospitalId = new mongoose.Types.ObjectId(doctor.hospital.toString());
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching doctor hospital for appointment:", error);
      }
    } else if (accessFilter.hospital) {
      // For HOSPITAL_ADMIN or SUPER_ADMIN, use from accessFilter
      if (typeof accessFilter.hospital === 'string') {
        if (mongoose.Types.ObjectId.isValid(accessFilter.hospital)) {
          hospitalId = new mongoose.Types.ObjectId(accessFilter.hospital);
        } else {
          return res.status(400).json({ message: "Invalid hospital ID format from user role" });
        }
      } else if (accessFilter.hospital instanceof mongoose.Types.ObjectId) {
        hospitalId = accessFilter.hospital;
      }
    }
    
    // Allow hospital override from request body (if provided)
    if (cleanApptData.hospital) {
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

    // Pay-first: require payment at reception when booking appointment
    const amountPaid = Number(req.body.amountPaid);
    const paymentMode = typeof req.body.paymentMode === "string" ? req.body.paymentMode.trim() : "";
    if (isNaN(amountPaid) || amountPaid < 0) {
      return res.status(400).json({ message: "Valid amount paid is required when booking an appointment." });
    }
    if (!paymentMode) {
      return res.status(400).json({ message: "Payment mode is required (e.g. Cash, Card, UPI)." });
    }
    let consultationFee = 0;
    if (doctorObjectId) {
      const doctorDoc = await Doctor.findById(doctorObjectId).select("Fees").lean().exec() as { Fees?: string } | null;
      if (doctorDoc?.Fees != null) {
        consultationFee = parseFloat(String(doctorDoc.Fees)) || 0;
      }
    }
    if (amountPaid < consultationFee) {
      return res.status(400).json({
        message: `Consultation fee is ${consultationFee}. Amount paid (${amountPaid}) must be at least the consultation fee.`,
      });
    }
    const paymentStatus = amountPaid > 0 ? "Paid" : "Pending";

    // Normalize date/time fields for reliable booking logic and uniqueness checks.
    // Prefer explicit fields if sent from frontend.
    const normalizeFromDateString = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    const normalizeSlotTime = (d: Date) => {
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mi}`;
    };

    let appointmentDate =
      typeof (req.body as any).appointmentDate === "string"
        ? String((req.body as any).appointmentDate).trim()
        : undefined;
    let slotTime =
      typeof (req.body as any).slotTime === "string"
        ? String((req.body as any).slotTime).trim()
        : undefined;

    // Optional ISO datetime (recommended). Falls back to parsing Date_Time.
    let parsedDateTime: Date | undefined;
    const rawDateTime =
      typeof (req.body as any).dateTime === "string"
        ? (req.body as any).dateTime
        : typeof (req.body as any).dateTimeIso === "string"
          ? (req.body as any).dateTimeIso
          : undefined;
    if (rawDateTime) {
      const dt = new Date(rawDateTime);
      if (!isNaN(dt.getTime())) parsedDateTime = dt;
    }

    if (!parsedDateTime) {
      const dt = new Date(apptData.Date_Time);
      if (!isNaN(dt.getTime())) parsedDateTime = dt;
    }

    if ((!appointmentDate || !slotTime) && parsedDateTime) {
      appointmentDate = appointmentDate || normalizeFromDateString(parsedDateTime);
      slotTime = slotTime || normalizeSlotTime(parsedDateTime);
    }

    // Hard stop: prevent double-booking (before insert).
    if (doctorObjectId && appointmentDate && slotTime) {
      const conflictFilter: any = {
        doctorId: doctorObjectId,
        appointmentDate,
        slotTime,
        Status: { $ne: "Cancelled" },
      };
      if (hospitalId) conflictFilter.hospital = hospitalId;

      const conflict = await Appointment.findOne(conflictFilter).select("_id").lean();
      if (conflict) {
        return res.status(409).json({
          message: "This time slot is already booked for the selected doctor.",
        });
      }
    }

    const appointmentData: any = {
      ...finalApptData,
      user: userId, // Always include user as ObjectId
      ...(hospitalId && { hospital: hospitalId }), // Include hospital if available
      ...(doctorObjectId && { doctorId: doctorObjectId }),
      ...(appointmentDate && { appointmentDate }),
      ...(slotTime && { slotTime }),
      ...(parsedDateTime && { dateTime: parsedDateTime }),
      amountPaid,
      paymentStatus,
      paymentMode,
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

// GET /api/appointments/available-slots - Get available time slots for a doctor on a specific date
export const getAvailableSlots: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doctorId = req.query.doctorId as string;
    const date = req.query.date as string; // Format: YYYY-MM-DD
    const hospitalId = req.query.hospitalId as string | undefined;

    if (!doctorId || !date) {
      return res.status(400).json({ message: "doctorId and date are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctorId format" });
    }

    // Parse date and get day name
    const selectedDate = new Date(date + "T00:00:00.000Z");
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[selectedDate.getUTCDay()];

    // Get doctor info (including timeSlotMinutes)
    const doctor = await Doctor.findById(doctorId).select("timeSlotMinutes hospital").lean() as {
      timeSlotMinutes?: number;
      hospital?: mongoose.Types.ObjectId;
    } | null;
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Get doctor's schedule for the selected hospital (or default)
    const scheduleFilter: any = { doctorId: new mongoose.Types.ObjectId(doctorId) };
    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      scheduleFilter.hospital = new mongoose.Types.ObjectId(hospitalId);
    } else if (doctor.hospital) {
      scheduleFilter.hospital = doctor.hospital;
    }

    const schedule = await DoctorSchedule.findOne(scheduleFilter)
      .sort({ createdAt: -1 })
      .lean() as {
      fromDate: Date;
      toDate: Date;
      schedules: Array<{
        day: string;
        timeSlots: Array<{ from: string; to: string }>;
      }>;
    } | null;

    if (!schedule) {
      return res.json({
        availableSlots: [],
        suggestions: [],
        message: "Doctor has no schedule configured",
      });
    }

    // Check if date is within schedule range
    const fromDate = new Date(schedule.fromDate);
    const toDate = new Date(schedule.toDate);
    if (selectedDate < fromDate || selectedDate > toDate) {
      return res.json({
        availableSlots: [],
        suggestions: [],
        message: `Doctor schedule is valid from ${fromDate.toISOString().split("T")[0]} to ${toDate.toISOString().split("T")[0]}`,
      });
    }

    // Find schedule for the selected day
    const daySchedule = schedule.schedules.find((s: { day: string; timeSlots: Array<{ from: string; to: string }> }) => s.day === dayName);
    if (!daySchedule || daySchedule.timeSlots.length === 0) {
      // Suggest next available days
      const suggestions: Array<{ date: string; day: string; timeSlots: Array<{ from: string; to: string }> }> = [];
      for (let i = 1; i <= 14; i++) {
        const checkDate = new Date(selectedDate);
        checkDate.setUTCDate(checkDate.getUTCDate() + i);
        const checkDayName = dayNames[checkDate.getUTCDay()];
        const checkDaySchedule = schedule.schedules.find((s: { day: string; timeSlots: Array<{ from: string; to: string }> }) => s.day === checkDayName);
        if (checkDaySchedule && checkDaySchedule.timeSlots.length > 0) {
          suggestions.push({
            date: checkDate.toISOString().split("T")[0],
            day: checkDayName,
            timeSlots: checkDaySchedule.timeSlots,
          });
          if (suggestions.length >= 3) break;
        }
      }

      return res.json({
        availableSlots: [],
        suggestions,
        message: `Doctor is not available on ${dayName}. Suggested dates:`,
      });
    }

    // Get timeSlotMinutes (default 15 minutes)
    const slotDurationMinutes = (doctor as { timeSlotMinutes?: number }).timeSlotMinutes || 15;

    // Get existing appointments for this doctor on this date.
    // Preferred: appointmentDate + slotTime (normalized fields).
    // Fallback (legacy): Date_Time string starts with "DD MMM YYYY,".
    const dateForPrefix = new Date(date + "T12:00:00.000Z");
    const day = String(dateForPrefix.getUTCDate()).padStart(2, "0");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[dateForPrefix.getUTCMonth()];
    const year = dateForPrefix.getUTCFullYear();
    const datePrefix = `${day} ${month} ${year},`;
    const datePrefixEscaped = datePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const dateRegex = new RegExp("^" + datePrefixEscaped);

    const existingAppointments = (await Appointment.find({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      Status: { $nin: ["Cancelled"] }, // Exclude cancelled appointments
      $or: [{ appointmentDate: date }, { Date_Time: { $regex: dateRegex } }],
    })
      .select("Date_Time slotTime appointmentDate")
      .lean()) as unknown as Array<{ Date_Time?: string; slotTime?: string }>;

    const bookedTimes = existingAppointments
      .map((apt) => {
        if (apt.slotTime && /^\d{2}:\d{2}$/.test(apt.slotTime)) {
          const [h, m] = apt.slotTime.split(":").map(Number);
          if (!Number.isNaN(h) && !Number.isNaN(m)) return { hour: h, minute: m };
        }
        if (apt.Date_Time) {
          const aptDate = new Date(apt.Date_Time);
          if (!isNaN(aptDate.getTime())) {
            return { hour: aptDate.getHours(), minute: aptDate.getMinutes() };
          }
        }
        return null;
      })
      .filter(Boolean) as Array<{ hour: number; minute: number }>;

    // Generate all slots for each time slot range (marking booked vs available)
    const allSlots: Array<{ time: string; display: string; isBooked: boolean }> = [];
    const availableSlots: Array<{ time: string; display: string }> = [];

    daySchedule.timeSlots.forEach((timeSlot: { from: string; to: string }) => {
      const [fromHour, fromMinute] = timeSlot.from.split(":").map(Number);
      const [toHour, toMinute] = timeSlot.to.split(":").map(Number);

      let currentHour = fromHour;
      let currentMinute = fromMinute;

      while (
        currentHour < toHour ||
        (currentHour === toHour && currentMinute + slotDurationMinutes <= toMinute)
      ) {
        const slotTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
        const slotEndHour = Math.floor((currentMinute + slotDurationMinutes) / 60) + currentHour;
        const slotEndMinute = (currentMinute + slotDurationMinutes) % 60;
        const slotEndTime = `${String(slotEndHour).padStart(2, "0")}:${String(slotEndMinute).padStart(2, "0")}`;

        // Check if slot overlaps with any booked appointment
        const isBooked = bookedTimes.some((booked) => {
          const bookedMinutes = booked.hour * 60 + booked.minute;
          const slotStartMinutes = currentHour * 60 + currentMinute;
          const slotEndMinutes = slotEndHour * 60 + slotEndMinute;
          return bookedMinutes >= slotStartMinutes && bookedMinutes < slotEndMinutes;
        });

        // Store slot with its booking status
        const slot = {
          time: slotTime,
          display: `${slotTime} - ${slotEndTime}`,
          isBooked,
        };
        allSlots.push(slot);

        // Only expose truly available slots in the simple list
        if (!isBooked) {
          availableSlots.push({
            time: slot.time,
            display: slot.display,
          });
        }

        // Move to next slot
        currentMinute += slotDurationMinutes;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
      }
    });

    // Derive a compact list of booked slots for UI (same structure as availableSlots)
    const bookedSlots: Array<{ time: string; display: string }> = allSlots
      .filter((slot) => slot.isBooked)
      .map((slot) => ({
        time: slot.time,
        display: slot.display,
      }));

    // If no slots available, suggest next available days
    let suggestions: Array<{ date: string; day: string; timeSlots: Array<{ from: string; to: string }> }> = [];
    if (availableSlots.length === 0) {
      for (let i = 1; i <= 14; i++) {
        const checkDate = new Date(selectedDate);
        checkDate.setUTCDate(checkDate.getUTCDate() + i);
        const checkDayName = dayNames[checkDate.getUTCDay()];
        const checkDaySchedule = schedule.schedules.find((s: { day: string; timeSlots: Array<{ from: string; to: string }> }) => s.day === checkDayName);
        if (checkDaySchedule && checkDaySchedule.timeSlots.length > 0) {
          suggestions.push({
            date: checkDate.toISOString().split("T")[0],
            day: checkDayName,
            timeSlots: checkDaySchedule.timeSlots,
          });
          if (suggestions.length >= 3) break;
        }
      }
    }

    res.json({
      availableSlots,
      bookedSlots,
      slots: allSlots,
      suggestions,
      slotDurationMinutes,
      daySchedule: {
        day: dayName,
        timeSlots: daySchedule.timeSlots,
      },
    });
  } catch (err) {
    next(err);
  }
};
