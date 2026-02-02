import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Appointment } from "../models/appointmentModel";
import { Patient } from "../models/patientModel";
import { Consultation } from "../models/consultationModel";
import { Doctor } from "../models/doctorModel";
import { DashboardAppointment } from "../models/dashboardAppointmentModel";
import { DashboardPatient } from "../models/dashboardPatientModel";
import { User } from "../models/userModel";
import { buildAccessFilter } from "../middlewares/authMiddleware";

export interface ConsultationData {
  appointmentId: string;
  vitals?: {
    temperature?: string;
    pulse?: string;
    respiratoryRate?: string;
    spo2?: string;
    height?: string;
    weight?: string;
    bmi?: string;
    waist?: string;
  };
  complaints?: Array<{ complaint: string; duration?: string }>;
  diagnosis?: Array<{ diagnosis: string; type?: string }>;
  medications?: Array<{
    medicine: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    inventoryId?: string;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
  }>;
  advice?: Array<{ advice: string }>;
  investigations?: Array<{
    investigation: string;
    notes?: string;
  }>;
  followUp?: {
    nextConsultation?: string;
    emptyStomach?: string;
  };
  invoice?: Array<{
    item: string;
    quantity?: number;
    price?: number;
    total?: number;
  }>;
}

export const getAppointmentForConsultation: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    
    // Build filter similar to getAllAppointments - filter by doctorId and hospital for doctors
    const filter: any = {};
    
    // For doctors (USER role), filter by hospital and doctorId
    if (req.user.role === "USER") {
      try {
        // Find doctor by user ID or email (same approach as getAllAppointments)
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
      } catch (error) {
        // If we can't find doctor, continue without filters
        // eslint-disable-next-line no-console
        console.error("Error fetching doctor for consultation:", error);
      }
    } else {
      // For other roles, use buildAccessFilter
      const accessFilter = buildAccessFilter(req.user);
      Object.assign(filter, accessFilter);
    }
    
    // Use _id only (MongoDB ObjectId)
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter._id = new mongoose.Types.ObjectId(id);
    } else {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const appointment = await Appointment.findOne(filter)
      .select("_id Date_Time Patient Phone Patient_Image Doctor_Image Doctor role Mode Status Consultation_ID Fees doctorId createdAt updatedAt")
      .lean()
      .exec();
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointmentObj = appointment as any;
    let patient = null;
    if (appointmentObj.Patient) {
      const patientFilter = buildAccessFilter(req.user);
      patientFilter.$or = [
        { Patient: appointmentObj.Patient },
        { Phone: appointmentObj.Phone },
      ];
      patient = await Patient.findOne(patientFilter)
        .select("_id Patient Gender Patient_img Doctor_img Phone Email Doctor Role Address Last_Visit Status createdAt updatedAt")
        .lean()
        .exec();
    }

    let consultation = null;
    const consultationFilter = buildAccessFilter(req.user);
    const appointmentObjectId = appointmentObj._id ? new mongoose.Types.ObjectId(String(appointmentObj._id)) : null;

    // Prefer lookup by Appointment_ID (ObjectId)
    if (appointmentObjectId) {
      consultationFilter.Appointment_ID = appointmentObjectId;
      consultation = await Consultation.findOne(consultationFilter)
        .select("_id Appointment_ID Patient Patient_Image Doctor Doctor_Image Vitals Complaints Diagnosis Medications Advice Investigations FollowUp Invoice Status Consultation_Date Completed_At createdAt updatedAt")
        .lean()
        .exec();
    }

    // Backward-compat: if appointment stores a consultation id string, try it as _id
    if (!consultation && appointmentObj.Consultation_ID && mongoose.Types.ObjectId.isValid(String(appointmentObj.Consultation_ID))) {
      const byIdFilter = buildAccessFilter(req.user);
      byIdFilter._id = new mongoose.Types.ObjectId(String(appointmentObj.Consultation_ID));
      consultation = await Consultation.findOne(byIdFilter)
        .select("_id Appointment_ID Patient Patient_Image Doctor Doctor_Image Vitals Complaints Diagnosis Medications Advice Investigations FollowUp Invoice Status Consultation_Date Completed_At createdAt updatedAt")
        .lean()
        .exec();
    }

    const consultationObj = consultation as any;
    
    if (consultationObj) {
      if (consultationObj.Vitals) appointmentObj.Vitals = consultationObj.Vitals;
      if (consultationObj.Complaints) appointmentObj.Complaints = consultationObj.Complaints;
      if (consultationObj.Diagnosis) appointmentObj.Diagnosis = consultationObj.Diagnosis;
      if (consultationObj.Medications) appointmentObj.Medications = consultationObj.Medications;
      if (consultationObj.Advice) appointmentObj.Advice = consultationObj.Advice;
      if (consultationObj.Investigations) appointmentObj.Investigations = consultationObj.Investigations;
      if (consultationObj.FollowUp) appointmentObj.FollowUp = consultationObj.FollowUp;
      if (consultationObj.Invoice) appointmentObj.Invoice = consultationObj.Invoice;
    }
    
    res.json({
      appointment: appointmentObj,
      patient,
      consultation: consultationObj,
    });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid appointment id" });
    }
    next(err);
  }
};

export const saveConsultation: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { appointmentId, consultationData, completeAppointment } = req.body;

    // Validation
    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment ID is required" });
    }

    if (!consultationData || typeof consultationData !== "object") {
      return res.status(400).json({ message: "Consultation data is required" });
    }

    // Validate vitals if provided
    if (consultationData.vitals) {
      const vitals = consultationData.vitals;
      if (vitals.temperature && isNaN(parseFloat(vitals.temperature))) {
        return res.status(400).json({ message: "Temperature must be a valid number" });
      }
      if (vitals.pulse && isNaN(parseFloat(vitals.pulse))) {
        return res.status(400).json({ message: "Pulse must be a valid number" });
      }
      if (vitals.weight && isNaN(parseFloat(vitals.weight))) {
        return res.status(400).json({ message: "Weight must be a valid number" });
      }
      if (vitals.height && isNaN(parseFloat(vitals.height))) {
        return res.status(400).json({ message: "Height must be a valid number" });
      }
    }

    // Validate medications if provided
    if (consultationData.medications && Array.isArray(consultationData.medications)) {
      for (const med of consultationData.medications) {
        if (!med.medicine || typeof med.medicine !== "string" || med.medicine.trim() === "") {
          return res.status(400).json({ message: "All medications must have a valid medicine name" });
        }
      }
    }

    // Validate invoice if provided
    if (consultationData.invoice && Array.isArray(consultationData.invoice)) {
      for (const inv of consultationData.invoice) {
        if (!inv.item || typeof inv.item !== "string" || inv.item.trim() === "") {
          return res.status(400).json({ message: "All invoice items must have a service/item name" });
        }
        if (inv.price === undefined || inv.price === null || isNaN(Number(inv.price))) {
          return res.status(400).json({ message: "All invoice items must have a valid price" });
        }
        if (Number(inv.price) < 0) {
          return res.status(400).json({ message: "Invoice prices cannot be negative" });
        }
      }
    }

    // Validate arrays are actually arrays
    if (consultationData.complaints && !Array.isArray(consultationData.complaints)) {
      return res.status(400).json({ message: "Complaints must be an array" });
    }
    if (consultationData.diagnosis && !Array.isArray(consultationData.diagnosis)) {
      return res.status(400).json({ message: "Diagnosis must be an array" });
    }
    if (consultationData.advice && !Array.isArray(consultationData.advice)) {
      return res.status(400).json({ message: "Advice must be an array" });
    }
    if (consultationData.investigations && !Array.isArray(consultationData.investigations)) {
      return res.status(400).json({ message: "Investigations must be an array" });
    }

    // Build filter similar to getAllAppointments - filter by doctorId and hospital for doctors
    const appointmentFilter: any = {};
    
    // For doctors (USER role), filter by hospital and doctorId
    if (req.user.role === "USER") {
      try {
        // Find doctor by user ID or email (same approach as getAllAppointments)
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
          appointmentFilter.doctorId = new mongoose.Types.ObjectId(doctor._id.toString());
        }

        // Add hospital filter if doctor is associated with a hospital
        if (doctor?.hospital) {
          appointmentFilter.hospital = new mongoose.Types.ObjectId(doctor.hospital.toString());
        }
      } catch (error) {
        // If we can't find doctor, continue without filters
        // eslint-disable-next-line no-console
        console.error("Error fetching doctor for consultation save:", error);
      }
    } else {
      // For other roles, use buildAccessFilter
      const accessFilter = buildAccessFilter(req.user);
      Object.assign(appointmentFilter, accessFilter);
    }
    
    // Use _id only (MongoDB ObjectId)
    if (mongoose.Types.ObjectId.isValid(appointmentId)) {
      appointmentFilter._id = new mongoose.Types.ObjectId(appointmentId);
    } else {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const appointment = await Appointment.findOne(appointmentFilter).exec();

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointmentObjectId = new mongoose.Types.ObjectId(String(appointment._id));

    // Prepare consultation document data
    const consultationDocument: any = {
      Appointment_ID: appointmentObjectId,
      Patient: appointment.Patient || "",
      Patient_Image: appointment.Patient_Image || "",
      Doctor: appointment.Doctor || "",
      Doctor_Image: appointment.Doctor_Image || "",
      Status: completeAppointment ? "Completed" : "Draft",
      Consultation_Date: new Date(),
    };

    // Add consultation data fields
    if (consultationData?.vitals && Object.keys(consultationData.vitals).length > 0) {
      consultationDocument.Vitals = consultationData.vitals;
    }
    if (consultationData?.complaints && Array.isArray(consultationData.complaints) && consultationData.complaints.length > 0) {
      consultationDocument.Complaints = consultationData.complaints;
    }
    if (consultationData?.diagnosis && Array.isArray(consultationData.diagnosis) && consultationData.diagnosis.length > 0) {
      consultationDocument.Diagnosis = consultationData.diagnosis;
    }
    if (consultationData?.medications && Array.isArray(consultationData.medications) && consultationData.medications.length > 0) {
      // Normalize and preserve optional inventoryId, quantity, unitPrice, subtotal for each medication
      consultationDocument.Medications = consultationData.medications.map((m: any) => {
        const inventoryIdStr = String(m.inventoryId || "").trim();
        const inventoryId =
          inventoryIdStr && mongoose.Types.ObjectId.isValid(inventoryIdStr)
            ? new mongoose.Types.ObjectId(inventoryIdStr)
            : undefined;
        const quantity = typeof m.quantity === "number" && m.quantity >= 0 ? m.quantity : 1;
        const unitPrice = typeof m.unitPrice === "number" && m.unitPrice >= 0 ? m.unitPrice : 0;
        const subtotal = typeof m.subtotal === "number" && m.subtotal >= 0 ? m.subtotal : unitPrice * quantity;
        const batchNumber = String(m.batchNumber ?? m.batch ?? "").trim();
        const expiryRaw = m.expiry;
        const expiry = expiryRaw ? (expiryRaw instanceof Date ? expiryRaw : new Date(expiryRaw)) : undefined;
        return {
          medicine: String(m.medicine || "").trim(),
          dosage: String(m.dosage || "").trim(),
          frequency: String(m.frequency || "").trim(),
          duration: String(m.duration || "").trim(),
          ...(inventoryId ? { inventoryId } : {}),
          quantity,
          unitPrice,
          subtotal,
          ...(batchNumber ? { batchNumber } : {}),
          ...(expiry && !isNaN(expiry.getTime()) ? { expiry } : {}),
        };
      });
    }
    if (consultationData?.advice && Array.isArray(consultationData.advice) && consultationData.advice.length > 0) {
      consultationDocument.Advice = consultationData.advice;
    }
    if (consultationData?.investigations && Array.isArray(consultationData.investigations) && consultationData.investigations.length > 0) {
      consultationDocument.Investigations = consultationData.investigations;
    }
    if (consultationData?.followUp && Object.keys(consultationData.followUp).length > 0) {
      consultationDocument.FollowUp = consultationData.followUp;
    }
    if (consultationData?.invoice && Array.isArray(consultationData.invoice) && consultationData.invoice.length > 0) {
      consultationDocument.Invoice = consultationData.invoice;
    }

    if (completeAppointment) {
      consultationDocument.Completed_At = new Date();
    }

    const consultationFilter = buildAccessFilter(req.user);
    consultationFilter.Appointment_ID = appointmentObjectId;

    let consultation = await Consultation.findOne(consultationFilter).exec();

    // Always persist access fields (user, hospital) as ObjectIds. Always save hospitalId on consultation.
    const accessFilter = buildAccessFilter(req.user);
    const normalizedAccessFilter: any = {};
    if (accessFilter.user && typeof accessFilter.user === "string" && mongoose.Types.ObjectId.isValid(accessFilter.user)) {
      normalizedAccessFilter.user = new mongoose.Types.ObjectId(accessFilter.user);
    }
    // Prefer hospital from user (HOSPITAL_ADMIN, PHARMACIST), else from appointment (USER/doctor, SUPER_ADMIN)
    if (
      accessFilter.hospital &&
      typeof accessFilter.hospital === "string" &&
      mongoose.Types.ObjectId.isValid(accessFilter.hospital)
    ) {
      normalizedAccessFilter.hospital = new mongoose.Types.ObjectId(accessFilter.hospital);
    } else if (appointment.hospital && mongoose.Types.ObjectId.isValid(String(appointment.hospital))) {
      normalizedAccessFilter.hospital = new mongoose.Types.ObjectId(String(appointment.hospital));
    }

    if (consultation) {
      Object.assign(consultation, consultationDocument, normalizedAccessFilter);
      await consultation.save();
    } else {
      consultation = await Consultation.create({
        ...consultationDocument,
        ...normalizedAccessFilter,
      });
    }

    // Update appointment with consultation ID reference
    appointment.Consultation_ID = consultation._id?.toString();

    // If completing appointment, update status
    if (completeAppointment) {
      appointment.Status = "Checked Out";
      
      try {
        // Find doctor by doctorId (which is stored as string _id) or by name
        let doctor = null;
        if (appointment.doctorId && mongoose.Types.ObjectId.isValid(appointment.doctorId)) {
          doctor = await Doctor.findById(appointment.doctorId)
            .select("_id Email email Name_Designation")
            .lean()
            .exec() as { Email?: string; email?: string } | null;
        }
        
        // If not found by ID, try finding by name
        if (!doctor && appointment.Doctor) {
          const doctorFilter = buildAccessFilter(req.user);
          doctorFilter.Name_Designation = appointment.Doctor;
          doctor = await Doctor.findOne(doctorFilter)
            .select("_id Email email Name_Designation")
            .lean()
            .exec() as { Email?: string; email?: string } | null;
        }
        
        if (doctor) {
          const doctorEmail = (doctor.Email || doctor.email || "").toLowerCase().trim();
          if (doctorEmail) {
            const user = await User.findOne({ email: doctorEmail }).select("_id").lean().exec();
            const dashboardDoctorId = user ? String(user._id) : appointment.doctorId;
            
            const dashboardPatient = await DashboardPatient.findOne({
              doctorId: dashboardDoctorId,
              name: appointment.Patient,
              phone: appointment.Phone,
            }).lean().exec() as { _id: mongoose.Types.ObjectId } | null;
            
            if (dashboardPatient && dashboardPatient._id) {
              // Parse appointment date to match
              let appointmentDate: Date;
              try {
                appointmentDate = new Date(appointment.Date_Time);
                if (isNaN(appointmentDate.getTime())) {
                  // Try manual parsing
                  const monthMap: Record<string, number> = {
                    "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
                    "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
                  };
                  const match = appointment.Date_Time.match(/(\d{1,2})\s+(\w{3})\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i);
                  if (match) {
                    const [, day, month, year, hour, minute, ampm] = match;
                    const monthNum = monthMap[month];
                    if (monthNum !== undefined) {
                      let hour24 = parseInt(hour, 10);
                      if (ampm.toUpperCase() === "PM" && hour24 !== 12) hour24 += 12;
                      if (ampm.toUpperCase() === "AM" && hour24 === 12) hour24 = 0;
                      appointmentDate = new Date(parseInt(year, 10), monthNum, parseInt(day, 10), hour24, parseInt(minute, 10));
                    }
                  }
                }
              } catch {
                appointmentDate = new Date();
              }
              
              // Update DashboardAppointment by matching doctorId, patientId, and approximate datetime
              const startOfDay = new Date(appointmentDate);
              startOfDay.setHours(0, 0, 0, 0);
              const endOfDay = new Date(appointmentDate);
              endOfDay.setHours(23, 59, 59, 999);
              
              if (dashboardPatient._id) {
                await DashboardAppointment.updateMany(
                  {
                    doctorId: dashboardDoctorId,
                    patientId: dashboardPatient._id,
                    datetime: { $gte: startOfDay, $lte: endOfDay },
                  },
                  { $set: { status: "Checked Out" } }
                );
              }
            }
          }
        }
      } catch (dashboardErr: any) {
        // Failed to update DashboardAppointment - non-critical error
      }
    }

    await appointment.save();

    // All data is stored in Consultation only (hospital + user set via normalizedAccessFilter above).

    const updatedAppointment = typeof appointment.toObject === "function" ? appointment.toObject() : appointment;

    res.json({
      message: completeAppointment ? "Consultation saved and appointment completed" : "Consultation saved",
      appointment: updatedAppointment,
    });
  } catch (err: any) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

/** List consultations for doctor (prescriptions list). Filter by doctor, status, date, search. */
export const getConsultationsList: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
    const sort = (req.query.sort as string) || "-createdAt";
    const search = (req.query.search as string) || "";
    const Doctor = (req.query.doctor as string) || "";
    const Status = (req.query.status as string) || "";
    const date = (req.query.date as string) || "";

    const filter = buildAccessFilter(req.user) as Record<string, unknown>;
    const andConditions: unknown[] = [];

    if (Doctor) {
      const decoded = decodeURIComponent(Doctor.replace(/\+/g, " ")).trim();
      const parts = decoded.split(/\s*-\s*/);
      const base = parts[0]?.trim() || decoded;
      const words = base.split(/\s+/).filter((w) => w.length > 0);
      const escapedFull = decoded.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const patterns = [escapedFull, escapedBase];
      words.forEach((w) => {
        if (w.length > 2) patterns.push(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      });
      andConditions.push({
        $or: patterns.map((p) => ({ Doctor: { $regex: p, $options: "i" } })),
      });
    }

    if (Status) {
      const norm = String(Status).toLowerCase();
      if (norm === "active" || norm === "completed") filter.Status = "Completed";
      else if (norm === "cancelled") filter.Status = "Cancelled";
      else if (norm === "draft") filter.Status = "Draft";
      else filter.Status = Status;
    }

    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        const start = new Date(parsed);
        start.setHours(0, 0, 0, 0);
        const end = new Date(parsed);
        end.setHours(23, 59, 59, 999);
        andConditions.push({
          $or: [
            { Consultation_Date: { $gte: start, $lte: end } },
            { Completed_At: { $gte: start, $lte: end } },
            { createdAt: { $gte: start, $lte: end } },
          ],
        });
      }
    }

    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      andConditions.push({
        $or: [
          { Patient: rx },
          { Doctor: rx },
          { "Medications.medicine": rx },
        ],
      });
    }

    if (andConditions.length > 0) filter.$and = andConditions;

    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? -1 : 1;
    const sortOpt: Record<string, 1 | -1> = { [sortField]: sortDir };
    const skip = (page - 1) * limit;

    const [list, total] = await Promise.all([
      Consultation.find(filter)
        .sort(sortOpt)
        .skip(skip)
        .limit(limit)
        .select("_id Appointment_ID Patient Patient_Image Doctor Status Medications Consultation_Date Completed_At createdAt updatedAt")
        .lean()
        .exec(),
      Consultation.countDocuments(filter),
    ]);

    const formatRow = (c: any) => {
      const derivedDate = c.Completed_At || c.Consultation_Date || c.createdAt;
      const dateStr = derivedDate ? new Date(derivedDate).toISOString().split("T")[0] : "";
      const statusDisplay = c.Status === "Completed" ? "Active" : c.Status;
      return {
        _id: c._id?.toString(),
        id: c._id?.toString(),
        Consultation_ID: c._id?.toString(),
        Prescription_ID: `CONS-${c._id}`,
        Date: dateStr,
        Prescribed_On: dateStr,
        Patient: c.Patient,
        Patient_Image: c.Patient_Image,
        Doctor: c.Doctor,
        Status: statusDisplay,
        Medications: c.Medications || [],
        Consultation_Date: c.Consultation_Date,
        Completed_At: c.Completed_At,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    };

    res.json({
      data: list.map(formatRow),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

/** Get single consultation by id (for doctor prescription details). */
export const getConsultationById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid consultation id" });
    }

    const filter = buildAccessFilter(req.user) as Record<string, unknown>;
    filter._id = new mongoose.Types.ObjectId(id);

    const consultation = await Consultation.findOne(filter)
      .select("_id Appointment_ID Patient Patient_Image Doctor Doctor_Image Status Medications Consultation_Date Completed_At createdAt updatedAt Vitals Complaints Diagnosis Advice Investigations FollowUp")
      .lean()
      .exec();

    if (!consultation) return res.status(404).json({ message: "Consultation not found" });

    const c = consultation as any;
    const derivedDate = c.Completed_At || c.Consultation_Date || c.createdAt;
    const dateStr = derivedDate ? new Date(derivedDate).toISOString().split("T")[0] : "";

    res.json({
      _id: c._id?.toString(),
      id: c._id?.toString(),
      Consultation_ID: c._id?.toString(),
      Prescription_ID: `CONS-${c._id}`,
      Date: dateStr,
      Prescribed_On: dateStr,
      Patient: c.Patient,
      Patient_Image: c.Patient_Image,
      Doctor: c.Doctor,
      Doctor_Image: c.Doctor_Image,
      Status: c.Status === "Completed" ? "Active" : c.Status,
      Medications: c.Medications || [],
      Consultation_Date: c.Consultation_Date,
      Completed_At: c.Completed_At,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      Vitals: c.Vitals,
      Complaints: c.Complaints,
      Diagnosis: c.Diagnosis,
      Advice: c.Advice,
      Investigations: c.Investigations,
      FollowUp: c.FollowUp,
    });
  } catch (err) {
    next(err);
  }
};
