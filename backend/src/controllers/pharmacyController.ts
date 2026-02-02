import { RequestHandler } from "express";
import mongoose from "mongoose";
import { User } from "../models/userModel";
import { Consultation } from "../models/consultationModel";
import { Hospital } from "../models/hospitalModel";
import { PharmacyDispense } from "../models/pharmacyDispenseModel";
import { Inventory, InventoryDoc } from "../models/inventoryModel";
import { Appointment } from "../models/appointmentModel";
import { sendPrescriptionDispensed } from "../services/notificationService";

export interface PharmacyRequest {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  hospitalId?: string; // For super_admin to specify hospital
}

// Helper to format pharmacy response
const formatPharmacyResponse = (user: any) => {
  return {
    _id: user._id?.toString(),
    id: user._id?.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hospitalId: user.hospitalId?.toString(),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Validation helper
const validatePharmacyData = (data: Partial<PharmacyRequest>): { isValid: boolean; error?: string } => {
  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    return { isValid: false, error: "Name is required" };
  }

  if (!data.email || typeof data.email !== "string" || data.email.trim() === "") {
    return { isValid: false, error: "Email is required" };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true };
};

// Get all pharmacies (users with pharmacist role)
export const getAllPharmacies: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort as string || "-createdAt";

    // Build filter for pharmacist role
    const filter: any = { role: "pharmacist" };
    
    // Apply hospital filter for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      filter.hospitalId = req.user.hospitalId;
    }

    const [pharmacies, total] = await Promise.all([
      User.find(filter)
        .select("_id name email phone role hospitalId createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      User.countDocuments(filter),
    ]);

    res.json({
      data: pharmacies.map(formatPharmacyResponse),
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

// Get pharmacy by ID
export const getPharmacyById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid pharmacy ID format" });
    }

    const filter: any = {
      _id: new mongoose.Types.ObjectId(id),
      role: "pharmacist",
    };

    // Apply hospital filter for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      filter.hospitalId = req.user.hospitalId;
    }

    const pharmacy = await User.findOne(filter)
      .select("_id name email phone role hospitalId createdAt updatedAt")
      .lean()
      .exec();

    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy user not found" });
    }

    res.json(formatPharmacyResponse(pharmacy));
  } catch (err) {
    next(err);
  }
};

// Create pharmacy user
export const createPharmacy: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only hospital_admin and super_admin can create pharmacies
    if (req.user.role !== "HOSPITAL_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const pharmacyData: PharmacyRequest = req.body;

    // Validate required fields
    const validation = validatePharmacyData(pharmacyData);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Password is required for new pharmacy users
    if (!pharmacyData.password || pharmacyData.password.trim() === "") {
      return res.status(400).json({ message: "Password is required" });
    }

    // Normalize email
    const normalizedEmail = pharmacyData.email.toLowerCase().trim();

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        message: "User with this email already exists",
        email: normalizedEmail 
      });
    }

    // Determine hospitalId
    let hospitalId: mongoose.Types.ObjectId | undefined;
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      hospitalId = new mongoose.Types.ObjectId(req.user.hospitalId);
    } else if (req.user.role === "SUPER_ADMIN" && pharmacyData.hospitalId) {
      hospitalId = new mongoose.Types.ObjectId(pharmacyData.hospitalId);
    }

    // Create pharmacy user
    const pharmacy = await User.create({
      name: pharmacyData.name,
      email: normalizedEmail,
      phone: pharmacyData.phone,
      password: pharmacyData.password,
      role: "pharmacist",
      hospitalId: hospitalId,
    });

    res.status(201).json(formatPharmacyResponse(pharmacy));
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: "User with this email already exists",
        field: "email"
      });
    }
    
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

// Update pharmacy user
export const updatePharmacy: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only hospital_admin and super_admin can update pharmacies
    if (req.user.role !== "HOSPITAL_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid pharmacy ID format" });
    }

    const filter: any = {
      _id: new mongoose.Types.ObjectId(id),
      role: "pharmacist",
    };

    // Apply hospital filter for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      filter.hospitalId = req.user.hospitalId;
    }

    const pharmacy = await User.findOne(filter);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy user not found" });
    }

    const updateData: Partial<PharmacyRequest> = req.body;

    // Validate if updating email
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if email is already taken by another user
      const normalizedEmail = updateData.email.toLowerCase().trim();
      const existingUser = await User.findOne({ 
        email: normalizedEmail,
        _id: { $ne: id }
      });
      if (existingUser) {
        return res.status(409).json({ message: "Email already in use" });
      }
      updateData.email = normalizedEmail;
    }

    // Update fields
    if (updateData.name) pharmacy.name = updateData.name;
    if (updateData.email) pharmacy.email = updateData.email;
    if (updateData.phone !== undefined) pharmacy.phone = updateData.phone;
    if (updateData.password) pharmacy.password = updateData.password;

    await pharmacy.save();

    res.json(formatPharmacyResponse(pharmacy));
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: "User with this email already exists",
        field: "email"
      });
    }
    
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

// Delete pharmacy user
export const deletePharmacy: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only hospital_admin and super_admin can delete pharmacies
    if (req.user.role !== "HOSPITAL_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid pharmacy ID format" });
    }

    const filter: any = {
      _id: new mongoose.Types.ObjectId(id),
      role: "pharmacist",
    };

    // Apply hospital filter for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      filter.hospitalId = req.user.hospitalId;
    }

    const pharmacy = await User.findOne(filter);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy user not found" });
    }

    await User.findByIdAndDelete(id);

    res.json({ 
      success: true,
      message: "Pharmacy user deleted successfully" 
    });
  } catch (err) {
    next(err);
  }
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const formatConsultationForDashboard = (c: any, fulfilledBy: any) => ({
  id: c._id?.toString(),
  _id: c._id?.toString(),
  Consultation_ID: c._id?.toString(),
  Appointment_ID: c.Appointment_ID?.toString?.(),
  Patient: c.Patient,
  Doctor: c.Doctor,
  Status: c.Status,
  Medications: c.Medications || [],
  Consultation_Date: c.Consultation_Date,
  Completed_At: c.Completed_At,
  createdAt: c.createdAt,
  fulfilledBy: fulfilledBy
    ? {
        id: fulfilledBy._id?.toString(),
        amountReceived: fulfilledBy.amountReceived,
        paymentMethod: fulfilledBy.paymentMethod,
        dispensedAt: fulfilledBy.createdAt,
      }
    : null,
});

/** Pharmacy dashboard: data from Consultation table (pending = not dispensed, completed = dispensed). Newest first. */
export const getPharmacyDashboard: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "PHARMACIST" && req.user.role !== "HOSPITAL_ADMIN") {
      return res.status(403).json({ message: "Forbidden. Pharmacy dashboard is for pharmacist or hospital admin." });
    }
    const hospitalId = req.user.hospitalId;
    if (!hospitalId) return res.status(400).json({ message: "Pharmacy user must be associated with a hospital." });

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const tab = (req.query.tab === "pending" || req.query.tab === "completed" || req.query.tab === "all")
      ? req.query.tab
      : "pending";

    const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId);
    const baseFilter: Record<string, unknown> = { hospital: hospitalObjectId, Status: "Completed" };
    let listFilter: Record<string, unknown> = { ...baseFilter };
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      listFilter = { ...listFilter, $or: [{ Patient: regex }, { Doctor: regex }, { "Medications.medicine": regex }] };
    }

    const [dispensedIdList, dispenseMap, completedCount, completedTodayCount, hospitalDoc] = await Promise.all([
      PharmacyDispense.find({ hospital: hospitalObjectId }).distinct("consultationId").exec(),
      PharmacyDispense.find({ hospital: hospitalObjectId })
        .select("consultationId amountReceived paymentMethod createdAt _id")
        .lean()
        .exec(),
      PharmacyDispense.countDocuments({ hospital: hospitalObjectId }),
      (() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        return PharmacyDispense.countDocuments({
          hospital: hospitalObjectId,
          createdAt: { $gte: todayStart, $lte: todayEnd },
        });
      })(),
      Hospital.findById(hospitalId).select("name city state").lean().exec(),
    ]);

    const tabFilterDb: Record<string, unknown> =
      tab === "pending"
        ? { _id: { $nin: dispensedIdList } }
        : tab === "completed"
          ? { _id: { $in: dispensedIdList } }
          : {};
    const listFilterWithTab = { ...listFilter, ...tabFilterDb };
    const skip = (page - 1) * limit;
    const sortOption: { Completed_At: -1 | 1; createdAt: -1 | 1 } = { Completed_At: -1, createdAt: -1 };

    const [total, consultations] = await Promise.all([
      Consultation.countDocuments(listFilterWithTab),
      Consultation.find(listFilterWithTab).sort(sortOption).skip(skip).limit(limit).lean().exec(),
    ]);

    const pendingCount = await Consultation.countDocuments({
      ...baseFilter,
      ...(search ? { $or: [{ Patient: new RegExp(escapeRegex(search), "i") }, { Doctor: new RegExp(escapeRegex(search), "i") }, { "Medications.medicine": new RegExp(escapeRegex(search), "i") }] } : {}),
      _id: { $nin: dispensedIdList },
    });

    const byConsultationId = new Map<string, any>();
    for (const d of dispenseMap as any[]) {
      const cid = d.consultationId?.toString();
      if (cid) byConsultationId.set(cid, d);
    }

    const list = consultations.map((c: any) => {
      const fid = c._id?.toString();
      const fulfilledBy = fid ? byConsultationId.get(fid) : null;
      return formatConsultationForDashboard(c, fulfilledBy);
    });

    return res.json({
      hospital: hospitalDoc
        ? { id: hospitalId, name: (hospitalDoc as any).name, city: (hospitalDoc as any).city, state: (hospitalDoc as any).state }
        : null,
      consultations: list,
      stats: { pendingCount, completedCount, completedTodayCount },
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

/** Get consultation price breakdown (medicines with quantity and unit price from DB). For pharmacy fulfill modal. */
export const getConsultationPriceBreakdown: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "PHARMACIST" && req.user.role !== "HOSPITAL_ADMIN") {
      return res.status(403).json({ message: "Forbidden." });
    }
    const hospitalId = req.user.hospitalId;
    if (!hospitalId) return res.status(400).json({ message: "Pharmacy user must be associated with a hospital." });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid consultation id" });

    const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId);
    const consultation = await Consultation.findOne({
      _id: new mongoose.Types.ObjectId(id),
      hospital: hospitalObjectId,
    })
      .select("Medications")
      .lean()
      .exec();
    if (!consultation) return res.status(404).json({ message: "Consultation not found" });

    const medications = (consultation as any).Medications || [];
    const lineItems: Array<{ medicine: string; dosage?: string; quantity: number; unitPrice: number; subtotal: number; inventoryId?: string; batchNumber?: string; expiry?: string | null }> = [];
    let total = 0;

    for (const med of medications) {
      const invId = (med as any).inventoryId;
      const medicineName = typeof (med as any).medicine === "string" ? (med as any).medicine : "—";
      const dosage = (med as any).dosage;
      let quantity = Number((med as any).quantity) || 1;
      let unitPrice = Number((med as any).unitPrice) ?? 0;
      let expiry: string | null = null;
      let batchNumber: string | null = (med as any).batchNumber ? String((med as any).batchNumber).trim() : null;

      if (invId && hospitalObjectId) {
        const invObjId = invId instanceof mongoose.Types.ObjectId ? invId : new mongoose.Types.ObjectId(String(invId));
        const inv = await Inventory.findOne({ _id: invObjId, hospital: hospitalObjectId })
          .select("Item_Name Unit_Price Quantity Expiry_Date Batch_Number")
          .lean()
          .exec();
        if (inv) {
          unitPrice = (inv as any).Unit_Price ?? 0;
          if (quantity <= 0) quantity = 1;
          const expDate = (inv as any).Expiry_Date;
          if (expDate) expiry = new Date(expDate).toISOString().split("T")[0];
          if (!batchNumber && (inv as any).Batch_Number) batchNumber = String((inv as any).Batch_Number);
        }
      }
      if (!expiry && (med as any).expiry) expiry = (med as any).expiry instanceof Date ? (med as any).expiry.toISOString().split("T")[0] : String((med as any).expiry);
      const subtotal = unitPrice * quantity;
      total += subtotal;
      lineItems.push({
        medicine: (med as any).medicine || medicineName,
        dosage,
        quantity,
        unitPrice,
        subtotal,
        inventoryId: invId?.toString?.(),
        batchNumber: batchNumber ?? undefined,
        expiry: expiry ?? undefined,
      });
    }

    return res.json({ lineItems, total });
  } catch (err) {
    next(err);
  }
};

/** Fulfill consultation: create PharmacyDispense, deduct inventory, return dispense record. */
export const fulfillConsultation: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "PHARMACIST" && req.user.role !== "HOSPITAL_ADMIN") {
      return res.status(403).json({ message: "Forbidden. Only pharmacy can fulfill." });
    }
    const hospitalId = req.user.hospitalId;
    if (!hospitalId) return res.status(400).json({ message: "Pharmacy user must be associated with a hospital." });

    const { consultationId, amountReceived = 0, paymentMode = "Cash", lineItems } = req.body || {};
    if (!consultationId || !mongoose.Types.ObjectId.isValid(consultationId)) {
      return res.status(400).json({ message: "Valid consultationId is required" });
    }

    const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId);
    const consultationObjectId = new mongoose.Types.ObjectId(consultationId);

    const existing = await PharmacyDispense.findOne({ consultationId: consultationObjectId }).exec();
    if (existing) return res.status(400).json({ message: "Consultation already dispensed." });

    const consultation = await Consultation.findOne({
      _id: consultationObjectId,
      hospital: hospitalObjectId,
      Status: "Completed",
    })
      .select("Patient Doctor Appointment_ID Medications")
      .lean()
      .exec();
    if (!consultation) return res.status(404).json({ message: "Consultation not found" });

    const c = consultation as any;
    const medicationsFromConsultation = c.Medications || [];
    const finalLineItems = Array.isArray(lineItems) && lineItems.length > 0
      ? lineItems.map((m: any) => ({
          medicine: String(m.medicine ?? ""),
          dosage: m.dosage,
          quantity: Math.max(1, Number(m.quantity) || 1),
          unitPrice: Number(m.unitPrice) || 0,
          subtotal: 0,
          inventoryId: m.inventoryId && mongoose.Types.ObjectId.isValid(m.inventoryId)
            ? new mongoose.Types.ObjectId(m.inventoryId)
            : undefined,
          batchNumber: m.batchNumber && String(m.batchNumber).trim() ? String(m.batchNumber).trim() : undefined,
          expiry: m.expiry ? new Date(m.expiry) : undefined,
        }))
      : medicationsFromConsultation.map((m: any) => ({
          medicine: String(m.medicine ?? ""),
          dosage: m.dosage,
          quantity: Math.max(1, Number(m.quantity) || 1),
          unitPrice: Number(m.unitPrice) || 0,
          subtotal: 0,
          inventoryId: m.inventoryId ? new mongoose.Types.ObjectId(m.inventoryId) : undefined,
          batchNumber: m.batchNumber && String(m.batchNumber).trim() ? String(m.batchNumber).trim() : undefined,
          expiry: m.expiry ? new Date(m.expiry) : undefined,
        }));

    // Require batch and expiry for every medicine line
    for (let i = 0; i < finalLineItems.length; i++) {
      const item = finalLineItems[i];
      if (!item.medicine || item.medicine.trim() === "") continue;
      const batchOk = item.batchNumber && String(item.batchNumber).trim() !== "";
      const expiryOk = item.expiry && !isNaN(new Date(item.expiry).getTime());
      if (!batchOk || !expiryOk) {
        return res.status(400).json({
          message: `Batch number and expiry date are required for every medicine. Please provide for: ${item.medicine}.`,
        });
      }
    }

    for (let i = 0; i < finalLineItems.length; i++) {
      const item = finalLineItems[i];
      item.subtotal = item.unitPrice * item.quantity;
    }

    for (const item of finalLineItems) {
      if (!item.inventoryId) continue;
      const qty = item.quantity;
      const updated = await Inventory.findOneAndUpdate(
        { _id: item.inventoryId, hospital: hospitalObjectId, Quantity: { $gte: qty } },
        { $inc: { Quantity: -qty } },
        { new: true }
      ).exec();
      if (!updated) {
        const inv = await Inventory.findById(item.inventoryId).select("Item_Name").lean().exec();
        const name = (inv as any)?.Item_Name || item.medicine;
        return res.status(400).json({
          message: `Insufficient stock or item not found for: ${name}. Cannot fulfill.`,
        });
      }
      const invDoc = updated as InventoryDoc;
      if (invDoc.Quantity <= 0) invDoc.Status = "Out of Stock";
      else if (invDoc.Quantity < 10) invDoc.Status = "Low Stock";
      if (invDoc.Unit_Price != null && invDoc.Quantity != null) {
        invDoc.Total_Value = invDoc.Unit_Price * invDoc.Quantity;
      }
      await invDoc.save();
    }

    const dispense = await PharmacyDispense.create({
      hospital: hospitalObjectId,
      consultationId: consultationObjectId,
      appointmentId: c.Appointment_ID || undefined,
      doctorName: c.Doctor || "",
      patientName: c.Patient || "",
      amountReceived: Number(amountReceived) || 0,
      paymentMethod: String(paymentMode || "Cash"),
      medications: finalLineItems,
      dispensedBy: new mongoose.Types.ObjectId(req.user.userId),
    });

    const out = dispense.toObject ? dispense.toObject() : dispense;
    const patientName = (out as any).patientName || c.Patient || "Patient";
    const doctorName = (out as any).doctorName || c.Doctor || "";
    const amountPaid = (out as any).amountReceived ?? 0;

    // Fire-and-forget: notify patient that prescription is dispensed (email/WhatsApp)
    setImmediate(async () => {
      let patientPhone: string | undefined;
      let patientEmail: string | undefined;
      if (c.Appointment_ID) {
        const appt = await Appointment.findById(c.Appointment_ID).select("Phone").lean().exec();
        if (appt && (appt as any).Phone) patientPhone = (appt as any).Phone;
      }
      sendPrescriptionDispensed({
        patientName,
        patientPhone,
        patientEmail,
        doctorName,
        amountPaid,
      });
    });

    return res.status(201).json({
      id: (out as any)._id?.toString(),
      _id: (out as any)._id?.toString(),
      consultationId: (out as any).consultationId?.toString?.(),
      patientName,
      doctorName: (out as any).doctorName,
      amountReceived: (out as any).amountReceived,
      paymentMethod: (out as any).paymentMethod,
      medications: (out as any).medications,
      createdAt: (out as any).createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// Impersonate pharmacy user (login as pharmacy user)
export const impersonatePharmacy: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only hospital_admin and super_admin can impersonate
    if (req.user.role !== "HOSPITAL_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid pharmacy ID format" });
    }

    const filter: any = {
      _id: new mongoose.Types.ObjectId(id),
      role: "pharmacist",
    };

    // Apply hospital filter for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
      filter.hospitalId = req.user.hospitalId;
    }

    const pharmacy = await User.findOne(filter);
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy user not found" });
    }

    // Generate token for the pharmacy user (using same method as authController)
    const generateToken = (userId: string): string => {
      return Buffer.from(JSON.stringify({ userId, doctorId: userId, timestamp: Date.now() })).toString("base64");
    };
    const token = generateToken(pharmacy._id.toString());

    // Return pharmacy user data with token
    res.json({
      token,
      user: formatPharmacyResponse(pharmacy),
      impersonated: true,
      originalUser: {
        id: req.user.userId,
        role: req.user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
