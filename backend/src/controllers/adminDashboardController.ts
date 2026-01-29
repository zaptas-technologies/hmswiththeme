import { RequestHandler } from "express";
import {
  buildAdminDashboardPayload,
  buildAdminDashboardSection,
  type DashboardFilters,
  type DashboardSectionName,
} from "../services/adminDashboardService";

const SECTION_NAMES: DashboardSectionName[] = [
  "stats",
  "appointmentStatistics",
  "popularDoctors",
  "recentAppointments",
  "topDepartments",
  "scheduleStats",
  "scheduledDoctors",
  "incomeByTreatment",
  "topPatients",
  "recentTransactions",
  "leaveRequests",
  "appointmentTrend",
  "allAppointments",
  "doctorsList",
  "patientsList",
];

function parseFilters(query: Record<string, any>): DashboardFilters {
  const period = query.period as string | undefined;
  const leavePeriod = query.leavePeriod as string | undefined;
  const limit = query.limit != null ? parseInt(String(query.limit), 10) : undefined;
  const type = query.type as string | undefined;
  return {
    period:
      period === "today" ||
      period === "yesterday" ||
      period === "last7days" ||
      period === "last30days" ||
      period === "last6months" ||
      period === "all" ||
      period === "weekly" ||
      period === "monthly" ||
      period === "yearly"
        ? (period as any)
        : undefined,
    dateFrom: query.dateFrom as string | undefined,
    dateTo: query.dateTo as string | undefined,
    leavePeriod:
      leavePeriod === "today" || leavePeriod === "week" || leavePeriod === "month"
        ? leavePeriod
        : undefined,
    limit: Number.isFinite(limit) ? limit : undefined,
    type: type === "all" || type === "in-person" || type === "online" ? type : undefined,
  };
}

export const getAdminDashboard: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let hospitalId: string | undefined = undefined;
    if (req.user.role === "HOSPITAL_ADMIN") {
      hospitalId = req.user.hospitalId;
      if (!hospitalId) {
        return res.status(400).json({
          message:
            "Hospital Admin must be associated with a hospital. Please contact administrator.",
        });
      }
    }

    const filters = parseFilters(req.query);
    const section = req.query.section as string | undefined;
    const debug = String(req.query.debug ?? "") === "1" || String(req.query.debug ?? "").toLowerCase() === "true";
    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[admin-dashboard] role=", req.user.role, "hospitalId=", hospitalId, "section=", section, "filters=", filters);
    }

    if (section && SECTION_NAMES.includes(section as DashboardSectionName)) {
      const payload = await buildAdminDashboardSection(
        hospitalId,
        section as DashboardSectionName,
        Object.keys(filters).length ? filters : undefined
      );
      if (debug) {
        // eslint-disable-next-line no-console
        console.log("[admin-dashboard] section response keys=", Object.keys(payload || {}));
      }
      return res.json(payload);
    }

    const payload = await buildAdminDashboardPayload(hospitalId, Object.keys(filters).length ? filters : undefined);
    if (hospitalId) {
      (payload as any).filteredByHospitalId = hospitalId;
    }
    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[admin-dashboard] full payload ok");
    }
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};
