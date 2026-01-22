import { RequestHandler } from "express";
import { getResourceModel } from "../models/resourceRegistry";
import mongoose from "mongoose";

export interface PatientRequest {
  _id?: string;
  id?: string;
  Patient: string;
  Gender?: string;
  Patient_img?: string;
  Doctor_img?: string;
  Phone: string;
  Email?: string;
  Doctor?: string;
  Role?: string;
  Address?: string;
  Last_Visit?: string;
  Status: "Available" | "Unavailable";
  [key: string]: any;
}

const formatPatientResponse = (patient: any) => {
  if (!patient) return patient;
  const obj = typeof patient.toObject === "function" ? patient.toObject() : patient;
  return obj;
};

const validatePatientData = (
  data: Partial<PatientRequest>
): { isValid: boolean; error?: string } => {
  if (!data) return { isValid: false, error: "Missing request body" };
  if (!data.Patient || typeof data.Patient !== "string") {
    return { isValid: false, error: "Patient name is required" };
  }
  if (!data.Phone || typeof data.Phone !== "string") {
    return { isValid: false, error: "Phone is required" };
  }
  if (!data.Status || !["Available", "Unavailable"].includes(data.Status)) {
    return { isValid: false, error: "Status must be Available or Unavailable" };
  }
  return { isValid: true };
};

// GET /api/patients - Get all patients
export const getAllPatients: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("patients");

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) || "-createdAt";

    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const doctor = (req.query.doctor as string) || "";

    const filter: Record<string, any> = {};
    if (status) filter.Status = status;
    if (doctor) filter.Doctor = new RegExp(doctor, "i");

    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ Patient: rx }, { Phone: rx }, { Email: rx }];
    }

    const [patients, total] = await Promise.all([
      Model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      Model.countDocuments(filter),
    ]);

    res.json({
      data: patients.map(formatPatientResponse),
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

// GET /api/patients/:id - Get patient by ID
export const getPatientById: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("patients");
    const { id } = req.params;

    const patient = await Model.findOne({ $or: [{ _id: id }, { id }] }).exec();

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(formatPatientResponse(patient));
  } catch (err) {
    next(err);
  }
};

// POST /api/patients - Create new patient
export const createPatient: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("patients");
    const patientData: PatientRequest = req.body;

    // Validate required fields
    const validation = validatePatientData(patientData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Generate ID if not provided
    if (!patientData.id) {
      patientData.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Check if patient with same id already exists
    const existing = await Model.findOne({ id: patientData.id });
    if (existing) {
      return res.status(409).json({ message: "Patient with this ID already exists" });
    }

    // Check if patient with same phone already exists
    const existingByPhone = await Model.findOne({ Phone: patientData.Phone });
    if (existingByPhone) {
      return res.status(409).json({ message: "Patient with this phone number already exists" });
    }

    const patient = await Model.create(patientData);
    res.status(201).json(formatPatientResponse(patient));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `Patient with this ${field} already exists`,
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

// PATCH /api/patients/:id - Update patient
export const updatePatient: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("patients");
    const { id } = req.params;
    const updateData: Partial<PatientRequest> = req.body;

    // Don't allow updating id or _id
    const { id: _ignoredId, _id: _ignoredMongoId, ...cleanUpdateData } = updateData;

    // Validate if updating required fields
    if (updateData.Status && !["Available", "Unavailable"].includes(updateData.Status)) {
      return res.status(400).json({ message: "Status must be Available or Unavailable" });
    }

    // Find patient by _id or id
    let patient;
    if (mongoose.Types.ObjectId.isValid(id)) {
      patient = await Model.findById(id);
    }

    if (!patient) {
      patient = await Model.findOne({ id });
    }

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check for phone conflict if phone is being updated
    if (updateData.Phone && updateData.Phone !== patient.Phone) {
      const existingByPhone = await Model.findOne({ Phone: updateData.Phone });
      if (existingByPhone && existingByPhone._id.toString() !== patient._id.toString()) {
        return res.status(409).json({ message: "Patient with this phone number already exists" });
      }
    }

    // Update patient
    Object.assign(patient, cleanUpdateData);
    await patient.save();

    res.json(formatPatientResponse(patient));
  } catch (err: any) {
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `Patient with this ${field} already exists`,
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

// DELETE /api/patients/:id - Delete patient
export const deletePatient: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("patients");
    const { id } = req.params;

    let patient;
    if (mongoose.Types.ObjectId.isValid(id)) {
      patient = await Model.findByIdAndDelete(id);
    }

    if (!patient) {
      patient = await Model.findOneAndDelete({ id });
    }

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    next(err);
  }
};
