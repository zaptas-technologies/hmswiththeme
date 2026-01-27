import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Patient } from "../models/patientModel";
import { buildAccessFilter } from "../middlewares/authMiddleware";

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

export const getAllPatients: RequestHandler = async (req, res, next) => {
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

    const filter = buildAccessFilter(req.user);
    if (status) filter.Status = status;
    if (doctor) filter.Doctor = new RegExp(doctor, "i");

    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ Patient: rx }, { Phone: rx }, { Email: rx }];
    }

    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .select("_id id Patient Gender Patient_img Doctor_img Phone Email Doctor Role Address Last_Visit Status createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Patient.countDocuments(filter),
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

export const getPatientById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const filter = buildAccessFilter(req.user);
    filter.$or = [{ _id: id }, { id }];

    const patient = await Patient.findOne(filter)
      .select("_id id Patient Gender Patient_img Doctor_img Phone Email Doctor Role Address Last_Visit Status createdAt updatedAt")
      .lean()
      .exec();

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(formatPatientResponse(patient));
  } catch (err) {
    next(err);
  }
};

export const createPatient: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const patientData: PatientRequest = req.body;

    const validation = validatePatientData(patientData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    if (!patientData.id) {
      patientData.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    const existing = await Patient.findOne({ id: patientData.id }).lean().exec();
    if (existing) {
      return res.status(409).json({ message: "Patient with this ID already exists" });
    }

    const existingByPhone = await Patient.findOne({ Phone: patientData.Phone }).lean().exec();
    if (existingByPhone) {
      return res.status(409).json({ message: "Patient with this phone number already exists" });
    }

    const accessFilter = buildAccessFilter(req.user);
    const patient = await Patient.create({
      ...patientData,
      ...accessFilter,
    });
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

export const updatePatient: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const updateData: Partial<PatientRequest> = req.body;

    const { id: _ignoredId, _id: _ignoredMongoId, ...cleanUpdateData } = updateData;

    if (updateData.Status && !["Available", "Unavailable"].includes(updateData.Status)) {
      return res.status(400).json({ message: "Status must be Available or Unavailable" });
    }

    const filter = buildAccessFilter(req.user);
    filter.$or = [{ _id: id }, { id }];

    const patient = await Patient.findOne(filter).exec();

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (updateData.Phone && updateData.Phone !== patient.Phone) {
      const existingByPhone = await Patient.findOne({ Phone: updateData.Phone })
        .lean()
        .exec() as { _id: mongoose.Types.ObjectId } | null;
      if (existingByPhone && existingByPhone._id.toString() !== patient._id.toString()) {
        return res.status(409).json({ message: "Patient with this phone number already exists" });
      }
    }

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

export const deletePatient: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const filter = buildAccessFilter(req.user);
    filter.$or = [{ _id: id }, { id }];

    const patient = await Patient.findOneAndDelete(filter).lean().exec();

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    next(err);
  }
};
