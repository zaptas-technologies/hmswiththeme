import { RequestHandler } from "express";
import { getResourceModel } from "../models/resourceRegistry";
import mongoose from "mongoose";
 
export interface AppointmentRequest {
  _id?: string;
  id?: string;
  Date_Time: string;
  Patient: string;
  Phone: string;
  Patient_Image?: string;
  Doctor_Image?: string;
  Doctor: string;
  role?: string;
  Mode?: string;
  Status: string;
  [key: string]: any;
}
 
const formatAppointmentResponse = (appt: any) => {
  if (!appt) return appt;
  const obj = typeof appt.toObject === "function" ? appt.toObject() : appt;
  return obj;
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
    if (Doctor) filter.Doctor = Doctor;
    if (Patient) filter.Patient = Patient;
 
    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ Patient: rx }, { Doctor: rx }, { Phone: rx }];
    }
 
    const [appts, total] = await Promise.all([
      Model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
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

