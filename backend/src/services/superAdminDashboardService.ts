import mongoose from "mongoose";
import { Hospital } from "../models/hospitalModel";
import { User } from "../models/userModel";
import { Doctor } from "../models/doctorModel";
import { Patient } from "../models/patientModel";
import { Appointment } from "../models/appointmentModel";
import { PharmacyDispense } from "../models/pharmacyDispenseModel";

export type SuperAdminTotals = {
  branches: number;
  hospitalAdmins: number;
  doctors: number;
  patients: number;
  appointments: number;
  /** Total revenue (hospital + pharmacy) */
  revenue: number;
  /** Revenue from appointments (consultation fees) */
  hospitalRevenue: number;
  /** Revenue from pharmacy dispenses */
  pharmacyRevenue: number;
};

export type SuperAdminBranchRow = {
  hospitalId: string;
  name: string;
  city?: string;
  state?: string;
  status?: string;
  admin?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  counts: {
    doctors: number;
    patients: number;
    appointments: number;
  };
  /** Revenue from appointments (consultation fees) for this branch */
  hospitalRevenue: number;
  /** Revenue from pharmacy dispenses for this branch */
  pharmacyRevenue: number;
};

export type SuperAdminDashboardResponse = {
  generatedAt: string;
  totals: SuperAdminTotals;
  branches: SuperAdminBranchRow[];
};

const toIdString = (v: any): string => {
  try {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (v instanceof mongoose.Types.ObjectId) return v.toString();
    if (typeof v?.toString === "function") return v.toString();
    return String(v);
  } catch {
    return String(v ?? "");
  }
};

export const buildSuperAdminDashboardPayload = async (): Promise<SuperAdminDashboardResponse> => {
  const generatedAt = new Date().toISOString();

  // Only consider data for hospitals that exist in DB (ignore orphaned doctors/patients from deleted hospitals)
  const existingHospitals = await Hospital.find().select("_id").lean();
  const hospitalIds = existingHospitals.map((h: any) => h._id);

  const [
    branchesCount,
    hospitalAdminsCount,
    doctorsCount,
    patientsCount,
    appointmentsCount,
  ] = await Promise.all([
    Hospital.countDocuments(),
    User.countDocuments({ role: "hospital_admin", hospitalId: { $in: hospitalIds } }),
    Doctor.countDocuments({ hospital: { $in: hospitalIds } }),
    Patient.countDocuments({ hospital: { $in: hospitalIds } }),
    Appointment.countDocuments({ hospital: { $in: hospitalIds } }),
  ]);

  const [hospitalRevenueAgg, pharmacyRevenueAgg] = await Promise.all([
    Appointment.aggregate([
      { $match: { hospital: { $in: hospitalIds }, Status: { $in: ["Confirmed", "Checked Out", "Completed"] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } } } },
    ]),
    PharmacyDispense.aggregate([
      { $match: { hospital: { $in: hospitalIds } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amountReceived", 0] } } } },
    ]),
  ]);
  const hospitalRevenue = hospitalRevenueAgg[0]?.total ?? 0;
  const pharmacyRevenue = pharmacyRevenueAgg[0]?.total ?? 0;
  const revenue = hospitalRevenue + pharmacyRevenue;

  // Per-branch counts and revenue: only for existing hospitals
  const [doctorsByHospital, patientsByHospital, apptsByHospital, hospitalRevByBranch, pharmacyRevByBranch] =
    await Promise.all([
      Doctor.aggregate([
        { $match: { hospital: { $in: hospitalIds } } },
        { $group: { _id: "$hospital", c: { $sum: 1 } } },
      ]),
      Patient.aggregate([
        { $match: { hospital: { $in: hospitalIds } } },
        { $group: { _id: "$hospital", c: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        { $match: { hospital: { $in: hospitalIds } } },
        { $group: { _id: "$hospital", c: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        {
          $match: {
            hospital: { $in: hospitalIds },
            Status: { $in: ["Confirmed", "Checked Out", "Completed"] },
          },
        },
        { $group: { _id: "$hospital", total: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } } } },
      ]),
      PharmacyDispense.aggregate([
        { $match: { hospital: { $in: hospitalIds } } },
        { $group: { _id: "$hospital", total: { $sum: { $ifNull: ["$amountReceived", 0] } } } },
      ]),
    ]);

  const doctorsMap = new Map<string, number>(doctorsByHospital.map((r: any) => [toIdString(r._id), r.c || 0]));
  const patientsMap = new Map<string, number>(patientsByHospital.map((r: any) => [toIdString(r._id), r.c || 0]));
  const apptsMap = new Map<string, number>(apptsByHospital.map((r: any) => [toIdString(r._id), r.c || 0]));
  const hospitalRevMap = new Map<string, number>(hospitalRevByBranch.map((r: any) => [toIdString(r._id), r.total ?? 0]));
  const pharmacyRevMap = new Map<string, number>(pharmacyRevByBranch.map((r: any) => [toIdString(r._id), r.total ?? 0]));

  const hospitals = await Hospital.find()
    .populate("hospitalAdmin", "name email phone")
    .sort({ createdAt: -1 })
    .lean();

  const branches: SuperAdminBranchRow[] = hospitals.map((h: any) => {
    const hospitalId = toIdString(h._id);
    const admin = h.hospitalAdmin
      ? {
          id: toIdString(h.hospitalAdmin._id),
          name: h.hospitalAdmin.name,
          email: h.hospitalAdmin.email,
          phone: h.hospitalAdmin.phone,
        }
      : null;

    return {
      hospitalId,
      name: h.name,
      city: h.city,
      state: h.state,
      status: h.status,
      admin,
      counts: {
        doctors: doctorsMap.get(hospitalId) || 0,
        patients: patientsMap.get(hospitalId) || 0,
        appointments: apptsMap.get(hospitalId) || 0,
      },
      hospitalRevenue: hospitalRevMap.get(hospitalId) ?? 0,
      pharmacyRevenue: pharmacyRevMap.get(hospitalId) ?? 0,
    };
  });

  return {
    generatedAt,
    totals: {
      branches: branchesCount,
      hospitalAdmins: hospitalAdminsCount,
      doctors: doctorsCount,
      patients: patientsCount,
      appointments: appointmentsCount,
      revenue,
      hospitalRevenue,
      pharmacyRevenue,
    },
    branches,
  };
};

