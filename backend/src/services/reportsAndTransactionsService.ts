import mongoose from "mongoose";
import { Appointment } from "../models/appointmentModel";
import { PharmacyDispense } from "../models/pharmacyDispenseModel";
import { GRN } from "../models/grnModel";
import { getDateRange, type Period } from "../utils/dateRange";

export type TransactionsFilters = {
  period?: Period;
  dateFrom?: string;
  dateTo?: string;
  type?: "all" | "hospital" | "pharmacy";
  page?: number;
  limit?: number;
};

export type ReportsFilters = {
  period?: Period;
  dateFrom?: string;
  dateTo?: string;
};

export type InventoryReportFilters = {
  period?: Period;
  dateFrom?: string;
  dateTo?: string;
  /** Filter by medicine/item name (case-insensitive); when set, returns all in/out for that medicine with batch and expiry */
  search?: string;
};

function buildHospitalFilter(hospitalId: string | undefined): Record<string, unknown> {
  if (!hospitalId) return {};
  try {
    return { hospital: new mongoose.Types.ObjectId(hospitalId) };
  } catch {
    return {};
  }
}

/** Resolve effective hospitalId: for hospital_admin use only their hospital; for super_admin use query param. */
export function resolveHospitalId(userRole: string, userHospitalId: string | undefined, queryHospitalId?: string): string | undefined {
  if (userRole === "HOSPITAL_ADMIN") return userHospitalId;
  if (userRole === "SUPER_ADMIN") return queryHospitalId || undefined;
  return userHospitalId;
}

/** Paginated transactions: hospital (appointment fees) + pharmacy (dispense). Optimized with lean + indexed queries. */
export async function getTransactionsList(
  hospitalId: string | undefined,
  filters: TransactionsFilters
) {
  const limit = Math.min(Math.max(1, filters.limit ?? 20), 100);
  const page = Math.max(1, filters.page ?? 1);
  const skip = (page - 1) * limit;
  const period = filters.period ?? "last30days";
  const hasCustomRange = Boolean(filters.dateFrom || filters.dateTo);
  const dateRange = period !== "all" || hasCustomRange
    ? getDateRange(period, filters.dateFrom, filters.dateTo)
    : null;
  const baseMatch: Record<string, unknown> = {
    ...buildHospitalFilter(hospitalId),
    ...(dateRange ? { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
  };

  const type = filters.type ?? "all";
  const includeHospital = type === "all" || type === "hospital";
  const includePharmacy = type === "all" || type === "pharmacy";

  const hospitalMatch = {
    ...baseMatch,
    Status: { $in: ["Confirmed", "Checked Out", "Completed"] },
    Fees: { $exists: true, $ne: null },
  };

  const [hospitalCount, pharmacyCount] = await Promise.all([
    includeHospital ? Appointment.countDocuments(hospitalMatch) : Promise.resolve(0),
    includePharmacy ? PharmacyDispense.countDocuments(baseMatch) : Promise.resolve(0),
  ]);
  const totalCount = hospitalCount + pharmacyCount;

  const fetchSize = type === "all" ? skip + limit : limit;
  const results: Array<{
    id: string;
    type: "hospital" | "pharmacy";
    source: string;
    reference: string;
    amount: number;
    date: string;
    patientName?: string;
    paymentMethod?: string;
    createdAt: string;
  }> = [];

  if (includeHospital) {
    const appointments = await (Appointment as any)
      .find(hospitalMatch)
      .sort({ createdAt: -1 })
      .skip(type === "hospital" ? skip : 0)
      .limit(type === "hospital" ? limit : fetchSize)
      .select("_id Patient Fees Date_Time paymentMode createdAt")
      .lean();
    appointments.forEach((a: any) => {
      results.push({
        id: String(a._id),
        type: "hospital",
        source: "Consultation",
        reference: `#APT-${String(a._id).slice(-6).toUpperCase()}`,
        amount: Number(a.Fees) || 0,
        date: a.Date_Time || new Date(a.createdAt).toISOString(),
        patientName: a.Patient,
        paymentMethod: a.paymentMode || "Cash",
        createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : "",
      });
    });
  }

  if (includePharmacy) {
    const dispenses = await (PharmacyDispense as any)
      .find(baseMatch)
      .sort({ createdAt: -1 })
      .skip(type === "pharmacy" ? skip : 0)
      .limit(type === "pharmacy" ? limit : fetchSize)
      .select("_id patientName amountReceived paymentMethod createdAt")
      .lean();
    dispenses.forEach((d: any) => {
      results.push({
        id: String(d._id),
        type: "pharmacy",
        source: "Pharmacy",
        reference: `#DSP-${String(d._id).slice(-6).toUpperCase()}`,
        amount: Number(d.amountReceived) || 0,
        date: d.createdAt ? new Date(d.createdAt).toISOString() : "",
        patientName: d.patientName,
        paymentMethod: d.paymentMethod || "Cash",
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : "",
      });
    });
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const list = type === "all" ? results.slice(skip, skip + limit) : results;

  return {
    list,
    total: totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}

/** Reports summary: appointment stats, revenue, top departments. Reuses date range logic. */
export async function getReportsSummary(hospitalId: string | undefined, filters: ReportsFilters) {
  const period = filters.period ?? "last30days";
  const hasCustomRange = Boolean(filters.dateFrom || filters.dateTo);
  const dateRange = period !== "all" || hasCustomRange
    ? getDateRange(period, filters.dateFrom, filters.dateTo)
    : null;
  const baseMatch: Record<string, unknown> = {
    ...buildHospitalFilter(hospitalId),
    ...(dateRange ? { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
  };

  const [appointmentStats, revenueAgg, pharmacyAgg, topDepts] = await Promise.all([
    Appointment.aggregate([
      { $match: baseMatch },
      { $group: { _id: "$Status", count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      {
        $match: {
          ...baseMatch,
          Status: { $in: ["Confirmed", "Checked Out", "Completed"] },
        },
      },
      { $group: { _id: null, total: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } } } },
    ]),
    PharmacyDispense.aggregate([
      { $match: baseMatch },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amountReceived", 0] } } } },
    ]),
    Appointment.aggregate([
      { $match: { ...baseMatch, doctorId: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doc",
        },
      },
      { $unwind: { path: "$doc", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$doc.Department", "General"] },
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: [{ $toDouble: "$Fees" }, 0] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const statusMap = new Map<string, number>();
  appointmentStats.forEach((s: any) => statusMap.set(s._id || "Unknown", s.count));
  const hospitalRevenue = revenueAgg[0]?.total ?? 0;
  const pharmacyRevenue = pharmacyAgg[0]?.total ?? 0;

  return {
    period: filters.period ?? "last30days",
    dateFrom: dateRange?.start?.toISOString(),
    dateTo: dateRange?.end?.toISOString(),
    appointmentStatistics: {
      all: Array.from(statusMap.values()).reduce((a, b) => a + b, 0),
      completed: (statusMap.get("Completed") ?? 0) + (statusMap.get("Checked Out") ?? 0) + (statusMap.get("Confirmed") ?? 0),
      cancelled: statusMap.get("Cancelled") ?? 0,
      scheduled: statusMap.get("Scheduled") ?? 0,
      reschedule: statusMap.get("Reschedule") ?? 0,
    },
    revenue: {
      hospitalRevenue,
      pharmacyRevenue,
      total: hospitalRevenue + pharmacyRevenue,
    },
    topDepartments: topDepts.map((d: any) => ({
      name: d._id,
      count: d.count,
      revenue: d.revenue,
    })),
  };
}

/** Inventory In/Out: GRN items = In, PharmacyDispense medications = Out. Batch and expiry included. Optional search by medicine name. */
export async function getInventoryReport(hospitalId: string | undefined, filters: InventoryReportFilters) {
  const period = filters.period ?? "last30days";
  const hasCustomRange = Boolean(filters.dateFrom || filters.dateTo);
  const dateRange = period !== "all" || hasCustomRange
    ? getDateRange(period, filters.dateFrom, filters.dateTo)
    : null;
  const baseMatch: Record<string, unknown> = {
    ...buildHospitalFilter(hospitalId),
    ...(dateRange ? { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
  };
  const searchTerm = (filters.search || "").trim().toLowerCase();

  const [grnDocs, dispenseDocs] = await Promise.all([
    (GRN as any).find({ ...baseMatch, Status: "Received" }).select("Items GRN_Number GRN_Date createdAt").lean(),
    (PharmacyDispense as any).find(baseMatch).select("medications createdAt").lean(),
  ]);

  type BatchEntry = { grn: string; date: string; qty: number; batch: string; expiry: string };
  const inMap = new Map<string, { quantity: number; value: number; batches: BatchEntry[] }>();
  grnDocs.forEach((g: any) => {
    const grnNum = g.GRN_Number || "";
    const dateStr = g.GRN_Date ? new Date(g.GRN_Date).toISOString().slice(0, 10) : "";
    (g.Items || []).forEach((it: any) => {
      const name = it.Item_Name || "Unknown";
      if (searchTerm && name.toLowerCase().indexOf(searchTerm) === -1) return;
      const qty = Number(it.Quantity) || 0;
      const val = Number(it.Total_Price) || 0;
      const cur = inMap.get(name) || { quantity: 0, value: 0, batches: [] };
      cur.quantity += qty;
      cur.value += val;
      cur.batches.push({
        grn: grnNum,
        date: dateStr,
        qty,
        batch: it.Batch_Number || "-",
        expiry: it.Expiry_Date ? new Date(it.Expiry_Date).toISOString().slice(0, 10) : "-",
      });
      inMap.set(name, cur);
    });
  });

  type OutLine = { batch: string; expiry: string; quantity: number; value: number };
  const outMap = new Map<string, { quantity: number; value: number; lines: OutLine[] }>();
  dispenseDocs.forEach((d: any) => {
    (d.medications || []).forEach((m: any) => {
      const name = m.medicine || "Unknown";
      if (searchTerm && name.toLowerCase().indexOf(searchTerm) === -1) return;
      const qty = Number(m.quantity) || 0;
      const val = Number(m.subtotal) || 0;
      const cur = outMap.get(name) || { quantity: 0, value: 0, lines: [] };
      cur.quantity += qty;
      cur.value += val;
      cur.lines.push({
        batch: m.batchNumber || "-",
        expiry: m.expiry ? new Date(m.expiry).toISOString().slice(0, 10) : "-",
        quantity: qty,
        value: val,
      });
      outMap.set(name, cur);
    });
  });

  const allItems = new Set([...inMap.keys(), ...outMap.keys()]);
  const rows = Array.from(allItems).map((itemName) => {
    const inData = inMap.get(itemName);
    const outData = outMap.get(itemName);
    return {
      itemName,
      inQuantity: inData?.quantity ?? 0,
      inValue: inData?.value ?? 0,
      inBatches: inData?.batches ?? [],
      outQuantity: outData?.quantity ?? 0,
      outValue: outData?.value ?? 0,
      outLines: outData?.lines ?? [],
    };
  });

  return {
    period: filters.period ?? "last30days",
    dateFrom: dateRange?.start?.toISOString(),
    dateTo: dateRange?.end?.toISOString(),
    search: filters.search || undefined,
    in: Array.from(inMap.entries()).map(([name, v]) => ({
      itemName: name,
      quantity: v.quantity,
      value: v.value,
      batches: v.batches,
    })),
    out: Array.from(outMap.entries()).map(([name, v]) => ({
      itemName: name,
      quantity: v.quantity,
      value: v.value,
      lines: v.lines,
    })),
    summary: rows,
  };
}
