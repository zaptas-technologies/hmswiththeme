import { RequestHandler } from "express";
import { getResourceModel } from "../models/resourceRegistry";
import mongoose from "mongoose";

export interface PrescriptionRequest {
  _id?: string;
  id?: string;
  Prescription_ID?: string;
  Date?: string;
  Prescribed_On?: string;
  Patient?: string;
  Patient_Image?: string;
  Doctor?: string;
  Medicine?: string;
  Status?: string;
  Dosage?: string;
  Frequency?: string;
  Duration?: string;
  Appointment_ID?: string;
  [key: string]: any;
}

const formatPrescriptionResponse = (presc: any) => {
  if (!presc) return presc;
  const obj = typeof presc.toObject === "function" ? presc.toObject() : presc;
  
  // Return only relevant fields for list view
  return {
    _id: obj._id,
    id: obj.id,
    Prescription_ID: obj.Prescription_ID,
    Date: obj.Date,
    Prescribed_On: obj.Prescribed_On,
    Patient: obj.Patient,
    Patient_Image: obj.Patient_Image,
    Doctor: obj.Doctor,
    Medicine: obj.Medicine,
    Status: obj.Status,
    Dosage: obj.Dosage || "",
    Frequency: obj.Frequency || "",
    Duration: obj.Duration || "",
    Appointment_ID: obj.Appointment_ID || obj.appointmentId || "",
    appointmentId: obj.appointmentId || obj.Appointment_ID || "",
    Amount: obj.Amount,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const validatePrescriptionData = (
  data: Partial<PrescriptionRequest>
): { isValid: boolean; error?: string } => {
  if (!data) return { isValid: false, error: "Missing request body" };
  if (!data.Patient || typeof data.Patient !== "string") {
    return { isValid: false, error: "Patient is required" };
  }
  if (!data.Doctor || typeof data.Doctor !== "string") {
    return { isValid: false, error: "Doctor is required" };
  }
  if (!data.Medicine || typeof data.Medicine !== "string") {
    return { isValid: false, error: "Medicine is required" };
  }
  if (!data.Status || typeof data.Status !== "string") {
    return { isValid: false, error: "Status is required" };
  }
  return { isValid: true };
};

// GET /api/prescriptions - Get all prescriptions with filtering
export const getAllPrescriptions: RequestHandler = async (req, res, next) => {
  try {
    const dbName = mongoose.connection.db?.databaseName || "unknown";
    // eslint-disable-next-line no-console
    console.log(`[Prescription Controller] Database: ${dbName} - Fetching prescriptions`);
    
    const Model = getResourceModel("doctorprescriptions");
    const includeConsultations =
      String(req.query.includeConsultations ?? "").toLowerCase() === "true" ||
      String(req.query.includeConsultations ?? "") === "1";

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) || "-createdAt";

    const search = (req.query.search as string) || "";
    const Status = (req.query.status as string) || "";
    const Doctor = (req.query.doctor as string) || "";
    const Patient = (req.query.patient as string) || "";
    const date = (req.query.date as string) || "";

    // eslint-disable-next-line no-console
    console.log(`[Prescription Controller] Database: ${dbName} - Query params:`, {
      page,
      limit,
      sort,
      search,
      Status,
      Doctor,
      Patient,
      date,
    });

    const filter: Record<string, any> = {};
    const andConditions: any[] = [];
    
    if (Status) filter.Status = Status;
    
    if (Doctor) {
      // Decode URL-encoded doctor name (e.g., "Priyanshu+Tyagi+-+Cardiologist" -> "Priyanshu Tyagi - Cardiologist")
      const decodedDoctor = decodeURIComponent(Doctor.replace(/\+/g, " ")).trim();
      
      // Try multiple matching strategies:
      // 1. Match full name (e.g., "Priyanshu Tyagi - Cardiologist")
      // 2. Match base name without department (e.g., "Priyanshu Tyagi")
      // 3. Match any part of the name
      const doctorNameParts = decodedDoctor.split(/\s*-\s*/);
      const baseDoctorName = doctorNameParts[0]?.trim() || decodedDoctor;
      
      // Get individual words for flexible matching
      const doctorWords = baseDoctorName.split(/\s+/).filter(w => w.length > 0);
      
      // Escape special regex characters
      const escapedFull = decodedDoctor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedBase = baseDoctorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      
      // Create flexible matching patterns
      const doctorRegexPatterns: string[] = [
        escapedFull, // Full name exact match
        escapedBase, // Base name exact match
      ];
      
      // Add patterns for each word (for partial matching)
      doctorWords.forEach(word => {
        if (word.length > 2) { // Only add words longer than 2 characters
          const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          doctorRegexPatterns.push(escapedWord);
        }
      });
      
      // Match either full name, base name, or partial (case-insensitive)
      andConditions.push({
        $or: doctorRegexPatterns.map(pattern => ({
          Doctor: { $regex: pattern, $options: "i" }
        }))
      });
      
      // eslint-disable-next-line no-console
      console.log(`[Prescription Controller] Database: ${dbName} - Doctor filter:`, {
        original: Doctor,
        decoded: decodedDoctor,
        baseName: baseDoctorName,
        words: doctorWords,
        patterns: doctorRegexPatterns,
      });
    }
    
    if (Patient) filter.Patient = { $regex: Patient, $options: "i" };
    
    if (date) {
      // Filter by date (can be Date or Prescribed_On field)
      andConditions.push({
        $or: [
          { Date: { $regex: date, $options: "i" } },
          { Prescribed_On: { $regex: date, $options: "i" } }
        ]
      });
    }

    if (search) {
      const rx = new RegExp(search, "i");
      andConditions.push({
        $or: [
          { Patient: rx },
          { Doctor: rx },
          { Medicine: rx },
          { Prescription_ID: rx }
        ]
      });
    }
    
    // Combine all $or conditions with $and if we have multiple filter types
    if (andConditions.length > 0) {
      if (andConditions.length === 1 && Object.keys(filter).length === 0) {
        // If only one condition and no other filters, use it directly
        Object.assign(filter, andConditions[0]);
      } else {
        // Multiple conditions need $and
        filter.$and = andConditions;
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[Prescription Controller] Database: ${dbName} - Filter object:`, JSON.stringify(filter, null, 2));

    // First, let's check total count without filter to see if there are any prescriptions
    const totalWithoutFilter = await Model.countDocuments({});
    // eslint-disable-next-line no-console
    console.log(`[Prescription Controller] Database: ${dbName} - Total prescriptions in DB: ${totalWithoutFilter}`);

    // If doctor filter is applied, also check what doctor names exist
    if (Doctor) {
      const samplePrescriptions = await Model.find({}).limit(10).select("Doctor").lean().exec();
      const uniqueDoctors = [...new Set(samplePrescriptions.map((p: any) => p.Doctor).filter(Boolean))];
      // eslint-disable-next-line no-console
      console.log(`[Prescription Controller] Database: ${dbName} - Sample doctor names in DB:`, uniqueDoctors);
      // eslint-disable-next-line no-console
      console.log(`[Prescription Controller] Database: ${dbName} - Searching for doctor:`, Doctor);
    }
    
    // Also log total count without any filters for debugging
    const totalAllPrescriptions = await Model.countDocuments({});
    // eslint-disable-next-line no-console
    console.log(`[Prescription Controller] Database: ${dbName} - Total prescriptions in collection: ${totalAllPrescriptions}`);

    // If there are no prescriptions yet, optionally derive "prescription-like" rows
    // from completed consultations (unwind Medications).
    if (includeConsultations && totalAllPrescriptions === 0) {
      const ConsultationModel = getResourceModel("consultations");

      // Sort parsing (supports "createdAt", "-createdAt", etc.)
      const sortField = String(sort || "-createdAt").startsWith("-")
        ? String(sort).slice(1)
        : String(sort);
      const sortDir = String(sort || "-createdAt").startsWith("-") ? -1 : 1;

      // For consultations we treat "createdAt" as consultation.createdAt
      // (and expose it similarly on derived rows).
      const consultationMatch: Record<string, any> = {};
      const consultationAnd: any[] = [];

      // Doctor filter (reuse same flexible patterns but match on consultations.Doctor)
      if (Doctor) {
        const decodedDoctor = decodeURIComponent(Doctor.replace(/\+/g, " ")).trim();
        const doctorNameParts = decodedDoctor.split(/\s*-\s*/);
        const baseDoctorName = doctorNameParts[0]?.trim() || decodedDoctor;
        const doctorWords = baseDoctorName.split(/\s+/).filter((w) => w.length > 0);

        const escapedFull = decodedDoctor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedBase = baseDoctorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const doctorRegexPatterns: string[] = [escapedFull, escapedBase];
        doctorWords.forEach((word) => {
          if (word.length > 2) {
            doctorRegexPatterns.push(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
          }
        });

        consultationAnd.push({
          $or: doctorRegexPatterns.map((pattern) => ({
            Doctor: { $regex: pattern, $options: "i" },
          })),
        });
      }

      if (Patient) consultationMatch.Patient = { $regex: Patient, $options: "i" };

      // Status mapping: prescriptions use "Active", consultations use "Completed"
      if (Status) {
        const normalized = String(Status).toLowerCase();
        if (normalized === "active" || normalized === "completed") {
          consultationMatch.Status = "Completed";
        } else if (normalized === "cancelled") {
          consultationMatch.Status = "Cancelled";
        } else if (normalized === "draft") {
          consultationMatch.Status = "Draft";
        } else {
          // fallback: try direct match
          consultationMatch.Status = Status;
        }
      }

      // Date filter: query param is typically YYYY-MM-DD.
      // We match either Consultation_Date or Completed_At within that day.
      if (date) {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          const start = new Date(parsed);
          start.setHours(0, 0, 0, 0);
          const end = new Date(parsed);
          end.setHours(23, 59, 59, 999);
          consultationAnd.push({
            $or: [
              { Consultation_Date: { $gte: start, $lte: end } },
              { Completed_At: { $gte: start, $lte: end } },
              { createdAt: { $gte: start, $lte: end } },
            ],
          });
        }
      }

      if (search) {
        const rx = new RegExp(search, "i");
        consultationAnd.push({
          $or: [
            { Patient: rx },
            { Doctor: rx },
            { Consultation_ID: rx },
            { Appointment_ID: rx },
            { "Medications.medicine": rx },
          ],
        });
      }

      const consultationPipelineBase: any[] = [];
      const initialMatch: Record<string, any> = { ...consultationMatch };
      if (consultationAnd.length > 0) initialMatch.$and = consultationAnd;
      if (Object.keys(initialMatch).length > 0) {
        consultationPipelineBase.push({ $match: initialMatch });
      }

      consultationPipelineBase.push({
        $unwind: {
          path: "$Medications",
          includeArrayIndex: "medIndex",
          // If a consultation has no medications, still return one row so
          // the doctor can see the consultation in the prescriptions list.
          preserveNullAndEmptyArrays: true,
        },
      });

      // Project into "prescription-like" shape
      consultationPipelineBase.push({
        $addFields: {
          _derivedDate: {
            $ifNull: ["$Completed_At", { $ifNull: ["$Consultation_Date", "$createdAt"] }],
          },
          _amount: {
            $sum: {
              $map: {
                input: { $ifNull: ["$Invoice", []] },
                as: "i",
                in: { $ifNull: ["$$i.total", 0] },
              },
            },
          },
        },
      });

      consultationPipelineBase.push({
        $project: {
          _id: 0,
          // stable synthetic ids
          id: {
            $concat: [
              { $toString: "$_id" },
              "-med-",
              { $toString: { $ifNull: ["$medIndex", 0] } },
            ],
          },
          Prescription_ID: {
            $concat: [
              "CONS-",
              { $ifNull: ["$Consultation_ID", { $toString: "$_id" }] },
              "-",
              { $toString: { $add: [{ $ifNull: ["$medIndex", 0] }, 1] } },
            ],
          },
          Date: { $dateToString: { format: "%Y-%m-%d", date: "$_derivedDate" } },
          Prescribed_On: { $dateToString: { format: "%Y-%m-%d", date: "$_derivedDate" } },
          Patient: "$Patient",
          Patient_Image: "$Patient_Image",
          Doctor: "$Doctor",
          Medicine: {
            $let: {
              vars: { med: { $ifNull: ["$Medications.medicine", ""] } },
              in: {
                $cond: [
                  { $eq: ["$$med", ""] },
                  "Consultation",
                  "$$med",
                ],
              },
            },
          },
          Dosage: { $ifNull: ["$Medications.dosage", ""] },
          Frequency: { $ifNull: ["$Medications.frequency", ""] },
          Duration: { $ifNull: ["$Medications.duration", ""] },
          Appointment_ID: { $ifNull: ["$Appointment_ID", ""] },
          appointmentId: { $ifNull: ["$Appointment_ID", ""] },
          // map consultation status to prescription-like status
          Status: {
            $cond: [{ $eq: ["$Status", "Completed"] }, "Active", "$Status"],
          },
          Amount: "$_amount",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
        },
      });

      const sortStage: any = {};
      // allow createdAt, updatedAt, Date, Prescribed_On sorts
      sortStage[sortField] = sortDir;

      const dataPipeline = [
        ...consultationPipelineBase,
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limit },
      ];
      const countPipeline = [...consultationPipelineBase, { $count: "total" }];

      const [derivedRows, countRows] = await Promise.all([
        (ConsultationModel as any).aggregate(dataPipeline).exec(),
        (ConsultationModel as any).aggregate(countPipeline).exec(),
      ]);

      const derivedTotal = countRows?.[0]?.total ?? 0;

      // eslint-disable-next-line no-console
      console.log(
        `[Prescription Controller] Database: ${dbName} - Derived from consultations:`,
        { found: derivedRows.length, total: derivedTotal }
      );

      return res.json({
        data: derivedRows.map(formatPrescriptionResponse),
        pagination: {
          total: derivedTotal,
          page,
          limit,
          pages: Math.ceil(derivedTotal / limit),
        },
      });
    }

    // Use select to only fetch necessary fields from database
    const [prescriptions, total] = await Promise.all([
      Model.find(filter)
        .select("_id id Prescription_ID Date Prescribed_On Patient Patient_Image Doctor Medicine Status Dosage Frequency Duration Appointment_ID appointmentId Amount createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Model.countDocuments(filter),
    ]);

    // eslint-disable-next-line no-console
    console.log(`[Prescription Controller] Database: ${dbName} - Query results:`, {
      found: prescriptions.length,
      total,
      filterApplied: Object.keys(filter).length > 0,
      samplePrescriptions: prescriptions.slice(0, 3).map((p: any) => ({
        id: p.id || p._id,
        Doctor: p.Doctor,
        Patient: p.Patient,
        Medicine: p.Medicine,
      })),
    });

    res.json({
      data: prescriptions.map(formatPrescriptionResponse),
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

// GET /api/prescriptions/:id - Get prescription by ID
export const getPrescriptionById: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("doctorprescriptions");
    const { id } = req.params;

    const prescription = await Model.findOne({
      $or: [{ _id: id }, { id }, { Prescription_ID: id }],
    }).exec();
    
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.json(formatPrescriptionResponse(prescription));
  } catch (err: any) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid prescription id" });
    }
    next(err);
  }
};

// POST /api/prescriptions - Create new prescription
export const createPrescription: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("doctorprescriptions");
    const prescData: PrescriptionRequest = req.body;

    const validation = validatePrescriptionData(prescData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Generate ID if not provided
    if (!prescData.id && !prescData.Prescription_ID) {
      prescData.Prescription_ID = `#PRE${Date.now().toString().slice(-4)}`;
    }

    // Set date if not provided
    if (!prescData.Date && !prescData.Prescribed_On) {
      const today = new Date().toISOString().split("T")[0];
      prescData.Date = today;
      prescData.Prescribed_On = today;
    } else if (!prescData.Prescribed_On) {
      prescData.Prescribed_On = prescData.Date;
    } else if (!prescData.Date) {
      prescData.Date = prescData.Prescribed_On;
    }

    // Check for duplicate
    if (prescData.id) {
      const existing = await Model.findOne({ id: prescData.id }).exec();
      if (existing) {
        return res.status(409).json({ message: "Prescription with this ID already exists" });
      }
    }

    const created = await Model.create(prescData);
    res.status(201).json(formatPrescriptionResponse(created));
  } catch (err: any) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Prescription already exists" });
    }
    next(err);
  }
};

// PATCH /api/prescriptions/:id - Update prescription
export const updatePrescription: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("doctorprescriptions");
    const { id } = req.params;

    const prescription = await Model.findOne({
      $or: [{ _id: id }, { id }, { Prescription_ID: id }],
    }).exec();

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Don't allow updating id, _id, or Prescription_ID fields
    const { id: _ignoredId, _id: _ignoredMongoId, Prescription_ID: _ignoredPrescId, ...updateData } = req.body;
    
    Object.assign(prescription, updateData);
    await prescription.save();

    res.json(formatPrescriptionResponse(prescription));
  } catch (err: any) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid prescription id" });
    }
    next(err);
  }
};

// DELETE /api/prescriptions/:id - Delete prescription
export const deletePrescription: RequestHandler = async (req, res, next) => {
  try {
    const Model = getResourceModel("doctorprescriptions");
    const { id } = req.params;

    const prescription = await Model.findOne({
      $or: [{ _id: id }, { id }, { Prescription_ID: id }],
    }).exec();

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    await prescription.deleteOne();
    res.status(204).send();
  } catch (err: any) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid prescription id" });
    }
    next(err);
  }
};
