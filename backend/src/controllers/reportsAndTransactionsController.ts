import { RequestHandler } from "express";
import {
  getTransactionsList,
  getReportsSummary,
  getInventoryReport,
  resolveHospitalId,
} from "../services/reportsAndTransactionsService";
import type { Period } from "../utils/dateRange";

const PERIODS: Period[] = ["today", "yesterday", "last7days", "last30days", "last6months", "all"];

function parsePeriod(s: unknown): Period | undefined {
  if (typeof s !== "string") return undefined;
  return PERIODS.includes(s as Period) ? (s as Period) : undefined;
}

export const getTransactions: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const hospitalId = resolveHospitalId(
      req.user.role,
      req.user.hospitalId,
      req.query.hospitalId as string | undefined
    );
    if (req.user.role === "HOSPITAL_ADMIN" && !hospitalId) {
      return res.status(400).json({ message: "Hospital context required" });
    }
    const period = parsePeriod(req.query.period) ?? "last30days";
    const type = (req.query.type as string) === "pharmacy" ? "pharmacy" : (req.query.type as string) === "hospital" ? "hospital" : "all";
    const page = Math.max(1, parseInt(String(req.query.page || 1), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 20), 10) || 20));
    const result = await getTransactionsList(hospitalId, {
      period,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      type,
      page,
      limit,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

export const getReports: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const hospitalId = resolveHospitalId(
      req.user.role,
      req.user.hospitalId,
      req.query.hospitalId as string | undefined
    );
    if ((req.user.role === "HOSPITAL_ADMIN" || req.user.role === "PHARMACIST") && !hospitalId) {
      return res.status(400).json({ message: "Hospital context required" });
    }
    const period = parsePeriod(req.query.period) ?? "last30days";
    const result = await getReportsSummary(hospitalId, {
      period,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

export const getInventoryReportHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const hospitalId = resolveHospitalId(
      req.user.role,
      req.user.hospitalId,
      req.query.hospitalId as string | undefined
    );
    if ((req.user.role === "HOSPITAL_ADMIN" || req.user.role === "PHARMACIST") && !hospitalId) {
      return res.status(400).json({ message: "Hospital context required" });
    }
    const period = parsePeriod(req.query.period) ?? "last30days";
    const search = (req.query.search as string) || (req.query.medicine as string) || undefined;
    const result = await getInventoryReport(hospitalId, {
      period,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      search: search?.trim() || undefined,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
